'use client';
import { useState } from 'react';

export default function OutputCard({ translation }) {
  const [expanded, setExpanded] = useState(false);
  const urgencyConfig = {
    low: { bg: "bg-green-50", badge: "🟢" },
    moderate: { bg: "bg-amber-50", badge: "🟡" },
    high: { bg: "bg-red-50", badge: "🔴" }
  };
  const config = urgencyConfig[translation.urgency?.toLowerCase()] || urgencyConfig.low;

  return (
    <div className="flex-1 space-y-4 p-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="font-semibold text-blue-700 mb-2">📍 Literal Translation</h2>
        <p className="text-lg font-medium">{translation.literal}</p>
        <p className="text-sm text-gray-600 italic">{translation.literalTranslated}</p>
      </div>

      <div className={`${config.bg} border rounded-lg p-4`}>
        <h2 className="font-semibold mb-2">⚠️ Contextual Meaning {config.badge}</h2>
        <p className="text-lg font-medium">{translation.context}</p>
        <p className="text-sm text-gray-600 italic">{translation.contextTranslated}</p>
      </div>

      <button onClick={() => setExpanded(!expanded)} className="w-full py-3 border rounded-lg hover:bg-gray-50">
        {expanded ? "▼" : "▶"} ? Meaning Breakdown
      </button>

      {expanded && (
        <div className="bg-gray-50 border rounded-lg p-4 space-y-3">
          <div><p className="font-semibold text-sm">📊 Tone</p><p className="text-sm text-gray-600">{translation.tone}</p></div>
          <div><p className="font-semibold text-sm">😊 Emotion</p><p className="text-sm text-gray-600">{translation.emotion}</p></div>
          <div><p className="font-semibold text-sm">🔍 Clarity</p><p className="text-sm text-gray-600">{translation.clarity}</p></div>
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-sm font-semibold text-blue-900">💡 Why the gap?</p>
            <p className="text-sm text-blue-800">{translation.whyExpanded}</p>
          </div>
        </div>
      )}
    </div>
  );
}