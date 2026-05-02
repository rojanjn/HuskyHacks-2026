'use client';
import { useState } from 'react';
import Header from '@/components/Header';
import InputSection from '@/components/InputSection';
import OutputCard from '@/components/OutputCard';
import SidePanel from '@/components/SidePanel';
import ExampleBrowser from '@/components/ExampleBrowser';
import { translateText } from '@/utils/api';
import { EXAMPLES } from '@/data/examples';

export default function Home() {
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("Indonesian");
  const [scenario, setScenario] = useState("Medical");
  const [translation, setTranslation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleTranslate = async () => {
    if (!input.trim()) { setError("Please enter text"); return; }
    setLoading(true); setError(null);
    try {
      const result = await translateText(input, "English", language, scenario);
      setTranslation(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExample = (example) => {
    setInput(example.input);
    setLanguage(example.language);
    setScenario(example.scenario);
    setTranslation(example.output);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex max-w-7xl mx-auto">
        <div className="flex-1">
          <InputSection input={input} setInput={setInput} language={language} setLanguage={setLanguage} scenario={scenario} setScenario={setScenario} onTranslate={handleTranslate} loading={loading} />
          {error && <div className="p-4 m-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}
          {translation && <div className="flex gap-6"><OutputCard translation={translation} /><SidePanel /></div>}
          {!translation && <ExampleBrowser onSelectExample={handleSelectExample} />}
        </div>
      </div>
    </div>
  );
}