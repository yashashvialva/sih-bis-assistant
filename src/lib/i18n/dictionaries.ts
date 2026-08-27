// BIS Compliance Assistant — Internationalization (i18n)
// Architecture: Core reasoning in English → Final rendered strings translated
// Only translate final rendered strings for this prototype.

export type SupportedLanguage = 'en' | 'hi';

const dictionaries: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.assistant': 'BIS Assistant',
    'nav.products': 'My Products',
    'nav.labs': 'Labs',
    'nav.verify': 'Verify',
    'nav.alerts': 'Alerts',
    'nav.settings': 'Settings',

    // Landing
    'landing.title': 'BIS Compliance Assistant',
    'landing.subtitle': 'AI-powered compliance guidance for Indian manufacturers & MSMEs',
    'landing.cta': 'Get Started',
    'landing.assistantCta': 'Ask the BIS Assistant',

    // Assistant
    'assistant.title': 'BIS Compliance Assistant',
    'assistant.placeholder': 'Ask about BIS standards, certifications, testing requirements...',
    'assistant.send': 'Send',
    'assistant.thinking': 'Searching BIS corpus and generating response...',
    'assistant.welcome': 'Ask me about Indian Standards, product requirements, certification processes, or testing requirements. I will search the curated BIS corpus and provide sourced answers.',

    // Trust badges
    'trust.verified': 'Verified against BIS data',
    'trust.interpretation': 'AI Interpretation — Non-binding guidance',
    'trust.nosource': 'No Authoritative Source Found',

    // Products
    'products.title': 'My Products',
    'products.create': 'New Product',
    'products.empty': 'No products yet. Create your first product to get started.',
    'products.name': 'Product Name',
    'products.description': 'Description',
    'products.category': 'Product Category',

    // Workspace
    'workspace.progress': 'Compliance Progress',
    'workspace.roadmap': 'View Roadmap',
    'workspace.documents': 'Documents',

    // Roadmap
    'roadmap.title': 'Compliance Roadmap',
    'roadmap.generate': 'Generate Roadmap',
    'roadmap.generating': 'Generating compliance roadmap...',

    // Document checker
    'doccheck.title': 'Document Compliance Review',
    'doccheck.upload': 'Upload Document',
    'doccheck.dragdrop': 'Drag and drop a PDF or text file, or click to browse',
    'doccheck.analyzing': 'Analyzing document against requirements...',
    'doccheck.safety': 'AI-assisted document review. Final compliance certification is determined only by BIS-recognized certifying bodies.',

    // Labs
    'labs.title': 'BIS Recognized Laboratories',
    'labs.demoNotice': 'This is a demo dataset and does not represent the live BIS laboratory database.',
    'labs.filterLocation': 'Filter by location',

    // Verification
    'verify.title': 'Consumer Verification',
    'verify.placeholder': 'Enter registration or licence number',
    'verify.search': 'Verify',
    'verify.match': 'Verified against BIS data',
    'verify.noMatch': 'No matching record found.',
    'verify.noMatchDisclaimer': 'This does not confirm that the product or licence is invalid. Verify directly with BIS.',

    // Alerts
    'alerts.title': 'Standards Amendment Monitor',
    'alerts.demoNotice': 'These are simulated alerts for demonstration purposes only.',

    // General
    'general.loading': 'Loading...',
    'general.error': 'Something went wrong',
    'general.save': 'Save',
    'general.cancel': 'Cancel',
    'general.delete': 'Delete',
    'general.back': 'Back',
    'general.demoData': 'Demo Data',
  },
  hi: {
    // Navigation
    'nav.home': 'होम',
    'nav.assistant': 'BIS सहायक',
    'nav.products': 'मेरे उत्पाद',
    'nav.labs': 'प्रयोगशालाएं',
    'nav.verify': 'सत्यापन',
    'nav.alerts': 'अलर्ट',
    'nav.settings': 'सेटिंग्स',

    // Landing
    'landing.title': 'BIS अनुपालन सहायक',
    'landing.subtitle': 'भारतीय निर्माताओं और MSMEs के लिए AI-संचालित अनुपालन मार्गदर्शन',
    'landing.cta': 'शुरू करें',
    'landing.assistantCta': 'BIS सहायक से पूछें',

    // Assistant
    'assistant.title': 'BIS अनुपालन सहायक',
    'assistant.placeholder': 'BIS मानकों, प्रमाणन, परीक्षण आवश्यकताओं के बारे में पूछें...',
    'assistant.send': 'भेजें',
    'assistant.thinking': 'BIS कॉर्पस खोज रहा है और उत्तर तैयार कर रहा है...',
    'assistant.welcome': 'भारतीय मानकों, उत्पाद आवश्यकताओं, प्रमाणन प्रक्रियाओं, या परीक्षण आवश्यकताओं के बारे में मुझसे पूछें। मैं क्यूरेटेड BIS कॉर्पस खोजूंगा और स्रोत-सहित उत्तर दूंगा।',

    // Trust badges
    'trust.verified': 'BIS डेटा से सत्यापित',
    'trust.interpretation': 'AI व्याख्या — गैर-बाध्यकारी मार्गदर्शन',
    'trust.nosource': 'कोई आधिकारिक स्रोत नहीं मिला',

    // Products
    'products.title': 'मेरे उत्पाद',
    'products.create': 'नया उत्पाद',
    'products.empty': 'अभी कोई उत्पाद नहीं है। शुरू करने के लिए अपना पहला उत्पाद बनाएं।',
    'products.name': 'उत्पाद का नाम',
    'products.description': 'विवरण',
    'products.category': 'उत्पाद श्रेणी',

    // Workspace
    'workspace.progress': 'अनुपालन प्रगति',
    'workspace.roadmap': 'रोडमैप देखें',
    'workspace.documents': 'दस्तावेज़',

    // Roadmap
    'roadmap.title': 'अनुपालन रोडमैप',
    'roadmap.generate': 'रोडमैप तैयार करें',
    'roadmap.generating': 'अनुपालन रोडमैप तैयार हो रहा है...',

    // Document checker
    'doccheck.title': 'दस्तावेज़ अनुपालन समीक्षा',
    'doccheck.upload': 'दस्तावेज़ अपलोड करें',
    'doccheck.dragdrop': 'PDF या टेक्स्ट फ़ाइल खींचें और छोड़ें, या ब्राउज़ करने के लिए क्लिक करें',
    'doccheck.analyzing': 'आवश्यकताओं के विरुद्ध दस्तावेज़ का विश्लेषण हो रहा है...',
    'doccheck.safety': 'AI-सहायता प्राप्त दस्तावेज़ समीक्षा। अंतिम अनुपालन प्रमाणन केवल BIS-मान्यता प्राप्त प्रमाणन निकायों द्वारा निर्धारित किया जाता है।',

    // Labs
    'labs.title': 'BIS मान्यता प्राप्त प्रयोगशालाएं',
    'labs.demoNotice': 'यह एक डेमो डेटासेट है और यह लाइव BIS प्रयोगशाला डेटाबेस का प्रतिनिधित्व नहीं करता है।',
    'labs.filterLocation': 'स्थान के अनुसार फ़िल्टर करें',

    // Verification
    'verify.title': 'उपभोक्ता सत्यापन',
    'verify.placeholder': 'पंजीकरण या लाइसेंस नंबर दर्ज करें',
    'verify.search': 'सत्यापित करें',
    'verify.match': 'BIS डेटा से सत्यापित',
    'verify.noMatch': 'कोई मिलान रिकॉर्ड नहीं मिला।',
    'verify.noMatchDisclaimer': 'यह पुष्टि नहीं करता कि उत्पाद या लाइसेंस अमान्य है। सीधे BIS से सत्यापित करें।',

    // Alerts
    'alerts.title': 'मानक संशोधन मॉनिटर',
    'alerts.demoNotice': 'ये केवल प्रदर्शन उद्देश्यों के लिए अनुकरणित अलर्ट हैं।',

    // General
    'general.loading': 'लोड हो रहा है...',
    'general.error': 'कुछ गलत हो गया',
    'general.save': 'सहेजें',
    'general.cancel': 'रद्द करें',
    'general.delete': 'हटाएं',
    'general.back': 'वापस',
    'general.demoData': 'डेमो डेटा',
  },
};

export function getDictionary(lang: SupportedLanguage): Record<string, string> {
  return dictionaries[lang] ?? dictionaries.en;
}

export function t(key: string, lang: SupportedLanguage = 'en'): string {
  const dict = getDictionary(lang);
  return dict[key] ?? dictionaries.en[key] ?? key;
}
