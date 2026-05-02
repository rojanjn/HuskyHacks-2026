import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Copy, ChevronDown, ChevronUp, Clock, Zap, Globe, RotateCcw } from "lucide-react";
import {
  useTranslateText,
  useGetTranslationHistory,
  getGetTranslationHistoryQueryKey,
  useGetExamples,
  getGetExamplesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

type TranslateResponse = {
  literal_translation: string;
  contextual_meaning: string;
  slang_breakdown: Array<{ term: string; explanation: string }>;
  tone: "formal" | "casual" | "humorous" | "sarcastic" | "aggressive" | "affectionate" | "neutral";
  cultural_notes: string;
  equivalent_phrase: string;
  detected_language: string;
};

type TranslationRecord = {
  id: number;
  text: string;
  source_language: string;
  target_language: string;
  register: string;
  result: TranslateResponse;
  created_at: string;
};

const LANGUAGES = [
  "Auto-detect",
  "English",
  "Chinese",
  "Spanish",
  "Japanese",
  "Korean",
  "French",
  "Arabic",
  "Hindi",
  "Portuguese",
  "German",
  "Italian",
  "Russian",
];

const REGISTERS = [
  { value: "formal", label: "Formal" },
  { value: "casual", label: "Casual" },
  { value: "slang", label: "Slang" },
  { value: "street", label: "Street" },
  { value: "internet", label: "Internet / Meme" },
];

const TONE_COLORS: Record<string, string> = {
  formal: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  casual: "bg-green-500/20 text-green-300 border-green-500/40",
  humorous: "bg-orange-500/20 text-orange-300 border-orange-500/40",
  sarcastic: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  aggressive: "bg-red-500/20 text-red-300 border-red-500/40",
  affectionate: "bg-pink-500/20 text-pink-300 border-pink-500/40",
  neutral: "bg-gray-500/20 text-gray-300 border-gray-500/40",
};

function SlangPill({ term, explanation }: { term: string; explanation: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        className="px-3 py-1 rounded-full text-xs font-medium border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
      >
        {term}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 bottom-full mb-2 left-0 min-w-[180px] max-w-[260px] rounded-lg border border-border bg-card/95 backdrop-blur-sm p-3 shadow-xl text-xs text-card-foreground"
          >
            <p className="font-semibold text-primary mb-1">{term}</p>
            <p className="text-muted-foreground leading-relaxed">{explanation}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ResultCard({
  title,
  children,
  collapsible = false,
  delay = 0,
}: {
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
  delay?: number;
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="rounded-xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden"
    >
      <button
        className={`w-full flex items-center justify-between px-5 py-4 ${collapsible ? "cursor-pointer hover:bg-muted/20 transition-colors" : "cursor-default"}`}
        onClick={() => collapsible && setCollapsed((c) => !c)}
      >
        <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">{title}</span>
        {collapsible && (
          <span className="text-muted-foreground">
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </span>
        )}
      </button>
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={collapsible ? { height: 0, opacity: 0 } : false}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-5 animate-pulse">
      <div className="h-3 w-24 bg-muted rounded mb-4" />
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-4/5" />
        <div className="h-4 bg-muted rounded w-3/5" />
      </div>
    </div>
  );
}

export function MainWorkspace() {
  const [text, setText] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("Auto-detect");
  const [targetLanguage, setTargetLanguage] = useState("English");
  const [register, setRegister] = useState("casual");
  const [result, setResult] = useState<TranslateResponse | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copiedPhrase, setCopiedPhrase] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const queryClient = useQueryClient();

  const { data: history = [] } = useGetTranslationHistory({
    query: { queryKey: getGetTranslationHistoryQueryKey() },
  });

  const { data: examples = [] } = useGetExamples({
    query: { queryKey: getGetExamplesQueryKey() },
  });

  const translate = useTranslateText({
    mutation: {
      onSuccess: (data) => {
        setResult(data as unknown as TranslateResponse);
        queryClient.invalidateQueries({ queryKey: getGetTranslationHistoryQueryKey() });
        setShowExamples(false);
      },
    },
  });

  const handleTranslate = () => {
    if (!text.trim()) return;
    setResult(null);
    translate.mutate({
      data: {
        text: text.trim(),
        sourceLanguage: sourceLanguage === "Auto-detect" ? "auto" : sourceLanguage,
        targetLanguage,
        register: register as "formal" | "casual" | "slang" | "street" | "internet",
      },
    });
  };

  const handleVoiceInput = useCallback(() => {
    setMicError(null);

    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setMicError("Voice input is not supported in this browser. Try Chrome.");
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognitionAPI =
      (window as unknown as { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "";

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setText((prev) => (prev ? prev + " " + transcript : transcript));
      setMicError(null);
    };

    recognition.onend = () => setIsRecording(false);

    recognition.onerror = (event) => {
      setIsRecording(false);
      const code = (event as SpeechRecognitionErrorEvent).error;
      if (code === "not-allowed" || code === "service-not-allowed") {
        setMicError("Microphone access was denied. Please allow microphone permission in your browser and try again.");
      } else if (code === "no-speech") {
        setMicError("No speech detected. Please try again.");
      } else if (code === "network") {
        setMicError("Network error. Speech recognition requires an internet connection.");
      } else {
        setMicError(`Voice input failed (${code}). Please try again.`);
      }
    };

    try {
      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    } catch {
      setMicError("Could not start voice input. Please try again.");
    }
  }, [isRecording]);

  const copyEquivalentPhrase = () => {
    if (result?.equivalent_phrase) {
      navigator.clipboard.writeText(result.equivalent_phrase);
      setCopiedPhrase(true);
      setTimeout(() => setCopiedPhrase(false), 2000);
    }
  };

  const loadFromHistory = (record: TranslationRecord) => {
    setText(record.text);
    setSourceLanguage(record.source_language === "auto" ? "Auto-detect" : record.source_language);
    setTargetLanguage(record.target_language);
    setRegister(record.register);
    setResult(record.result);
    setSidebarOpen(false);
  };

  const handleExampleClick = (phrase: string) => {
    setText(phrase);
    setShowExamples(false);
  };

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="text-primary" size={20} />
            <span className="font-bold text-lg tracking-tight text-foreground">
              Slang<span className="text-primary">Sense</span>
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border hover:border-primary/40"
            data-testid="button-history"
          >
            <Clock size={13} />
            History
          </button>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex-1 flex relative">
        {/* Sidebar overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.aside
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed right-0 top-0 bottom-0 z-30 w-80 bg-card border-l border-border flex flex-col overflow-hidden"
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <span className="font-semibold text-sm tracking-tight">Recent Translations</span>
                  <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <RotateCcw size={14} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto py-2">
                  {(history as TranslationRecord[]).length === 0 ? (
                    <div className="px-5 py-8 text-center text-muted-foreground text-sm">
                      No translations yet. Try translating something!
                    </div>
                  ) : (
                    (history as TranslationRecord[]).map((record, i) => (
                      <motion.button
                        key={record.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => loadFromHistory(record)}
                        className="w-full text-left px-5 py-3 hover:bg-muted/30 transition-colors border-b border-border/40 last:border-0"
                        data-testid={`button-history-item-${record.id}`}
                      >
                        <p className="text-sm text-foreground line-clamp-1 font-medium">{record.text}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {record.source_language} → {record.target_language}
                        </p>
                      </motion.button>
                    ))
                  )}
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Content */}
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
          {/* Input section */}
          <motion.section
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm overflow-hidden shadow-lg mb-6"
          >
            {/* Controls bar */}
            <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-border/50">
              <select
                value={sourceLanguage}
                onChange={(e) => setSourceLanguage(e.target.value)}
                className="flex-1 min-w-[120px] text-xs bg-muted/50 border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/60 transition-colors"
                data-testid="select-source-language"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>

              <span className="text-muted-foreground text-xs">→</span>

              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="flex-1 min-w-[120px] text-xs bg-muted/50 border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/60 transition-colors"
                data-testid="select-target-language"
              >
                {LANGUAGES.filter((l) => l !== "Auto-detect").map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>

              <select
                value={register}
                onChange={(e) => setRegister(e.target.value)}
                className="flex-1 min-w-[140px] text-xs bg-muted/50 border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/60 transition-colors"
                data-testid="select-register"
              >
                {REGISTERS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {/* Text area */}
            <div className="relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleTranslate();
                }}
                placeholder="Type or paste any text — slang, idioms, dialect, internet-speak..."
                className="w-full bg-transparent px-5 py-4 text-sm text-foreground placeholder:text-muted-foreground/60 resize-none focus:outline-none min-h-[140px] font-mono leading-relaxed"
                data-testid="input-text"
              />
              {/* Voice button */}
              <button
                onClick={handleVoiceInput}
                className={`absolute bottom-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  isRecording
                    ? "bg-red-500 text-white shadow-lg shadow-red-500/40 scale-110"
                    : "bg-muted/60 text-muted-foreground hover:bg-primary/20 hover:text-primary border border-border"
                }`}
                data-testid="button-voice"
                title="Voice input"
              >
                {isRecording ? (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    <MicOff size={15} />
                  </motion.div>
                ) : (
                  <Mic size={15} />
                )}
              </button>
            </div>

            {/* Mic error */}
            <AnimatePresence>
              {micError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-2 px-4 py-2 bg-red-500/10 border-t border-red-500/20 text-xs text-red-300">
                    <MicOff size={12} className="mt-0.5 shrink-0" />
                    <span>{micError}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action bar */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
              <button
                onClick={() => setShowExamples((s) => !s)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                data-testid="button-examples"
              >
                <Zap size={12} />
                Try an example
              </button>
              <div className="flex items-center gap-3">
                {text && (
                  <span className="text-xs text-muted-foreground/60">⌘↵ to translate</span>
                )}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleTranslate}
                  disabled={translate.isPending || !text.trim()}
                  className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  data-testid="button-translate"
                >
                  {translate.isPending ? "Analyzing..." : "Translate"}
                </motion.button>
              </div>
            </div>
          </motion.section>

          {/* Examples panel */}
          <AnimatePresence>
            {showExamples && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-6"
              >
                <div className="rounded-xl border border-border bg-card/60 p-4">
                  <p className="text-xs text-muted-foreground mb-3 font-semibold tracking-wider uppercase">Sample phrases</p>
                  <div className="flex flex-wrap gap-2">
                    {examples.map((ex, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => handleExampleClick(ex.text)}
                        className="group flex flex-col items-start px-3 py-2 rounded-lg border border-border hover:border-primary/50 bg-muted/30 hover:bg-primary/10 transition-all text-left max-w-[200px]"
                        data-testid={`button-example-${i}`}
                      >
                        <span className="text-xs font-medium text-foreground line-clamp-1">{ex.text}</span>
                        <span className="text-xs text-muted-foreground/70 mt-0.5">{ex.language}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading skeletons */}
          <AnimatePresence>
            {translate.isPending && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {[1, 2, 3, 4].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error state */}
          <AnimatePresence>
            {translate.isError && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300"
                data-testid="text-error"
              >
                Translation failed. Please check your connection and try again.
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          <AnimatePresence>
            {result && !translate.isPending && (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {/* Detected language badge */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                >
                  <Globe size={12} />
                  <span>Detected: <span className="text-primary font-medium">{result.detected_language}</span></span>
                </motion.div>

                {/* Literal Translation */}
                <ResultCard title="Literal Translation" delay={0.05}>
                  <p className="text-foreground text-base leading-relaxed font-mono" data-testid="text-literal-translation">
                    {result.literal_translation}
                  </p>
                </ResultCard>

                {/* What It Actually Means */}
                <ResultCard title="What It Actually Means" delay={0.1}>
                  <p className="text-foreground text-sm leading-relaxed" data-testid="text-contextual-meaning">
                    {result.contextual_meaning}
                  </p>
                </ResultCard>

                {/* Slang Breakdown */}
                {result.slang_breakdown.length > 0 && (
                  <ResultCard title="Slang / Figurative Breakdown" delay={0.15}>
                    <div className="flex flex-wrap gap-2" data-testid="list-slang-breakdown">
                      {result.slang_breakdown.map((item, i) => (
                        <SlangPill key={i} term={item.term} explanation={item.explanation} />
                      ))}
                    </div>
                  </ResultCard>
                )}

                {/* Tone & Natural Equivalent */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tone */}
                  <ResultCard title="Tone" delay={0.2}>
                    <div className="flex items-center gap-2" data-testid="badge-tone">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border capitalize ${TONE_COLORS[result.tone] ?? TONE_COLORS.neutral}`}>
                        {result.tone}
                      </span>
                    </div>
                  </ResultCard>

                  {/* Natural Equivalent */}
                  <ResultCard title="Natural Equivalent" delay={0.25}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-foreground text-sm leading-relaxed font-mono flex-1" data-testid="text-equivalent-phrase">
                        {result.equivalent_phrase}
                      </p>
                      <button
                        onClick={copyEquivalentPhrase}
                        className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mt-0.5"
                        data-testid="button-copy"
                      >
                        <Copy size={12} />
                        {copiedPhrase ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </ResultCard>
                </div>

                {/* Cultural Notes */}
                <ResultCard title="Cultural Notes" collapsible delay={0.3}>
                  <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-cultural-notes">
                    {result.cultural_notes}
                  </p>
                </ResultCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state */}
          {!result && !translate.isPending && !translate.isError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                <Globe className="text-primary/70" size={28} />
              </div>
              <p className="text-muted-foreground text-sm max-w-xs">
                Enter any text — slang, idiom, or phrase — and SlangSense will decode its meaning, tone, and cultural context.
              </p>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
