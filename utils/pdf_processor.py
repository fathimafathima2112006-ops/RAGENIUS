"""Multi-format document extraction + chunking for RAGENIUS."""
import re
import csv
import json
import html as html_lib
import zipfile
import xml.etree.ElementTree as ET
from pypdf import PdfReader

CHUNK_SIZE_WORDS = 180
CHUNK_OVERLAP_WORDS = 30


def _split_into_chunks(text, size=CHUNK_SIZE_WORDS, overlap=CHUNK_OVERLAP_WORDS):
    words = text.split()
    if not words: return []
    chunks=[]; start=0
    while start < len(words):
        end=start+size; chunks.append(" ".join(words[start:end]))
        if end>=len(words): break
        start=end-overlap
    return chunks


def _xml_text(path, tag_names):
    with zipfile.ZipFile(path) as z:
        names=[n for n in z.namelist() if any(x in n for x in tag_names)]
        out=[]
        for n in names:
            try:
                root=ET.fromstring(z.read(n))
                texts=[t.text or "" for t in root.iter() if t.tag.endswith('}t')]
                if texts: out.append(" ".join(texts))
            except Exception: pass
        return "\n".join(out)


def _plain_text_file(path):
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        return f.read()

def _image_ocr(path):
    try:
        from PIL import Image
        import pytesseract
        return pytesseract.image_to_string(Image.open(path))
    except Exception:
        return ''

