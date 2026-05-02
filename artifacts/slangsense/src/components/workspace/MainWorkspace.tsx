/// <reference lib="dom" />
import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  Home,
  Clock,
  Settings,
  HelpCircle,
  ChevronDown,
  Globe,
  Bell,
  Volume2,
  Download,
  Trash2,
  Check,
  Info,
  VolumeX,
  BellOff,
  ArrowRight,
  ChevronUp,
  Languages,
  CalendarDays,
  BookOpen,
  Lightbulb,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import {
  useTranslateText,
  useGetTranslationHistory,
  useGetExamples,
  getGetTranslationHistoryQueryKey,
  getGetExamplesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

// ── Types ────────────────────────────────────────────────────────────────────

type TranslateResponse = {
  literal_translation: string;
  contextual_meaning: string;
  slang_breakdown: Array<{ term: string; explanation: string }>;
  tone: string;
  cultural_notes: string;
  equivalent_phrase: string;
  detected_language: string;
};

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: Event) => void) | null;
}
interface SpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}

// ── Constants ────────────────────────────────────────────────────────────────

const LANGUAGES = [
  "Auto-detect",
  "English",
  "Indonesian",
  "Simplified Chinese",
  "Traditional Chinese",
  "Spanish",
  "Japanese",
  "Korean",
  "French",
  "Arabic",
  "Hindi",
  "Portuguese",
  "German",
  "Farsi",
];

const CONTEXTS = ["Casual", "Medical", "Legal", "School", "Business", "Tech"];

const CONTEXT_TO_REGISTER: Record<
  string,
  "formal" | "casual" | "slang" | "street" | "internet"
> = {
  Medical: "formal",
  Legal: "formal",
  School: "formal",
  Business: "formal",
  Casual: "casual",
  Tech: "casual",
};

// ── UI Language translations ──────────────────────────────────────────────────

const UI_LANGUAGES = [
  { code: "en", label: "🇬🇧 English" },
  { code: "es", label: "🇪🇸 Español" },
  { code: "fr", label: "🇫🇷 Français" },
  { code: "zh-CN", label: "🇨🇳 简体中文" },
  { code: "zh-TW", label: "🇹🇼 繁體中文" },
  { code: "ja", label: "🇯🇵 日本語" },
  { code: "ko", label: "🇰🇷 한국어" },
  { code: "ar", label: "🇸🇦 العربية" },
  { code: "hi", label: "🇮🇳 हिंदी" },
  { code: "pt", label: "🇧🇷 Português" },
  { code: "de", label: "🇩🇪 Deutsch" },
  { code: "id", label: "🇮🇩 Indonesia" },
  { code: "fa", label: "🇮🇷 فارسی" },
];

type UiStrings = {
  navLive: string; navHistory: string; navSettings: string;
  needHelp: string; tagline1: string; tagline2: string;
  from: string; translateTo: string; context: string;
  speakOrType: string; placeholder: string;
  translating: string; translateBtn: string;
  literalMeaning: string; detected: string;
  contextualMeaning: string; culturalNotes: string;
  noCulturalNotes: string; slangBreakdown: string;
  noSlang: string; tone: string; naturalEquivalent: string;
  emptyState: string; uiLanguage: string;
};

