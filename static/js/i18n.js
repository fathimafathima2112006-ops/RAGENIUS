/* RAGENIUS UI language — one setting controls the complete app shell. */
(function () {
  const dictionaries = {
    English: {
      tagline:'Your Knowledge. Our Intelligence.', search_placeholder:'Search your documents, ask anything...',
      chat_section:'CHAT', knowledge_section:'KNOWLEDGE', insights_section:'INSIGHTS', system_section:'SYSTEM',
      dashboard:'Chat', knowledge_base:'Knowledge Base', documents:'Documents', chunk_explorer:'Chunk Explorer',
      retrieval_explorer:'Retrieval Explorer', analytics:'Analytics & Evaluation', chat_history:'Chat History', settings:'Settings',
      footer_brand:'RAGENIUS | AI Powered Knowledge Assistant', system_online:'System Online', logout:'Logout',
      chat_placeholder:'Ask anything... (Type, speak or upload PDF)', voice_input:'Voice input', attach_pdf:'Attach PDF', send:'Send',
      ai_model:'🧬 AI Model', retrieved_context:'🧩 Retrieved Context', tips:'✨ RAGENIUS Tips', quick_actions:'⚡ Quick Actions',
      settings_title:'⚙️ Settings', settings_subtitle:'Manage your profile, preferences and account security.', profile:'👤 Profile', preferences:'🎨 Preferences',
      theme:'Theme', default_language:'Default chat language', language_help:'Changes the language of the whole RAGENIUS web app and AI replies.',
      auto_read:'Auto read-aloud answers', sound_effects:'Sound effects', change_password:'🔐 Change Password', account_stats:'📊 Account Stats', update_password:'Update Password',
      web_sources:'Web Sources', tip_auto:'Use Auto to follow your language naturally.', tip_voice:'Use the 🎤 voice button for hands-free questions.', tip_pdf:'Upload a PDF when you want document-grounded answers.', upload_pdf:'⬆️ Upload PDF', new_chat:'💬 New Chat', read_answer:'🔊 Read Answer', my_documents:'📁 My Documents', search_documents:'Search documents...', chat_history_title:'🕘 Chat History', history_subtitle:'Every chat is saved automatically. Open any conversation to continue it.', search_conversations:'Search conversations...'
    },
    Tamil: {
      tagline:'உங்கள் அறிவு. எங்கள் நுண்ணறிவு.', search_placeholder:'உங்கள் documents-ஐ தேடுங்கள், எதையும் கேளுங்கள்...',
      chat_section:'CHAT', knowledge_section:'அறிவு', insights_section:'INSIGHTS', system_section:'SYSTEM', dashboard:'Chat', knowledge_base:'Knowledge Base', documents:'Documents',
      chunk_explorer:'Chunk Explorer', retrieval_explorer:'Retrieval Explorer', analytics:'Analytics & Evaluation', chat_history:'Chat History', settings:'Settings',
      footer_brand:'RAGENIUS | AI Powered Knowledge Assistant', system_online:'System Online', logout:'வெளியேறு', chat_placeholder:'எதையும் கேளுங்கள்... (Type, speak அல்லது PDF upload செய்யுங்கள்)',
      voice_input:'Voice input', attach_pdf:'PDF இணைக்கவும்', send:'அனுப்பு', ai_model:'🧬 AI Model', retrieved_context:'🧩 Retrieved Context', tips:'✨ RAGENIUS Tips', quick_actions:'⚡ Quick Actions',
      settings_title:'⚙️ Settings', settings_subtitle:'Profile, preferences மற்றும் account security-ஐ நிர்வகிக்கவும்.', profile:'👤 Profile', preferences:'🎨 Preferences', theme:'Theme',
      default_language:'Default chat language', language_help:'இந்த setting முழு RAGENIUS web app மற்றும் AI replies-ன் மொழியை மாற்றும்.', auto_read:'Auto read-aloud answers', sound_effects:'Sound effects',
      change_password:'🔐 Password மாற்றம்', account_stats:'📊 Account Stats', update_password:'Password Update', chat_history_title:'🕘 Chat History',
      history_subtitle:'உங்கள் chats அனைத்தும் தானாக save ஆகும். பழைய chat-ஐ திறந்து தொடரலாம்.', search_conversations:'Chats-ஐ தேடுங்கள்...'
    },
    Tanglish: {
      tagline:'Ungal Knowledge. Engal Intelligence.', search_placeholder:'Documents-a search pannunga, anything kekkalam...',
      chat_section:'CHAT', knowledge_section:'KNOWLEDGE', insights_section:'INSIGHTS', system_section:'SYSTEM', dashboard:'Chat', knowledge_base:'Knowledge Base', documents:'Documents',
      chunk_explorer:'Chunk Explorer', retrieval_explorer:'Retrieval Explorer', analytics:'Analytics & Evaluation', chat_history:'Chat History', settings:'Settings',
      footer_brand:'RAGENIUS | AI Powered Knowledge Assistant', system_online:'System Online', logout:'Logout', chat_placeholder:'Anything kekkalam... (Type, speak illa PDF upload pannunga)',
      voice_input:'Voice input', attach_pdf:'PDF attach pannunga', send:'Send', ai_model:'🧬 AI Model', retrieved_context:'🧩 Retrieved Context', tips:'✨ RAGENIUS Tips', quick_actions:'⚡ Quick Actions',
      settings_title:'⚙️ Settings', settings_subtitle:'Profile, preferences, account security ellam manage pannunga.', profile:'👤 Profile', preferences:'🎨 Preferences', theme:'Theme',
      default_language:'Default chat language', language_help:'Intha setting full RAGENIUS web app + AI replies language-a change pannum.', auto_read:'Auto read-aloud answers', sound_effects:'Sound effects',
      change_password:'🔐 Change Password', account_stats:'📊 Account Stats', update_password:'Update Password', web_sources:'Web Sources', tip_auto:'Language-a natural-a follow panna Auto use pannunga.', tip_voice:'Hands-free questions-ku 🎤 voice button use pannunga.', tip_pdf:'Document-based answer venumna PDF upload pannunga.', upload_pdf:'⬆️ PDF Upload', new_chat:'💬 New Chat', read_answer:'🔊 Answer Read', my_documents:'📁 En Documents', search_documents:'Documents search pannunga...', chat_history_title:'🕘 Chat History',
      history_subtitle:'Ungal chats automatic-a save aagum. Old chat open panni continue pannalam.', search_conversations:'Chats search pannunga...'
    },
    Hindi: {
      tagline:'आपका ज्ञान। हमारी बुद्धिमत्ता।', search_placeholder:'अपने दस्तावेज़ खोजें, कुछ भी पूछें...', chat_section:'चैट', knowledge_section:'ज्ञान', insights_section:'इनसाइट्स', system_section:'सिस्टम',
      dashboard:'डैशबोर्ड', knowledge_base:'नॉलेज बेस', documents:'दस्तावेज़', chunk_explorer:'चंक एक्सप्लोरर', retrieval_explorer:'रिट्रीवल एक्सप्लोरर', analytics:'एनालिटिक्स और मूल्यांकन', chat_history:'चैट इतिहास', settings:'सेटिंग्स',
      footer_brand:'RAGENIUS | AI ज्ञान सहायक', system_online:'सिस्टम ऑनलाइन', logout:'लॉग आउट', chat_placeholder:'कुछ भी पूछें... (टाइप करें, बोलें या PDF अपलोड करें)', voice_input:'वॉइस इनपुट', attach_pdf:'PDF जोड़ें', send:'भेजें',
      ai_model:'🧬 AI मॉडल', retrieved_context:'🧩 प्राप्त संदर्भ', tips:'✨ RAGENIUS टिप्स', quick_actions:'⚡ त्वरित कार्य', settings_title:'⚙️ सेटिंग्स', settings_subtitle:'प्रोफ़ाइल, प्राथमिकताएँ और अकाउंट सुरक्षा प्रबंधित करें।', profile:'👤 प्रोफ़ाइल', preferences:'🎨 प्राथमिकताएँ', theme:'थीम',
      default_language:'डिफ़ॉल्ट चैट भाषा', language_help:'यह पूरी RAGENIUS वेब ऐप और AI उत्तरों की भाषा बदलता है।', auto_read:'उत्तर अपने आप पढ़ें', sound_effects:'ध्वनि प्रभाव', change_password:'🔐 पासवर्ड बदलें', account_stats:'📊 अकाउंट आँकड़े', update_password:'पासवर्ड अपडेट करें',
      web_sources:'Web Sources', tip_auto:'மொழியை இயல்பாக பின்பற்ற Auto பயன்படுத்துங்கள்.', tip_voice:'Hands-free கேள்விகளுக்கு 🎤 voice button பயன்படுத்துங்கள்.', tip_pdf:'உங்கள் documents-ஐ வைத்து பதில் பெற PDF upload செய்யுங்கள்.', upload_pdf:'⬆️ PDF Upload', new_chat:'💬 புதிய Chat', read_answer:'🔊 பதிலை வாசிக்க', my_documents:'📁 என் Documents', search_documents:'Documents-ஐ தேடுங்கள்...', 
      chat_history_title:'🕘 चैट इतिहास', history_subtitle:'आपकी सभी चैट अपने आप सेव होती हैं। किसी पुरानी चैट को खोलकर जारी रखें।', search_conversations:'चैट खोजें...'
    },
    Telugu: {
      tagline:'మీ జ్ఞానం. మా మేధస్సు.', search_placeholder:'మీ డాక్యుమెంట్లను వెతకండి, ఏదైనా అడగండి...', chat_section:'చాట్', knowledge_section:'జ్ఞానం', insights_section:'ఇన్‌సైట్స్', system_section:'సిస్టమ్',
      dashboard:'డ్యాష్‌బోర్డ్', knowledge_base:'నాలెడ్జ్ బేస్', documents:'డాక్యుమెంట్లు', chunk_explorer:'చంక్ ఎక్స్‌ప్లోరర్', retrieval_explorer:'రిట్రీవల్ ఎక్స్‌ప్లోరర్', analytics:'అనలిటిక్స్ & మూల్యాంకనం', chat_history:'చాట్ హిస్టరీ', settings:'సెట్టింగ్స్',
      footer_brand:'RAGENIUS | AI నాలెడ్జ్ అసిస్టెంట్', system_online:'సిస్టమ్ ఆన్‌లైన్', logout:'లాగ్ అవుట్', chat_placeholder:'ఏదైనా అడగండి... (టైప్ చేయండి, మాట్లాడండి లేదా PDF అప్లోడ్ చేయండి)', voice_input:'వాయిస్ ఇన్‌పుట్', attach_pdf:'PDF జోడించండి', send:'పంపండి',
      ai_model:'🧬 AI మోడల్', retrieved_context:'🧩 పొందిన సందర్భం', tips:'✨ RAGENIUS చిట్కాలు', quick_actions:'⚡ త్వరిత చర్యలు', settings_title:'⚙️ సెట్టింగ్స్', settings_subtitle:'మీ ప్రొఫైల్, ప్రాధాన్యతలు మరియు అకౌంట్ భద్రతను నిర్వహించండి.', profile:'👤 ప్రొఫైల్', preferences:'🎨 ప్రాధాన్యతలు', theme:'థీమ్',
      default_language:'డిఫాల్ట్ చాట్ భాష', language_help:'ఇది మొత్తం RAGENIUS వెబ్ యాప్ మరియు AI సమాధానాల భాషను మారుస్తుంది.', auto_read:'సమాధానాలను ఆటో రీడ్ చేయండి', sound_effects:'సౌండ్ ఎఫెక్ట్స్', change_password:'🔐 పాస్‌వర్డ్ మార్చండి', account_stats:'📊 అకౌంట్ గణాంకాలు', update_password:'పాస్‌వర్డ్ అప్‌డేట్',
      web_sources:'వెబ్ మూలాలు', tip_auto:'భాషను సహజంగా అనుసరించడానికి Auto ఎంచుకోండి.', tip_voice:'హ్యాండ్స్-ఫ్రీ ప్రశ్నలకు 🎤 వాయిస్ బటన్ ఉపయోగించండి.', tip_pdf:'డాక్యుమెంట్ ఆధారిత సమాధానాల కోసం PDF అప్లోడ్ చేయండి.', upload_pdf:'⬆️ PDF అప్లోడ్', new_chat:'💬 కొత్త చాట్', read_answer:'🔊 సమాధానం చదవండి', my_documents:'📁 నా డాక్యుమెంట్లు', search_documents:'డాక్యుమెంట్లను వెతకండి...', 
      chat_history_title:'🕘 చాట్ హిస్టరీ', history_subtitle:'మీ అన్ని చాట్లు ఆటోమేటిక్‌గా సేవ్ అవుతాయి. పాత చాట్‌ను తెరిచి కొనసాగించండి.', search_conversations:'చాట్లను వెతకండి...'
    },
    Malayalam: {
      tagline:'നിങ്ങളുടെ അറിവ്. ഞങ്ങളുടെ ബുദ്ധി.', search_placeholder:'ഡോക്യുമെന്റുകൾ തിരയൂ, എന്തും ചോദിക്കൂ...', chat_section:'ചാറ്റ്', knowledge_section:'അറിവ്', insights_section:'ഇൻസൈറ്റ്സ്', system_section:'സിസ്റ്റം',
      dashboard:'ഡാഷ്ബോർഡ്', knowledge_base:'നോളജ് ബേസ്', documents:'ഡോക്യുമെന്റുകൾ', chunk_explorer:'ചങ്ക് എക്സ്പ്ലോറർ', retrieval_explorer:'റിട്രീവൽ എക്സ്പ്ലോറർ', analytics:'അനലിറ്റിക്സ് & വിലയിരുത്തൽ', chat_history:'ചാറ്റ് ചരിത്രം', settings:'സെറ്റിംഗ്സ്',
      footer_brand:'RAGENIUS | AI നോളജ് അസിസ്റ്റന്റ്', system_online:'സിസ്റ്റം ഓൺലൈൻ', logout:'ലോഗ് ഔട്ട്', chat_placeholder:'എന്തും ചോദിക്കൂ... (ടൈപ്പ് ചെയ്യൂ, സംസാരിക്കൂ അല്ലെങ്കിൽ PDF അപ്ലോഡ് ചെയ്യൂ)', voice_input:'വോയ്സ് ഇൻപുട്ട്', attach_pdf:'PDF ചേർക്കുക', send:'അയയ്ക്കുക',
      ai_model:'🧬 AI മോഡൽ', retrieved_context:'🧩 ലഭിച്ച കോൺടെക്സ്റ്റ്', tips:'✨ RAGENIUS ടിപ്പുകൾ', quick_actions:'⚡ ദ്രുത പ്രവർത്തനങ്ങൾ', settings_title:'⚙️ സെറ്റിംഗ്സ്', settings_subtitle:'പ്രൊഫൈൽ, മുൻഗണനകൾ, അക്കൗണ്ട് സുരക്ഷ എന്നിവ നിയന്ത്രിക്കുക.', profile:'👤 പ്രൊഫൈൽ', preferences:'🎨 മുൻഗണനകൾ', theme:'തീം',
      default_language:'ഡിഫോൾട്ട് ചാറ്റ് ഭാഷ', language_help:'മുഴുവൻ RAGENIUS വെബ് ആപ്പിന്റെയും AI മറുപടികളുടെയും ഭാഷ മാറ്റുന്നു.', auto_read:'മറുപടികൾ ഓട്ടോ റീഡ് ചെയ്യുക', sound_effects:'സൗണ്ട് ഇഫക്റ്റുകൾ', change_password:'🔐 പാസ്‌വേഡ് മാറ്റുക', account_stats:'📊 അക്കൗണ്ട് സ്ഥിതിവിവരങ്ങൾ', update_password:'പാസ്‌വേഡ് അപ്ഡേറ്റ്',
      web_sources:'വെബ് ഉറവിടങ്ങൾ', tip_auto:'ഭാഷ സ്വാഭാവികമായി പിന്തുടരാൻ Auto തിരഞ്ഞെടുക്കുക.', tip_voice:'ഹാൻഡ്സ്-ഫ്രീ ചോദ്യങ്ങൾക്ക് 🎤 വോയ്സ് ബട്ടൺ ഉപയോഗിക്കുക.', tip_pdf:'ഡോക്യുമെന്റ് അടിസ്ഥാനത്തിലുള്ള മറുപടികൾക്ക് PDF അപ്ലോഡ് ചെയ്യുക.', upload_pdf:'⬆️ PDF അപ്ലോഡ്', new_chat:'💬 പുതിയ ചാറ്റ്', read_answer:'🔊 മറുപടി വായിക്കുക', my_documents:'📁 എന്റെ ഡോക്യുമെന്റുകൾ', search_documents:'ഡോക്യുമെന്റുകൾ തിരയുക...', 
      chat_history_title:'🕘 ചാറ്റ് ചരിത്രം', history_subtitle:'നിങ്ങളുടെ എല്ലാ ചാറ്റുകളും സ്വയം സേവ് ചെയ്യും. പഴയ ചാറ്റ് തുറന്ന് തുടരാം.', search_conversations:'ചാറ്റുകൾ തിരയുക...'
    },
    Kannada: {
      tagline:'ನಿಮ್ಮ ಜ್ಞಾನ. ನಮ್ಮ ಬುದ್ಧಿಮತ್ತೆ.', search_placeholder:'ನಿಮ್ಮ ಡಾಕ್ಯುಮೆಂಟ್‌ಗಳನ್ನು ಹುಡುಕಿ, ಏನಾದರೂ ಕೇಳಿ...', chat_section:'ಚಾಟ್', knowledge_section:'ಜ್ಞಾನ', insights_section:'ಇನ್‌ಸೈಟ್ಸ್', system_section:'ಸಿಸ್ಟಮ್',
      dashboard:'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', knowledge_base:'ನಾಲೆಡ್ಜ್ ಬೇಸ್', documents:'ಡಾಕ್ಯುಮೆಂಟ್‌ಗಳು', chunk_explorer:'ಚಂಕ್ ಎಕ್ಸ್‌ಪ್ಲೋರರ್', retrieval_explorer:'ರಿಟ್ರೀವಲ್ ಎಕ್ಸ್‌ಪ್ಲೋರರ್', analytics:'ಅನಾಲಿಟಿಕ್ಸ್ & ಮೌಲ್ಯಮಾಪನ', chat_history:'ಚಾಟ್ ಇತಿಹಾಸ', settings:'ಸೆಟ್ಟಿಂಗ್ಸ್',
      footer_brand:'RAGENIUS | AI ಜ್ಞಾನ ಸಹಾಯಕ', system_online:'ಸಿಸ್ಟಮ್ ಆನ್‌ಲೈನ್', logout:'ಲಾಗ್ ಔಟ್', chat_placeholder:'ಏನಾದರೂ ಕೇಳಿ... (ಟೈಪ್ ಮಾಡಿ, ಮಾತನಾಡಿ ಅಥವಾ PDF ಅಪ್ಲೋಡ್ ಮಾಡಿ)', voice_input:'ವಾಯ್ಸ್ ಇನ್‌ಪುಟ್', attach_pdf:'PDF ಸೇರಿಸಿ', send:'ಕಳುಹಿಸಿ',
      ai_model:'🧬 AI ಮಾದರಿ', retrieved_context:'🧩 ಪಡೆದ ಸಂದರ್ಭ', tips:'✨ RAGENIUS ಸಲಹೆಗಳು', quick_actions:'⚡ ತ್ವರಿತ ಕ್ರಿಯೆಗಳು', settings_title:'⚙️ ಸೆಟ್ಟಿಂಗ್ಸ್', settings_subtitle:'ಪ್ರೊಫೈಲ್, ಆದ್ಯತೆಗಳು ಮತ್ತು ಖಾತೆ ಭದ್ರತೆಯನ್ನು ನಿರ್ವಹಿಸಿ.', profile:'👤 ಪ್ರೊಫೈಲ್', preferences:'🎨 ಆದ್ಯತೆಗಳು', theme:'ಥೀಮ್',
      default_language:'ಡೀಫಾಲ್ಟ್ ಚಾಟ್ ಭಾಷೆ', language_help:'ಇದು ಸಂಪೂರ್ಣ RAGENIUS ವೆಬ್ ಅಪ್ ಮತ್ತು AI ಉತ್ತರಗಳ ಭಾಷೆಯನ್ನು ಬದಲಾಯಿಸುತ್ತದೆ.', auto_read:'ಉತ್ತರಗಳನ್ನು ಸ್ವಯಂ ಓದಿ', sound_effects:'ಸೌಂಡ್ ಎಫೆಕ್ಟ್ಸ್', change_password:'🔐 ಪಾಸ್‌ವರ್ಡ್ ಬದಲಿಸಿ', account_stats:'📊 ಖಾತೆ ಅಂಕಿಅಂಶಗಳು', update_password:'ಪಾಸ್‌ವರ್ಡ್ ಅಪ್‌ಡೇಟ್',
      web_sources:'ವೆಬ್ ಮೂಲಗಳು', tip_auto:'ಭಾಷೆಯನ್ನು ಸಹಜವಾಗಿ ಅನುಸರಿಸಲು Auto ಆಯ್ಕೆಮಾಡಿ.', tip_voice:'ಹ್ಯಾಂಡ್ಸ್-ಫ್ರೀ ಪ್ರಶ್ನೆಗಳಿಗೆ 🎤 ವಾಯ್ಸ್ ಬಟನ್ ಬಳಸಿ.', tip_pdf:'ಡಾಕ್ಯುಮೆಂಟ್ ಆಧಾರಿತ ಉತ್ತರಗಳಿಗೆ PDF ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.', upload_pdf:'⬆️ PDF ಅಪ್‌ಲೋಡ್', new_chat:'💬 ಹೊಸ ಚಾಟ್', read_answer:'🔊 ಉತ್ತರ ಓದಿ', my_documents:'📁 ನನ್ನ ಡಾಕ್ಯುಮೆಂಟ್‌ಗಳು', search_documents:'ಡಾಕ್ಯುಮೆಂಟ್‌ಗಳನ್ನು ಹುಡುಕಿ...', 
      chat_history_title:'🕘 ಚಾಟ್ ಇತಿಹಾಸ', history_subtitle:'ನಿಮ್ಮ ಎಲ್ಲಾ ಚಾಟ್‌ಗಳು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಉಳಿಯುತ್ತವೆ. ಹಳೆಯ ಚಾಟ್ ತೆರೆಯಿರಿ ಮತ್ತು ಮುಂದುವರಿಸಿ.', search_conversations:'ಚಾಟ್‌ಗಳನ್ನು ಹುಡುಕಿ...'
    }
  };

  function selectedLanguage() {
    return localStorage.getItem('ragenius_default_lang') || 'Auto';
  }

  function dictionary() {
    const lang = selectedLanguage();
    return dictionaries[lang] || dictionaries.English;
  }

  function applyLanguage() {
    const dict = dictionary();
    document.documentElement.lang = selectedLanguage().toLowerCase();
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (dict[key]) el.textContent = dict[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      if (dict[key]) el.setAttribute('placeholder', dict[key]);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.dataset.i18nTitle;
      if (dict[key]) el.setAttribute('title', dict[key]);
    });
  }

  window.RAGENIUS_I18N = { dictionaries, applyLanguage, selectedLanguage };
  applyLanguage();
  window.addEventListener('storage', applyLanguage);
  window.addEventListener('ragenius-language-changed', applyLanguage);
})();
