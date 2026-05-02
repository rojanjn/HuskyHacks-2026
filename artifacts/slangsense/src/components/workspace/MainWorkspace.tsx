/// <reference lib="dom" />
import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, Home, Clock, Settings, HelpCircle, ChevronDown,
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
interface SpeechRecognitionConstructor { new(): ISpeechRecognition; }

// ── Constants ────────────────────────────────────────────────────────────────

const LANGUAGES = [
  "Auto-detect", "English", "Indonesian", "Chinese", "Spanish",
  "Japanese", "Korean", "French", "Arabic", "Hindi", "Portuguese", "German",
];

const CONTEXTS = ["Casual", "Medical", "Legal", "School", "Business", "Tech"];

const CONTEXT_TO_REGISTER: Record<string, "formal" | "casual" | "slang" | "street" | "internet"> = {
  Medical: "formal", Legal: "formal", School: "formal",
  Business: "formal", Casual: "casual", Tech: "casual",
};

// ── Robot mascot SVG ──────────────────────────────────────────────────────────

function RobotMascot({ size = 120, thinking = false }: { size?: number; thinking?: boolean }) {
  return (
    <motion.div
      animate={thinking ? { y: [0, -6, 0] } : { y: [0, -3, 0] }}
      transition={{ duration: thinking ? 1.2 : 2.5, repeat: Infinity, ease: "easeInOut" }}
      style={{ width: size, height: size, flexShrink: 0 }}
    >
      <svg viewBox="0 0 120 130" fill="none" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
        {/* Cape */}
        <ellipse cx="60" cy="115" rx="28" ry="10" fill="#1a3a6e" opacity="0.3" />
        <path d="M35 85 Q30 110 20 118 Q60 125 100 118 Q90 110 85 85Z" fill="#2355b0" />
        <path d="M35 85 Q30 110 20 118 Q40 120 60 118Z" fill="#1a44a0" />
        {/* Body */}
        <rect x="28" y="58" width="64" height="52" rx="16" fill="#2a65d0" />
        <rect x="28" y="58" width="64" height="52" rx="16" fill="url(#bodyGrad)" />
        {/* Belly screen */}
        <rect x="38" y="68" width="44" height="28" rx="8" fill="#1a3a7a" opacity="0.6" />
        <rect x="41" y="71" width="38" height="22" rx="6" fill="#0f2456" opacity="0.8" />
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
        <rect x="22" y="14" width="76" height="56" rx="22" fill="url(#headGrad)" />
        {/* Antenna */}
        <rect x="57" y="4" width="6" height="14" rx="3" fill="#2a65d0" />
        <circle cx="60" cy="4" r="5" fill="#4af0c0" />
        <motion.circle
          cx="60" cy="4" r="5"
          fill="#4af0c0"
          animate={{ opacity: [1, 0.3, 1], r: [5, 7, 5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        {/* Eyes */}
        <ellipse cx="46" cy="36" rx="11" ry="12" fill="white" />
        <ellipse cx="74" cy="36" rx="11" ry="12" fill="white" />
        <motion.ellipse
          cx="46" cy="37" rx="7" ry="8"
          fill="#1a44c0"
          animate={thinking ? { scaleY: [1, 0.1, 1] } : { scaleY: 1 }}
          transition={{ duration: 0.15, repeat: thinking ? Infinity : 0, repeatDelay: 2 }}
        />
        <motion.ellipse
          cx="74" cy="37" rx="7" ry="8"
          fill="#1a44c0"
          animate={thinking ? { scaleY: [1, 0.1, 1] } : { scaleY: 1 }}
          transition={{ duration: 0.15, repeat: thinking ? Infinity : 0, repeatDelay: 2, delay: 0.05 }}
        />
        <circle cx="48" cy="35" r="2.5" fill="white" />
        <circle cx="76" cy="35" r="2.5" fill="white" />
        {/* Mouth */}
        {thinking ? (
          <path d="M46 54 Q60 52 74 54" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        ) : (
          <path d="M46 54 Q60 60 74 54" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        )}
        {/* Cheek blush */}
        <ellipse cx="34" cy="46" rx="5" ry="3" fill="#ff8aad" opacity="0.4" />
        <ellipse cx="86" cy="46" rx="5" ry="3" fill="#ff8aad" opacity="0.4" />
        <defs>
          <linearGradient id="headGrad" x1="22" y1="14" x2="98" y2="70" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#5090ff" />
            <stop offset="100%" stopColor="#2355c0" />
          </linearGradient>
          <linearGradient id="bodyGrad" x1="28" y1="58" x2="92" y2="110" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3a75e0" />
            <stop offset="100%" stopColor="#1a50b0" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  );
}

// ── Dropdown ──────────────────────────────────────────────────────────────────

function Dropdown({ value, options, onChange, label }: {
  value: string; options: string[]; onChange: (v: string) => void; label?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
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
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  value === opt ? "bg-blue-50 text-blue-600 font-semibold" : "text-gray-600 hover:bg-gray-50"
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
  title, children, accent = false, delay = 0,
}: {
  title: string; children: React.ReactNode; accent?: boolean; delay?: number;
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
      <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${accent ? "text-red-500" : "text-blue-500"}`}>
        {title}
      </div>
      {children}
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
        queryClient.invalidateQueries({ queryKey: getGetTranslationHistoryQueryKey() });
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
    const API = (
      (win["SpeechRecognition"] as SpeechRecognitionConstructor | undefined) ??
      (win["webkitSpeechRecognition"] as SpeechRecognitionConstructor | undefined)
    );
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

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="w-52 flex-shrink-0 flex flex-col bg-[#1e4db7] text-white rounded-r-3xl shadow-xl">
        {/* Logo */}
        <div className="px-6 pt-8 pb-6">
          <div className="text-3xl font-black tracking-tight text-white leading-none">SayWhat</div>
          <div className="text-blue-200 text-xs mt-1 font-medium leading-snug">Translate words,<br />Understand meaning.</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 space-y-2">
          {[
            { id: "live",     icon: Home,     label: "Live Translation" },
            { id: "history",  icon: Clock,    label: "History"          },
            { id: "settings", icon: Settings, label: "Settings"         },
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
          <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-blue-400/50 text-blue-200 text-sm font-semibold hover:bg-blue-600/40 transition-colors">
            <HelpCircle size={15} />
            Need help?
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto px-8 py-6">

        {/* Top bar */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-sm text-gray-500 font-medium">From</span>
          <Dropdown value={fromLang} options={LANGUAGES} onChange={setFromLang} />
          <span className="text-sm text-gray-500 font-medium">translate to</span>
          <Dropdown value={toLang} options={LANGUAGES.filter(l => l !== "Auto-detect")} onChange={setToLang} />
          <div className="ml-auto">
            <Dropdown value={context} options={CONTEXTS} onChange={setContext} label="Context" />
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
                <h2 className="text-xl font-bold text-blue-500">Speak or type here..</h2>
                <motion.button
                  onClick={handleVoiceInput}
                  whileTap={{ scale: 0.9 }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all ${
                    isRecording ? "bg-red-500" : "bg-blue-500 hover:bg-blue-600"
                  }`}
                >
                  {isRecording ? (
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity }}>
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
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleTranslate(); }}
                placeholder="Translate something"
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
                  {isLoading ? "Translating…" : "Translate →"}
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Skeleton */}
        <AnimatePresence>
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border-2 border-gray-200 bg-white p-4 animate-pulse">
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
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

              {/* Literal Meaning */}
              <ResultCard title="Literal Meaning" delay={0.05}>
                <p className="text-gray-700 text-sm leading-relaxed">{result.literal_translation}</p>
                {result.detected_language && (
                  <p className="text-xs text-gray-400 mt-1">Detected: {result.detected_language}</p>
                )}
              </ResultCard>

              {/* Contextual Meaning */}
              <ResultCard title="Contextual Meaning" accent delay={0.1}>
                <p className="text-gray-700 text-sm leading-relaxed">{result.contextual_meaning}</p>
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
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-700 mb-2">Cultural Notes</div>
                  <p className="text-gray-600 text-sm leading-relaxed flex-1">{result.cultural_notes || "No cultural notes for this phrase."}</p>
                  {/* Little robot bottom-left with question bubble */}
                  <div className="flex items-end gap-2 mt-4">
                    <div className="relative">
                      <RobotMascot size={52} thinking={false} />
                      <div className="absolute -top-1 -right-3 w-6 h-6 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center">
                        <span className="text-blue-500 font-black text-xs">?</span>
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
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-700 mb-2">Slang/Figurative Breakdown</div>
                    {result.slang_breakdown.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {result.slang_breakdown.map((item, i) => (
                          <div key={i} className="group relative">
                            <span className="text-xs px-3 py-1 rounded-full bg-blue-500 text-white font-semibold cursor-help shadow-sm">{item.term}</span>
                            <div className="absolute bottom-full mb-1.5 left-0 hidden group-hover:block w-44 bg-gray-900 text-white text-xs p-2 rounded-xl shadow-xl z-50 pointer-events-none leading-relaxed">
                              {item.explanation}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">No slang detected.</p>
                    )}
                  </motion.div>

                  {/* Tone */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.21 }}
                    className="rounded-2xl border-2 border-red-200 bg-white p-3"
                  >
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-700 mb-1.5">Tone</div>
                    <span className={`inline-block text-xs font-bold px-3 py-1.5 rounded-full capitalize ${
                      result.tone === "aggressive" || result.tone === "sarcastic"
                        ? "bg-red-100 text-red-600"
                        : result.tone === "humorous" || result.tone === "affectionate"
                        ? "bg-green-100 text-green-600"
                        : result.tone === "formal"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-600"
                    }`}>
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
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-700 mb-1.5">Natural Equivalent</div>
                    <p className="text-sm text-gray-700 font-medium">{result.equivalent_phrase || "—"}</p>
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
            <p className="text-sm text-gray-500 mt-3 max-w-xs">Type or speak something above to get started</p>
          </div>
        )}
      </main>
    </div>
  );
}