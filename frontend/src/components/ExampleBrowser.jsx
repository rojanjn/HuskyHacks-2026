import { EXAMPLES } from '@/data/examples';

export default function ExampleBrowser({ onSelectExample }) {
  return (
    <div className="p-6 bg-white border-t">
      <h3 className="text-lg font-semibold mb-4">📝 Try these examples:</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {EXAMPLES.map((example) => (
          <button key={example.id} onClick={() => onSelectExample(example)} className="text-left p-4 bg-gray-50 rounded-lg border hover:border-blue-500 hover:shadow-md">
            <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded mb-3">{example.scenario}</span>
            <p className="text-sm font-medium line-clamp-2">"{example.input}"</p>
          </button>
        ))}
      </div>
    </div>
  );
}