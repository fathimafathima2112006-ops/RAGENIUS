# 🧠 RAGENIUS 3.0 — Enterprise RAG Knowledge Assistant

RAGENIUS is a Flask-based multilingual AI/RAG workspace with conversational chat, document grounding, hybrid retrieval, reranking, source citations, voice input/output, analytics, feedback and enterprise-oriented observability.

## What was upgraded

### 💬 AI Chat
- Natural greetings and conversational replies (`hai` → greeting, `bye` → goodbye)
- Follow-up conversation context
- English, Tamil, Tanglish, Hindi, Telugu, Malayalam and Kannada
- Voice input inside Chat only
- Browser read-aloud
- Markdown rendering with tables, headings, bullets and bold text
- Literal `<br>` cleanup
- 👍 / 👎 feedback
- PDF/Web source labels
- Confidence indicator

### 🔎 Retrieval Explorer
- Query expansion / multi-query variants
- BM25-style lexical scoring
- Vector-like token overlap signal
- Hybrid score
- Reranking stage
- Chunk/page/source inspection
- Retrieval metrics and score breakdown
- JSON API: `/api/retrieval`

> The current implementation is intentionally dependency-light. It calls the retrieval layer **hybrid (BM25-style + vector-like lexical)** rather than pretending it is a production embedding index. A real Qdrant/FAISS/OpenSearch/Sentence-Transformers backend can be plugged into `retrieve_hybrid()` later without changing the Chat UI contract.

### 📊 Analytics & Evaluation
- Query count
- Document/chunk counts
- Average response latency
- Confidence tracking
- Retrieval and LLM timing
- Feedback summary
- Retrieval/LLM event table
- RAGAS-inspired local diagnostic metrics:
  - Faithfulness
  - Answer Relevancy
  - Context Precision
  - Context Recall

These four metrics are **local heuristic diagnostics**, not official RAGAS benchmark scores.

### 📄 Smart documents
Supported uploads:
- PDF
- DOCX
- PPTX
- XLSX
- TXT
- Markdown

PDFs are page-aware. DOCX/PPTX/XLSX extraction uses lightweight ZIP/XML parsing so the base project stays small.

### 🛡️ Enterprise foundations
- Password hashing
- User-scoped document access
- User-scoped conversations
- Role field (`user` by default)
- Tenant ID field
- Audit log table
- Document isolation
- Existing SQLite database migration on startup

### 🎙️ Voice
Voice Assistant is no longer a separate sidebar feature. Voice input and read-aloud are integrated directly into Chat using the browser Web Speech APIs.

### 🎨 UI
- Global Light/Dark theme
- Settings-only language control
- Responsive desktop/mobile layout
- Upgraded login branding with clearly visible RAGENIUS logo
- Chat History correctly opens the selected conversation

## Architecture

```text
User
 ↓
RAGENIUS Chat
 ↓
Conversation Context
 ↓
Query Expansion / Multi Query
 ↓
Hybrid Retriever
 ├─ BM25-style lexical signal
 └─ Vector-like token signal
 ↓
Reranker
 ↓
Context Builder
 ↓
Groq LLM
 ↓
Answer + Citations + Confidence
 ↓
Feedback + Evaluation + Analytics
```

## Setup

```bash
cd RAG1
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create `.env` from `.env.example`:

```env
GROQ_API_KEY=your_key
GROQ_MODEL=llama-3.3-70b-versatile
SECRET_KEY=change-me
```

Run:

```bash
python app.py
```

Open `http://127.0.0.1:5000`.

## Docker

```bash
docker compose up --build
```

The SQLite database is persisted in `instance/` and uploaded documents in `uploads/`.

## Important production extensions

The code now exposes clean seams for adding real enterprise infrastructure:

- **OpenSearch/Elasticsearch** for BM25
- **Qdrant/FAISS/pgvector** for embeddings
- **Cross-encoder/Cohere Rerank** for production reranking
- **RAGAS** for formal evaluation
- **Neo4j** for GraphRAG
- **Redis** for caching/rate limiting
- **OIDC/Azure AD/Google OAuth** for enterprise SSO
- **LangSmith/OpenTelemetry** for tracing
- **PostgreSQL** for multi-instance production deployments
- **Celery/RQ** for asynchronous document indexing
- **Kubernetes + CI/CD** for production deployment

These integrations require their own credentials/services and are not falsely represented as active in the local SQLite build.

## Existing data

The application runs a lightweight schema migration at startup. Existing RAGENIUS users, conversations and documents remain usable.

## Browser voice support

Voice input/output uses the browser's Web Speech API. Chrome/Edge generally provide the best compatibility. Microphone permission must be allowed.

## vNext upgrades
- Natural conversational intent handling for English/Tamil/Tanglish, including casual prompts such as “enna panura”, “good morning”, “what are you doing”, etc.
- Stronger Tanglish intent interpretation and answer-format instructions (meaning, tables, comparisons, steps, flow diagrams, bold key terms).
- 600 MB upload limit with expanded common document, spreadsheet, presentation, text/code, structured-data and image/OCR support.
- Upload input accepts all files in the browser; server indexes supported common formats and returns a clear message for unreadable formats.
- RAGENIUS SVG brain logo is now visible beside the brand name on login and in the application header.

## RAGENIUS Full AI Chat Upgrade

This build includes:
- Natural conversational handling for greetings, thanks, good morning/night, "enna panura", emotional/supportive messages, and follow-ups.
- Tanglish understanding for common phonetic/slang forms such as `enna`, `epdi`, `yapadi`, `sollu`, `solu`, `kudu`, `venum`, `puriyala`, `crt pannu`.
- LLM prompt routing for definitions, comparisons (Markdown tables), procedures, architecture/flow diagrams, coding, maths, and document-grounded answers.
- Clean Markdown rendering with bold important words and no literal `<br>` tags.
- PDF/document citations only when retrieval is actually relevant.
- Natural fallback answers when the LLM provider is temporarily unavailable; provider error details are not shown in the chat.
- Login branding fix: the RAGENIUS brain logo on the right-side login card is now an inline SVG and remains visible on dark backgrounds.
- Upload limit remains **600 MB per file** and supports PDF, DOCX/DOC, PPTX/PPT, XLSX/XLS/CSV/TSV, TXT/MD, JSON/XML/HTML, code/text formats, ODT/ODS/ODP, and common images.
- RetrievalEvent SQLAlchemy `query` naming conflict fixed everywhere by using `db.session.query(...)` for ORM queries while preserving the physical database column.

For full open-domain AI generation, configure a valid `GROQ_API_KEY` in `.env` and restart Flask.

## Latest language + retrieval upgrade
- Explicit language requests such as `talk in English`, `reply in Tamil`, `தமிழில் பேசு`, and `Tanglish la pesu` override the UI default for that turn.
- After an explicit language request, Chat returns to Auto language following so subsequent messages can be answered in the language the user naturally uses.
- Retrieval Explorer now exposes candidate count, rejected/below-gate candidates, cleaned topic query, intent, query variants, hybrid/BM25/vector/rerank scores, and relevance-gate decisions.
- Login includes polished Google and Microsoft provider buttons. These are UI/provider entry points; real OAuth requires provider credentials and callback configuration.
- Internal chain-of-thought is never exposed. Chat shows only safe high-level processing status such as understanding, checking relevant knowledge, and writing the answer.
