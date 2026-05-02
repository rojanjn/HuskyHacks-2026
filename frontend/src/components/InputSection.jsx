'use client';

export default function InputSection({
  input, setInput, language, setLanguage, scenario, setScenario,
  onTranslate, loading
}) {
  return (
    <div className="p-6 bg-white border-b">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex gap-4">
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="flex-1 px-4 py-2 border rounded-lg">
            <option>Indonesian</option>
            <option>Tagalog</option>
            <option>Spanish</option>
          </select>
          <select value={scenario} onChange={(e) => setScenario(e.target.value)} className="flex-1 px-4 py-2 border rounded-lg">
            <option>Medical</option>
            <option>Legal</option>
            <option>School</option>
          </select>
        </div>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste text here..." className="w-full p-4 border rounded-lg h-24" />
        <button onClick={onTranslate} disabled={loading} className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {loading ? "Translating..." : "🔤 Translate"}
        </button>
      </div>
    </div>
  );
}