const UI_TRANSLATIONS: Record<string, UiStrings> = {
  en: {
    navLive: "Live Translation", navHistory: "History", navSettings: "Settings",
    needHelp: "Need help?", tagline1: "Translate words,", tagline2: "Understand meaning.",
    from: "From", translateTo: "translate to", context: "Context",
    speakOrType: "Speak or type here..", placeholder: "Translate something",
    translating: "Translating…", translateBtn: "Translate →",
    literalMeaning: "Literal Meaning", detected: "Detected:",
    contextualMeaning: "Contextual Meaning", culturalNotes: "Cultural Notes",
    noCulturalNotes: "No cultural notes for this phrase.",
    slangBreakdown: "Slang/Figurative Breakdown", noSlang: "No slang detected.",
    tone: "Tone", naturalEquivalent: "Natural Equivalent",
    emptyState: "Type or speak something above to get started", uiLanguage: "UI Language",
  },
  es: {
    navLive: "Traducción en vivo", navHistory: "Historial", navSettings: "Ajustes",
    needHelp: "¿Necesitas ayuda?", tagline1: "Traduce palabras,", tagline2: "Entiende el significado.",
    from: "De", translateTo: "traducir a", context: "Contexto",
    speakOrType: "Habla o escribe aquí..", placeholder: "Traduce algo",
    translating: "Traduciendo…", translateBtn: "Traducir →",
    literalMeaning: "Significado literal", detected: "Detectado:",
    contextualMeaning: "Significado contextual", culturalNotes: "Notas culturales",
    noCulturalNotes: "Sin notas culturales para esta frase.",
    slangBreakdown: "Desglose de jerga", noSlang: "Sin jerga detectada.",
    tone: "Tono", naturalEquivalent: "Equivalente natural",
    emptyState: "Escribe o habla algo arriba para comenzar", uiLanguage: "Idioma UI",
  },
  fr: {
    navLive: "Traduction en direct", navHistory: "Historique", navSettings: "Paramètres",
    needHelp: "Besoin d'aide ?", tagline1: "Traduisez des mots,", tagline2: "Comprenez le sens.",
    from: "De", translateTo: "traduire en", context: "Contexte",
    speakOrType: "Parlez ou tapez ici..", placeholder: "Traduisez quelque chose",
    translating: "Traduction…", translateBtn: "Traduire →",
    literalMeaning: "Sens littéral", detected: "Détecté :",
    contextualMeaning: "Sens contextuel", culturalNotes: "Notes culturelles",
    noCulturalNotes: "Aucune note culturelle pour cette phrase.",
    slangBreakdown: "Analyse d'argot", noSlang: "Aucun argot détecté.",
    tone: "Ton", naturalEquivalent: "Équivalent naturel",
    emptyState: "Tapez ou parlez quelque chose ci-dessus pour commencer", uiLanguage: "Langue UI",
  },
  "zh-CN": {
    navLive: "实时翻译", navHistory: "历史记录", navSettings: "设置",
    needHelp: "需要帮助？", tagline1: "翻译文字，", tagline2: "理解含义。",
    from: "从", translateTo: "翻译为", context: "语境",
    speakOrType: "在此说话或输入..", placeholder: "翻译一些内容",
    translating: "翻译中…", translateBtn: "翻译 →",
    literalMeaning: "字面意思", detected: "检测到：",
    contextualMeaning: "语境含义", culturalNotes: "文化背景",
    noCulturalNotes: "此短语没有文化背景说明。",
    slangBreakdown: "俚语分解", noSlang: "未检测到俚语。",
    tone: "语气", naturalEquivalent: "自然对等表达",
    emptyState: "在上方输入或说话以开始", uiLanguage: "界面语言（简体）",
  },
  "zh-TW": {
    navLive: "即時翻譯", navHistory: "歷史記錄", navSettings: "設定",
    needHelp: "需要幫助？", tagline1: "翻譯文字，", tagline2: "理解含義。",
    from: "從", translateTo: "翻譯為", context: "語境",
    speakOrType: "在此說話或輸入..", placeholder: "翻譯一些內容",
    translating: "翻譯中…", translateBtn: "翻譯 →",
    literalMeaning: "字面意思", detected: "偵測到：",
    contextualMeaning: "語境含義", culturalNotes: "文化背景",
    noCulturalNotes: "此短語沒有文化背景說明。",
    slangBreakdown: "俚語分解", noSlang: "未偵測到俚語。",
    tone: "語氣", naturalEquivalent: "自然對等表達",
    emptyState: "在上方輸入或說話以開始", uiLanguage: "介面語言（繁體）",
  },
  ja: {
    navLive: "リアルタイム翻訳", navHistory: "履歴", navSettings: "設定",
    needHelp: "ヘルプが必要ですか？", tagline1: "言葉を翻訳し、", tagline2: "意味を理解する。",
    from: "から", translateTo: "翻訳先", context: "文脈",
    speakOrType: "ここで話すか入力してください..", placeholder: "何かを翻訳する",
    translating: "翻訳中…", translateBtn: "翻訳 →",
    literalMeaning: "文字通りの意味", detected: "検出：",
    contextualMeaning: "文脈的な意味", culturalNotes: "文化的ノート",
    noCulturalNotes: "このフレーズの文化的ノートはありません。",
    slangBreakdown: "スラング分解", noSlang: "スラングは検出されませんでした。",
    tone: "トーン", naturalEquivalent: "自然な表現",
    emptyState: "上で何かを入力または話して始めてください", uiLanguage: "UI言語",
  },
  ko: {
    navLive: "실시간 번역", navHistory: "기록", navSettings: "설정",
    needHelp: "도움이 필요하세요?", tagline1: "단어를 번역하고,", tagline2: "의미를 이해하세요.",
    from: "에서", translateTo: "로 번역", context: "맥락",
    speakOrType: "여기서 말하거나 입력하세요..", placeholder: "무언가를 번역하세요",
    translating: "번역 중…", translateBtn: "번역 →",
    literalMeaning: "문자적 의미", detected: "감지됨:",
    contextualMeaning: "문맥적 의미", culturalNotes: "문화적 메모",
    noCulturalNotes: "이 구문에 대한 문화적 메모가 없습니다.",
    slangBreakdown: "속어 분석", noSlang: "속어가 감지되지 않았습니다.",
    tone: "어조", naturalEquivalent: "자연스러운 표현",
    emptyState: "시작하려면 위에서 말하거나 입력하세요", uiLanguage: "UI 언어",
  },
  ar: {
    navLive: "ترجمة فورية", navHistory: "السجل", navSettings: "الإعدادات",
    needHelp: "تحتاج مساعدة؟", tagline1: "ترجم الكلمات،", tagline2: "افهم المعنى.",
    from: "من", translateTo: "ترجمة إلى", context: "السياق",
    speakOrType: "تحدث أو اكتب هنا..", placeholder: "ترجم شيئاً ما",
    translating: "جارٍ الترجمة…", translateBtn: "ترجم ←",
    literalMeaning: "المعنى الحرفي", detected: "تم الكشف:",
    contextualMeaning: "المعنى السياقي", culturalNotes: "ملاحظات ثقافية",
    noCulturalNotes: "لا توجد ملاحظات ثقافية لهذه الجملة.",
    slangBreakdown: "تحليل العامية", noSlang: "لم يتم الكشف عن عامية.",
    tone: "النبرة", naturalEquivalent: "المعادل الطبيعي",
    emptyState: "اكتب أو تحدث للبدء", uiLanguage: "لغة الواجهة",
  },
  hi: {
    navLive: "लाइव अनुवाद", navHistory: "इतिहास", navSettings: "सेटिंग्स",
    needHelp: "मदद चाहिए?", tagline1: "शब्दों का अनुवाद करें,", tagline2: "अर्थ समझें।",
    from: "से", translateTo: "में अनुवाद करें", context: "संदर्भ",
    speakOrType: "यहाँ बोलें या टाइप करें..", placeholder: "कुछ अनुवाद करें",
    translating: "अनुवाद हो रहा है…", translateBtn: "अनुवाद करें →",
    literalMeaning: "शाब्दिक अर्थ", detected: "पहचाना गया:",
    contextualMeaning: "संदर्भात्मक अर्थ", culturalNotes: "सांस्कृतिक नोट्स",
    noCulturalNotes: "इस वाक्यांश के लिए कोई सांस्कृतिक नोट नहीं।",
    slangBreakdown: "स्लैंग विश्लेषण", noSlang: "कोई स्लैंग नहीं मिला।",
    tone: "स्वर", naturalEquivalent: "प्राकृतिक समकक्ष",
    emptyState: "शुरू करने के लिए ऊपर टाइप करें या बोलें", uiLanguage: "UI भाषा",
  },
  pt: {
    navLive: "Tradução ao vivo", navHistory: "Histórico", navSettings: "Configurações",
    needHelp: "Precisa de ajuda?", tagline1: "Traduza palavras,", tagline2: "Entenda o significado.",
    from: "De", translateTo: "traduzir para", context: "Contexto",
    speakOrType: "Fale ou escreva aqui..", placeholder: "Traduza algo",
    translating: "Traduzindo…", translateBtn: "Traduzir →",
    literalMeaning: "Significado literal", detected: "Detectado:",
    contextualMeaning: "Significado contextual", culturalNotes: "Notas culturais",
    noCulturalNotes: "Sem notas culturais para esta frase.",
    slangBreakdown: "Análise de gírias", noSlang: "Nenhuma gíria detectada.",
    tone: "Tom", naturalEquivalent: "Equivalente natural",
    emptyState: "Digite ou fale algo acima para começar", uiLanguage: "Idioma UI",
  },
  de: {
    navLive: "Live-Übersetzung", navHistory: "Verlauf", navSettings: "Einstellungen",
    needHelp: "Hilfe benötigt?", tagline1: "Wörter übersetzen,", tagline2: "Bedeutung verstehen.",
    from: "Von", translateTo: "übersetzen in", context: "Kontext",
    speakOrType: "Hier sprechen oder tippen..", placeholder: "Etwas übersetzen",
    translating: "Übersetze…", translateBtn: "Übersetzen →",
    literalMeaning: "Wörtliche Bedeutung", detected: "Erkannt:",
    contextualMeaning: "Kontextuelle Bedeutung", culturalNotes: "Kulturelle Notizen",
    noCulturalNotes: "Keine kulturellen Notizen für diesen Satz.",
    slangBreakdown: "Slang-Analyse", noSlang: "Kein Slang erkannt.",
    tone: "Ton", naturalEquivalent: "Natürliches Äquivalent",
    emptyState: "Tippen oder sprechen Sie oben, um zu beginnen", uiLanguage: "UI-Sprache",
  },
  id: {
    navLive: "Terjemahan Langsung", navHistory: "Riwayat", navSettings: "Pengaturan",
    needHelp: "Butuh bantuan?", tagline1: "Terjemahkan kata-kata,", tagline2: "Pahami maknanya.",
    from: "Dari", translateTo: "terjemahkan ke", context: "Konteks",
    speakOrType: "Bicara atau ketik di sini..", placeholder: "Terjemahkan sesuatu",
    translating: "Menerjemahkan…", translateBtn: "Terjemahkan →",
    literalMeaning: "Makna Harfiah", detected: "Terdeteksi:",
    contextualMeaning: "Makna Kontekstual", culturalNotes: "Catatan Budaya",
    noCulturalNotes: "Tidak ada catatan budaya untuk frasa ini.",
    slangBreakdown: "Analisis Slang", noSlang: "Tidak ada slang terdeteksi.",
    tone: "Nada", naturalEquivalent: "Padanan Alami",
    emptyState: "Ketik atau bicara di atas untuk memulai", uiLanguage: "Bahasa UI",
  },
  fa: {
    navLive: "ترجمه زنده", navHistory: "تاریخچه", navSettings: "تنظیمات",
    needHelp: "نیاز به کمک دارید؟", tagline1: "کلمات را ترجمه کنید،", tagline2: "معنا را درک کنید.",
    from: "از", translateTo: "ترجمه به", context: "زمینه",
    speakOrType: "اینجا صحبت کنید یا تایپ کنید..", placeholder: "چیزی را ترجمه کنید",
    translating: "در حال ترجمه…", translateBtn: "ترجمه ←",
    literalMeaning: "معنای تحت‌اللفظی", detected: "شناسایی شده:",
    contextualMeaning: "معنای متنی", culturalNotes: "یادداشت‌های فرهنگی",
    noCulturalNotes: "هیچ یادداشت فرهنگی برای این عبارت وجود ندارد.",
    slangBreakdown: "تحلیل اصطلاحات عامیانه", noSlang: "هیچ اصطلاح عامیانه‌ای شناسایی نشد.",
    tone: "لحن", naturalEquivalent: "معادل طبیعی",
    emptyState: "برای شروع چیزی بنویسید یا بگویید", uiLanguage: "زبان رابط کاربری",
  },
};