def extract_chunks_from_file(path, ext):
    ext=ext.lower().lstrip('.')
    metadata={"format":ext}
    if ext=='pdf':
        reader=PdfReader(path); pages=len(reader.pages); all_chunks=[]
        multimodal_pages=0; image_ocr_pages=0
        for page_num,page in enumerate(reader.pages,1):
            try: text=page.extract_text() or ''
            except Exception: text=''
            # Optional table extraction: pdfplumber preserves table cell structure when installed.
            try:
                import pdfplumber
                with pdfplumber.open(path) as pp:
                    if page_num <= len(pp.pages):
                        tables=pp.pages[page_num-1].extract_tables() or []
                        if tables:
                            table_lines=[]
                            for table in tables:
                                for row in table:
                                    vals=[str(v or '').strip() for v in row]
                                    if any(vals): table_lines.append(' | '.join(vals))
                            if table_lines:
                                text += '\n TABLE DATA: ' + '\n'.join(table_lines); multimodal_pages += 1
            except Exception:
                pass
            # Optional image/chart OCR for scanned/image-heavy PDF pages.
            if len(text.strip()) < 40:
                try:
                    import fitz
                    from PIL import Image
                    import pytesseract
                    pdf=fitz.open(path); pix=pdf[page_num-1].get_pixmap(matrix=fitz.Matrix(1.5,1.5), alpha=False)
                    img=Image.frombytes('RGB',[pix.width,pix.height],pix.samples)
                    ocr=pytesseract.image_to_string(img)
                    if ocr.strip(): text += '\n IMAGE/CHART OCR: ' + ocr; image_ocr_pages += 1
                    pdf.close()
                except Exception:
                    pass
            text=re.sub(r'\s+',' ',text).strip()
            for chunk in _split_into_chunks(text): all_chunks.append((page_num,chunk))
        metadata["pages"]=pages
        metadata["multimodal"]=True
        metadata["table_pages"]=multimodal_pages
        metadata["image_ocr_pages"]=image_ocr_pages
        return all_chunks,pages,metadata
    if ext=='docx':
        text=_xml_text(path,['word/document.xml']); chunks=_split_into_chunks(re.sub(r'\s+',' ',text).strip()); return [(1,c) for c in chunks],1,metadata
    if ext=='pptx':
        text=_xml_text(path,['ppt/slides/slide']); chunks=_split_into_chunks(re.sub(r'\s+',' ',text).strip()); return [(i+1,c) for i,c in enumerate(chunks)],max(1,len(chunks)),metadata
    if ext in {'odt','odp'}:
        # OpenDocument files are ZIP containers. Extract visible text from
        # content.xml so ODT/ODP uploads remain searchable without LibreOffice.
        try:
            with zipfile.ZipFile(path) as z:
                raw=z.read('content.xml')
            root=ET.fromstring(raw)
            text=' '.join((node.text or '') for node in root.iter() if node.text)
            text=re.sub(r'\s+',' ',text).strip()
            chunks=_split_into_chunks(text)
            return [(1,c) for c in chunks],1,metadata
        except Exception:
            return [],1,metadata
    if ext in {'xlsx','xls','ods'}:
        try:
            import pandas as pd
            sheets = pd.read_excel(path, sheet_name=None)
            chunks=[]
            for idx,(name,df) in enumerate(sheets.items(),1):
                txt = f'Sheet: {name}\n' + df.fillna('').astype(str).to_csv(index=False)
                for c in _split_into_chunks(re.sub(r'\s+',' ',txt).strip()): chunks.append((idx,c))
            return chunks,max(1,len(sheets)),metadata
        except Exception:
            pass
        with zipfile.ZipFile(path) as z:
            shared=[]
            if 'xl/sharedStrings.xml' in z.namelist():
                root=ET.fromstring(z.read('xl/sharedStrings.xml')); shared=[''.join(t.text or '' for t in si.iter() if t.tag.endswith('}t')) for si in root]
            sheets=[n for n in z.namelist() if n.startswith('xl/worksheets/sheet') and n.endswith('.xml')]
            chunks=[]
            for idx,n in enumerate(sheets,1):
                root=ET.fromstring(z.read(n)); vals=[]
                for cell in root.iter():
                    if cell.tag.endswith('}c'):
                        val=next((x.text for x in cell if x.tag.endswith('}v')),None); typ=cell.attrib.get('t')
                        if val is not None: vals.append(shared[int(val)] if typ=='s' and val.isdigit() and int(val)<len(shared) else val)
                for c in _split_into_chunks(' | '.join(vals)): chunks.append((idx,c))
            return chunks,max(1,len(sheets)),metadata
    if ext in {'csv','tsv'}:
        with open(path,'r',encoding='utf-8',errors='ignore',newline='') as f: text=f.read()
        text = text.replace('\t',' | ') if ext=='tsv' else text.replace(',', ' | ')
        chunks=_split_into_chunks(re.sub(r'\s+',' ',text).strip()); return [(1,c) for c in chunks],1,metadata
    if ext in {'json'}:
        raw=_plain_text_file(path)
        try: text=json.dumps(json.loads(raw), ensure_ascii=False, indent=2)
        except Exception: text=raw
        chunks=_split_into_chunks(re.sub(r'\s+',' ',text).strip()); return [(1,c) for c in chunks],1,metadata
    if ext in {'xml','html','htm'}:
        raw=_plain_text_file(path)
        text=re.sub(r'<script[\s\S]*?</script>|<style[\s\S]*?</style>', ' ', raw, flags=re.I)
        text=re.sub(r'<[^>]+>', ' ', text)
        text=html_lib.unescape(text)
        chunks=_split_into_chunks(re.sub(r'\s+',' ',text).strip()); return [(1,c) for c in chunks],1,metadata
    if ext in {'doc','ppt','rtf'}:
        raw=_plain_text_file(path)
        chunks=_split_into_chunks(re.sub(r'\s+',' ',raw).strip()); return [(1,c) for c in chunks],1,metadata
    if ext in {'png','jpg','jpeg','webp'}:
        text=_image_ocr(path)
        chunks=_split_into_chunks(re.sub(r'\s+',' ',text).strip()); return [(1,c) for c in chunks],1,metadata
    text=_plain_text_file(path)
    chunks=_split_into_chunks(re.sub(r'\s+',' ',text).strip()); return [(1,c) for c in chunks],1,metadata


def extract_chunks_from_pdf(path):
    chunks,pages,_=extract_chunks_from_file(path,'pdf'); return chunks,pages
