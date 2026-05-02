export default function SidePanel() {
  return (
    <div className="w-80 bg-white border-l p-6 space-y-4">
      <div>
        <h3 className="font-semibold mb-2">💡 Why this matters</h3>
        <p className="text-sm text-gray-700">Doctors often use indirect language to avoid causing panic. This phrase indicates a potential concern.</p>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs font-semibold text-blue-900">💬 Pro tip:</p>
        <p className="text-xs text-blue-800 mt-1">Save this translation to discuss with a trusted adult.</p>
      </div>
    </div>
  );
}