// ── Robot mascot SVG ──────────────────────────────────────────────────────────

function RobotMascot({
  size = 120,
  thinking = false,
}: {
  size?: number;
  thinking?: boolean;
}) {
  return (
    <motion.div
      animate={thinking ? { y: [0, -6, 0] } : { y: [0, -3, 0] }}
      transition={{
        duration: thinking ? 1.2 : 2.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      style={{ width: size, height: size, flexShrink: 0 }}
    >
      <svg
        viewBox="0 0 120 130"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
      >
        {/* Cape */}
        <ellipse
          cx="60"
          cy="115"
          rx="28"
          ry="10"
          fill="#1a3a6e"
          opacity="0.3"
        />
        <path
          d="M35 85 Q30 110 20 118 Q60 125 100 118 Q90 110 85 85Z"
          fill="#2355b0"
        />
        <path d="M35 85 Q30 110 20 118 Q40 120 60 118Z" fill="#1a44a0" />
        {/* Body */}
        <rect x="28" y="58" width="64" height="52" rx="16" fill="#2a65d0" />
        <rect
          x="28"
          y="58"
          width="64"
          height="52"
          rx="16"
          fill="url(#bodyGrad)"
        />
        {/* Belly screen */}
        <rect
          x="38"
          y="68"
          width="44"
          height="28"
          rx="8"
          fill="#1a3a7a"
          opacity="0.6"
        />
        <rect
          x="41"
          y="71"
          width="38"
          height="22"
          rx="6"
          fill="#0f2456"
          opacity="0.8"
        />
        {/* Screen glow dots */}
        <circle cx="50" cy="82" r="3" fill="#4af0a0" opacity="0.9" />
        <circle cx="60" cy="82" r="3" fill="#4addf0" opacity="0.9" />
        <circle cx="70" cy="82" r="3" fill="#a04af0" opacity="0.9" />
        {/* Arms */}
        <rect x="10" y="64" width="18" height="10" rx="5" fill="#2a65d0" />
        <circle cx="10" cy="69" r="7" fill="#2a65d0" />
        <rect x="92" y="64" width="18" height="10" rx="5" fill="#2a65d0" />
        <circle cx="110" cy="69" r="7" fill="#2a65d0" />
        {/* Neck */}
        <rect x="52" y="48" width="16" height="12" rx="4" fill="#2a65d0" />
        {/* Head */}
        <rect x="22" y="14" width="76" height="56" rx="22" fill="#3070e0" />
        <rect
          x="22"
          y="14"
          width="76"
          height="56"
          rx="22"
          fill="url(#headGrad)"
        />
        {/* Antenna */}
        <rect x="57" y="4" width="6" height="14" rx="3" fill="#2a65d0" />
        <circle cx="60" cy="4" r="5" fill="#4af0c0" />
        <motion.circle
          cx="60"
          cy="4"
          r="5"
          fill="#4af0c0"
          animate={{ opacity: [1, 0.3, 1], r: [5, 7, 5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        {/* Eyes */}
        <ellipse cx="46" cy="36" rx="11" ry="12" fill="white" />
        <ellipse cx="74" cy="36" rx="11" ry="12" fill="white" />
        <motion.ellipse
          cx="46"
          cy="37"
          rx="7"
          ry="8"
          fill="#1a44c0"
          animate={thinking ? { scaleY: [1, 0.1, 1] } : { scaleY: 1 }}
          transition={{
            duration: 0.15,
            repeat: thinking ? Infinity : 0,
            repeatDelay: 2,
          }}
        />
        <motion.ellipse
          cx="74"
          cy="37"
          rx="7"
          ry="8"
          fill="#1a44c0"
          animate={thinking ? { scaleY: [1, 0.1, 1] } : { scaleY: 1 }}
          transition={{
            duration: 0.15,
            repeat: thinking ? Infinity : 0,
            repeatDelay: 2,
            delay: 0.05,
          }}
        />
        <circle cx="48" cy="35" r="2.5" fill="white" />
        <circle cx="76" cy="35" r="2.5" fill="white" />
        {/* Mouth */}
        {thinking ? (
          <path
            d="M46 54 Q60 52 74 54"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        ) : (
          <path
            d="M46 54 Q60 60 74 54"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        )}
        {/* Cheek blush */}
        <ellipse cx="34" cy="46" rx="5" ry="3" fill="#ff8aad" opacity="0.4" />
        <ellipse cx="86" cy="46" rx="5" ry="3" fill="#ff8aad" opacity="0.4" />
        <defs>
          <linearGradient
            id="headGrad"
            x1="22"
            y1="14"
            x2="98"
            y2="70"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#5090ff" />
            <stop offset="100%" stopColor="#2355c0" />
          </linearGradient>
          <linearGradient
            id="bodyGrad"
            x1="28"
            y1="58"
            x2="92"
            y2="110"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#3a75e0" />
            <stop offset="100%" stopColor="#1a50b0" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  );
}

// ── Dropdown ──────────────────────────────────────────────────────────────────

function Dropdown({
  value,
  options,
  onChange,
  label,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {label && <div className="text-[10px] text-gray-400 mb-0.5">{label}</div>}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full border border-gray-200 bg-white text-sm text-gray-700 font-medium hover:border-blue-300 transition-colors shadow-sm"
      >
        {value}
        <ChevronDown size={13} className="text-gray-400" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-y-auto min-w-[140px] max-h-56"
          >
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  value === opt
                    ? "bg-blue-50 text-blue-600 font-semibold"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Result Card ───────────────────────────────────────────────────────────────

function ResultCard({
  title,
  children,
  accent = false,
  delay = 0,
}: {
  title: string;
  children: React.ReactNode;
  accent?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={`rounded-2xl border-2 p-4 ${
        accent ? "border-red-300 bg-white" : "border-blue-200 bg-white"
      }`}
    >
      <div
        className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${accent ? "text-red-500" : "text-blue-500"}`}
      >
        {title}
      </div>
      {children}
    </motion.div>
  );
}

// ── Toggle switch ─────────────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${on ? "bg-blue-500" : "bg-gray-300"}`}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md ${on ? "left-5" : "left-0.5"}`}
      />
    </button>
  );
}

// ── Tone badge helper ─────────────────────────────────────────────────────────

function toneBadgeClass(tone: string) {
  if (tone === "aggressive" || tone === "sarcastic") return "bg-red-100 text-red-600";
  if (tone === "humorous" || tone === "affectionate") return "bg-green-100 text-green-600";
  if (tone === "formal") return "bg-blue-100 text-blue-600";
  return "bg-gray-100 text-gray-600";
}

// ── History page ──────────────────────────────────────────────────────────────

type HistoryItem = {
  id: number;
  text: string;
  source_language: string;
  target_language: string;
  register: string;
  result: TranslateResponse;
  created_at: string;
};

function HistoryCard({ item }: { item: HistoryItem }) {
  const [open, setOpen] = useState(false);
  const age = (() => {
    const diff = Date.now() - new Date(item.created_at).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return new Date(item.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  })();

  return (
    <motion.div
      layout
      className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
    >
      {/* Header row — always visible */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-gray-50 transition-colors"
      >
        {/* Left: text + tags */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate pr-2">
            {item.text}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {/* Language tag */}
            <span className="inline-flex items-center gap-1 text-[11px] bg-blue-50 text-blue-600 font-semibold px-2.5 py-0.5 rounded-full border border-blue-100">
              <Languages size={10} />
              {item.source_language === "auto" ? "Auto" : item.source_language}
              <ArrowRight size={9} />
              {item.target_language}
            </span>
            {/* Register tag */}
            <span className="text-[11px] bg-purple-50 text-purple-600 font-semibold px-2.5 py-0.5 rounded-full border border-purple-100 capitalize">
              {item.register}
            </span>
            {/* Tone badge */}
            {item.result?.tone && (
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize ${toneBadgeClass(item.result.tone)}`}>
                {item.result.tone}
              </span>
            )}
            {/* Timestamp */}
            <span className="ml-auto flex items-center gap-1 text-[11px] text-gray-400">
              <CalendarDays size={10} />
              {age}
            </span>
          </div>
        </div>
        {/* Expand chevron */}
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.18 }}
          className="mt-0.5 flex-shrink-0 text-gray-400"
        >
          <ChevronUp size={16} />
        </motion.div>
      </button>

      {/* Expanded drill-down */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-3 border-t border-gray-100 pt-4">
              {/* Literal translation */}
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <BookOpen size={13} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Literal Translation</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{item.result?.literal_translation || "—"}</p>
                </div>
              </div>

              {/* Contextual meaning */}
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Lightbulb size={13} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Contextual Meaning</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{item.result?.contextual_meaning || "—"}</p>
                </div>
              </div>

              {/* Cultural notes */}
              {item.result?.cultural_notes && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MessageCircle size={13} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Cultural Notes</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{item.result.cultural_notes}</p>
                  </div>
                </div>
              )}

              {/* Slang pills */}
              {item.result?.slang_breakdown?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Slang Breakdown</p>
                  <div className="flex flex-wrap gap-1.5">
                    {item.result.slang_breakdown.map((s, i) => (
                      <div key={i} className="group relative">
                        <span className="text-xs px-3 py-1 rounded-full bg-blue-500 text-white font-semibold cursor-help shadow-sm">
                          {s.term}
                        </span>
                        <div className="absolute bottom-full mb-2 left-0 hidden group-hover:block w-52 bg-gray-900 text-white text-xs p-2.5 rounded-xl shadow-xl z-50 pointer-events-none leading-relaxed">
                          {s.explanation}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Natural equivalent */}
              {item.result?.equivalent_phrase && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles size={13} className="text-red-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Natural Equivalent</p>
                    <p className="text-sm font-semibold text-gray-700">{item.result.equivalent_phrase}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function HistoryPage({ history }: { history: HistoryItem[] }) {
  const sorted = [...history].reverse();

  if (sorted.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-24 text-center opacity-50"
      >
        <RobotMascot size={72} thinking={false} />
        <p className="text-sm text-gray-500 mt-4 max-w-xs leading-relaxed">
          No translations yet — head to Live Translation and try something!
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="history"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-black text-gray-800 tracking-tight">Translation History</h1>
          <p className="text-xs text-gray-400 mt-0.5">{sorted.length} translation{sorted.length !== 1 ? "s" : ""} — click any card to expand</p>
        </div>
        <Clock size={20} className="text-blue-300" />
      </div>
      <div className="space-y-3">
        {sorted.map((item) => (
          <HistoryCard key={item.id} item={item} />
        ))}
      </div>
    </motion.div>
  );
}

// ── Settings page ─────────────────────────────────────────────────────────────

function SettingsPage({
  voiceEnabled, setVoiceEnabled,
  notificationsEnabled, setNotificationsEnabled,
  history,
  onClearHistory,
}: {
  voiceEnabled: boolean; setVoiceEnabled: (v: boolean) => void;
  notificationsEnabled: boolean; setNotificationsEnabled: (v: boolean) => void;
  history: unknown[];
  onClearHistory: () => void;
}) {
  const [saved, setSaved] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);

  const handleSave = () => {
    localStorage.setItem("slangsense_settings", JSON.stringify({ voiceEnabled, notificationsEnabled }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = async () => {
    setClearing(true);
    try {
      await fetch("/api/translate/history", { method: "DELETE" });
      onClearHistory();
      setCleared(true);
      setTimeout(() => setCleared(false), 2000);
    } finally {
      setClearing(false);
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `slangsense-history-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      key="settings"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-lg space-y-5"
    >
      {/* Preferences */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-widest">Preferences</h2>
        <div className="space-y-5">
          {/* Voice */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${voiceEnabled ? "bg-blue-100" : "bg-gray-100"}`}>
                {voiceEnabled ? <Volume2 size={17} className="text-blue-500" /> : <VolumeX size={17} className="text-gray-400" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Voice Input</p>
                <p className="text-xs text-gray-400">Enable microphone for speech-to-text</p>
              </div>
            </div>
            <Toggle on={voiceEnabled} onChange={setVoiceEnabled} />
          </div>

          <div className="h-px bg-gray-100" />

          {/* Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${notificationsEnabled ? "bg-blue-100" : "bg-gray-100"}`}>
                {notificationsEnabled ? <Bell size={17} className="text-blue-500" /> : <BellOff size={17} className="text-gray-400" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Notifications</p>
                <p className="text-xs text-gray-400">Get alerts for translation updates</p>
              </div>
            </div>
            <Toggle on={notificationsEnabled} onChange={setNotificationsEnabled} />
          </div>
        </div>
      </div>

      {/* Data */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-sm font-bold text-gray-700 mb-1 uppercase tracking-widest">Data</h2>
        <p className="text-xs text-gray-400 mb-4">
          {history.length} translation{history.length !== 1 ? "s" : ""} stored
        </p>
        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleExport}
            disabled={history.length === 0}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl border-2 border-blue-200 text-blue-500 text-sm font-semibold hover:bg-blue-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={15} />
            Export JSON
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleClear}
            disabled={clearing || history.length === 0}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl border-2 border-red-200 text-red-400 text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <AnimatePresence mode="wait">
              {cleared ? (
                <motion.span key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 text-green-500">
                  <Check size={15} /> Cleared
                </motion.span>
              ) : clearing ? (
                <motion.span key="clearing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Clearing…</motion.span>
              ) : (
                <motion.span key="clear" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5">
                  <Trash2 size={15} /> Clear History
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* About */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-widest">About</h2>
        <div className="flex items-center gap-4">
          <RobotMascot size={72} thinking={false} />
          <div>
            <p className="font-black text-xl text-[#1e4db7] tracking-tight">SayWhat</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              Powered by Gemini AI — translates slang,<br />
              idioms & cultural expressions across languages.
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <Info size={11} className="text-blue-400" />
              <span className="text-[11px] text-blue-400 font-medium">Version 1.0.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleSave}
          className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-bold shadow-md transition-all ${
            saved
              ? "bg-green-500 text-white shadow-green-200"
              : "bg-blue-500 text-white shadow-blue-200 hover:bg-blue-600"
          }`}
        >
          <AnimatePresence mode="wait">
            {saved ? (
              <motion.span
                key="saved"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <Check size={16} /> Saved!
              </motion.span>
            ) : (
              <motion.span key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Save Settings
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function MainWorkspace() {
  const [activeNav, setActiveNav] = useState("live");
  const [fromLang, setFromLang] = useState("Auto-detect");
  const [toLang, setToLang] = useState("English");
  const [context, setContext] = useState("Casual");
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState<TranslateResponse | null>(null);

  const savedSettings = (() => {
    try { return JSON.parse(localStorage.getItem("slangsense_settings") ?? "{}"); } catch { return {}; }
  })();
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(savedSettings.voiceEnabled ?? true);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(savedSettings.notificationsEnabled ?? false);
  const [uiLang, setUiLang] = useState("en");
  const [uiLangOpen, setUiLangOpen] = useState(false);
  const uiLangRef = useRef<HTMLDivElement>(null);

  const t = UI_TRANSLATIONS[uiLang] ?? UI_TRANSLATIONS.en;

  useEffect(() => {
    if (!uiLangOpen) return;
    const h = (e: MouseEvent) => {
      if (uiLangRef.current && !uiLangRef.current.contains(e.target as Node))
        setUiLangOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [uiLangOpen]);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const queryClient = useQueryClient();

  const { data: examples = [] } = useGetExamples({
    query: { queryKey: getGetExamplesQueryKey() },
  });

  const { data: history = [] } = useGetTranslationHistory({
    query: { queryKey: getGetTranslationHistoryQueryKey() },
  });

  const translate = useTranslateText({
    mutation: {
      onSuccess: (data) => {
        setResult(data as unknown as TranslateResponse);
        queryClient.invalidateQueries({
          queryKey: getGetTranslationHistoryQueryKey(),
        });
      },
    },
  });

  const handleTranslate = useCallback(() => {
    if (!inputText.trim()) return;
    setResult(null);
    translate.mutate({
      data: {
        text: inputText.trim(),
        sourceLanguage: fromLang === "Auto-detect" ? "auto" : fromLang,
        targetLanguage: toLang,
        register: CONTEXT_TO_REGISTER[context] ?? "casual",
      },
    });
  }, [inputText, fromLang, toLang, context, translate]);

  const handleVoiceInput = useCallback(() => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const win = window as unknown as Record<string, unknown>;
    const API =
      (win["SpeechRecognition"] as SpeechRecognitionConstructor | undefined) ??
      (win["webkitSpeechRecognition"] as
        | SpeechRecognitionConstructor
        | undefined);
    if (!API) return;
    const rec = new API();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "";
    rec.onresult = (e: SpeechRecognitionEvent) => {
      setInputText(e.results[0][0].transcript);
      setIsRecording(false);
    };
    rec.onend = () => setIsRecording(false);
    rec.onerror = () => setIsRecording(false);
    recognitionRef.current = rec;
    rec.start();
    setIsRecording(true);
  }, [isRecording]);

  const isLoading = translate.isPending;

  const handleClearHistory = useCallback(() => {
    queryClient.setQueryData(getGetTranslationHistoryQueryKey(), []);
    queryClient.invalidateQueries({ queryKey: getGetTranslationHistoryQueryKey() });
  }, [queryClient]);

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="w-52 flex-shrink-0 flex flex-col bg-[#1e4db7] text-white rounded-r-3xl shadow-xl">
        {/* Logo */}
        <div className="px-6 pt-8 pb-6">
          <div className="text-3xl font-black tracking-tight text-white leading-none">
            SayWhat
          </div>
          <div className="text-blue-200 text-xs mt-1 font-medium leading-snug">
            {t.tagline1}
            <br />
            {t.tagline2}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 space-y-2">
          {[
            { id: "live", icon: Home, label: t.navLive },
            { id: "history", icon: Clock, label: t.navHistory },
            { id: "settings", icon: Settings, label: t.navSettings },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveNav(id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeNav === id
                  ? "bg-white text-[#1e4db7] shadow-md"
                  : "text-blue-100 hover:bg-blue-600/50"
              }`}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>

        {/* Bottom robot + help */}
        <div className="px-4 pb-6 flex flex-col items-center gap-3">
          <RobotMascot size={90} thinking={isLoading} />

          {/* UI Language picker */}
          <div ref={uiLangRef} className="relative w-full">
            <button
              onClick={() => setUiLangOpen((o) => !o)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-blue-400/40 text-blue-100 text-xs font-medium hover:bg-blue-600/40 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <Globe size={13} />
                <span>{UI_LANGUAGES.find((l) => l.code === uiLang)?.label ?? "🇬🇧 English"}</span>
              </div>
              <ChevronDown size={12} className={`transition-transform ${uiLangOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {uiLangOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                  className="absolute bottom-full mb-2 left-0 right-0 bg-[#1a3fa0] border border-blue-400/40 rounded-xl shadow-2xl z-50 overflow-y-auto max-h-56"
                >
                  {UI_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => { setUiLang(lang.code); setUiLangOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-xs transition-colors ${
                        uiLang === lang.code
                          ? "bg-white/20 text-white font-bold"
                          : "text-blue-100 hover:bg-white/10"
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-blue-400/50 text-blue-200 text-sm font-semibold hover:bg-blue-600/40 transition-colors">
            <HelpCircle size={15} />
            {t.needHelp}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto px-8 py-6">

        {/* History page */}
        {activeNav === "history" && (
          <HistoryPage history={history as unknown as HistoryItem[]} />
        )}

        {/* Settings page */}
        {activeNav === "settings" && (
          <SettingsPage
            voiceEnabled={voiceEnabled}
            setVoiceEnabled={setVoiceEnabled}
            notificationsEnabled={notificationsEnabled}
            setNotificationsEnabled={setNotificationsEnabled}
            history={history as unknown[]}
            onClearHistory={handleClearHistory}
          />
        )}

        {/* Live translation page */}
        {activeNav === "live" && <>

        {/* Top bar */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-sm text-gray-500 font-medium">{t.from}</span>
          <Dropdown
            value={fromLang}
            options={LANGUAGES}
            onChange={setFromLang}
          />
          <span className="text-sm text-gray-500 font-medium">
            {t.translateTo}
          </span>
          <Dropdown
            value={toLang}
            options={LANGUAGES.filter((l) => l !== "Auto-detect")}
            onChange={setToLang}
          />
          <div className="ml-auto">
            <Dropdown
              value={context}
              options={CONTEXTS}
              onChange={setContext}
              label={t.context}
            />
          </div>
        </div>

        {/* Input card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-5 mb-5">
          <div className="flex items-start gap-4">
            {/* Robot */}
            <div className="flex-shrink-0 -mt-1">
              <RobotMascot size={80} thinking={isLoading} />
            </div>

            {/* Input area */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-xl font-bold text-blue-500">
                  {t.speakOrType}
                </h2>
                <motion.button
                  onClick={handleVoiceInput}
                  whileTap={{ scale: 0.9 }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all ${
                    isRecording ? "bg-red-500" : "bg-blue-500 hover:bg-blue-600"
                  }`}
                >
                  {isRecording ? (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                    >
                      <Mic size={16} className="text-white" />
                    </motion.div>
                  ) : (
                    <Mic size={16} className="text-white" />
                  )}
                </motion.button>
              </div>

              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                    handleTranslate();
                }}
                placeholder={t.placeholder}
                rows={3}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 placeholder:text-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
              />

              <div className="flex items-center justify-between mt-3">
                {/* Example chips */}
                <div className="flex gap-2 flex-wrap">
                  {examples.slice(0, 3).map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => setInputText(ex.text)}
                      className="text-[11px] px-3 py-1.5 rounded-full bg-blue-50 text-blue-500 border border-blue-100 hover:bg-blue-100 transition-colors font-medium"
                    >
                      {ex.language}
                    </button>
                  ))}
                </div>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleTranslate}
                  disabled={isLoading || !inputText.trim()}
                  className="px-6 py-2 rounded-full bg-blue-500 text-white text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-blue-200"
                >
                  {isLoading ? t.translating : t.translateBtn}
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Skeleton */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border-2 border-gray-200 bg-white p-4 animate-pulse"
                >
                  <div className="h-3 w-28 bg-gray-200 rounded mb-3" />
                  <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
                  <div className="h-4 w-1/2 bg-gray-200 rounded" />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {result && !isLoading && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {/* Literal Meaning */}
              <ResultCard title={t.literalMeaning} delay={0.05}>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {result.literal_translation}
                </p>
                {result.detected_language && (
                  <p className="text-xs text-gray-400 mt-1">
                    {t.detected} {result.detected_language}
                  </p>
                )}
              </ResultCard>

              {/* Contextual Meaning */}
              <ResultCard title={t.contextualMeaning} accent delay={0.1}>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {result.contextual_meaning}
                </p>
              </ResultCard>

              {/* Bottom 2-column grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Left: Cultural Notes */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.15 }}
                  className="rounded-2xl border-2 border-gray-200 bg-white p-4 flex flex-col"
                >
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-700 mb-2">
                    {t.culturalNotes}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed flex-1">
                    {result.cultural_notes || t.noCulturalNotes}
                  </p>
                  {/* Little robot bottom-left with question bubble */}
                  <div className="flex items-end gap-2 mt-4">
                    <div className="relative">
                      <RobotMascot size={52} thinking={false} />
                      <div className="absolute -top-1 -right-3 w-6 h-6 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center">
                        <span className="text-blue-500 font-black text-xs">
                          ?
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Right: 3 stacked cards */}
                <div className="space-y-3">
                  {/* Slang breakdown */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.18 }}
                    className="rounded-2xl border-2 border-red-200 bg-white p-3"
                  >
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-700 mb-2">
                      {t.slangBreakdown}
                    </div>
                    {result.slang_breakdown.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {result.slang_breakdown.map((item, i) => (
                          <div key={i} className="group relative">
                            <span className="text-xs px-3 py-1 rounded-full bg-blue-500 text-white font-semibold cursor-help shadow-sm">
                              {item.term}
                            </span>
                            <div className="absolute bottom-full mb-1.5 left-0 hidden group-hover:block w-44 bg-gray-900 text-white text-xs p-2 rounded-xl shadow-xl z-50 pointer-events-none leading-relaxed">
                              {item.explanation}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">
                        {t.noSlang}
                      </p>
                    )}
                  </motion.div>

                  {/* Tone */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.21 }}
                    className="rounded-2xl border-2 border-red-200 bg-white p-3"
                  >
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-700 mb-1.5">
                      {t.tone}
                    </div>
                    <span
                      className={`inline-block text-xs font-bold px-3 py-1.5 rounded-full capitalize ${
                        result.tone === "aggressive" ||
                        result.tone === "sarcastic"
                          ? "bg-red-100 text-red-600"
                          : result.tone === "humorous" ||
                              result.tone === "affectionate"
                            ? "bg-green-100 text-green-600"
                            : result.tone === "formal"
                              ? "bg-blue-100 text-blue-600"
                              : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {result.tone}
                    </span>
                  </motion.div>

                  {/* Natural Equivalent */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.24 }}
                    className="rounded-2xl border-2 border-red-200 bg-white p-3"
                  >
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-700 mb-1.5">
                      {t.naturalEquivalent}
                    </div>
                    <p className="text-sm text-gray-700 font-medium">
                      {result.equivalent_phrase || "—"}
                    </p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {!result && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
            <RobotMascot size={64} />
            <p className="text-sm text-gray-500 mt-3 max-w-xs">
              {t.emptyState}
            </p>
          </div>
        )}
        </>}
      </main>
    </div>
  );
}
