const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function translateText(text, sourceLanguage, targetLanguage, scenario) {
  const response = await fetch(`${API_URL}/api/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, sourceLanguage, targetLanguage, scenario })
  });
  if (!response.ok) throw new Error('Translation failed');
  return await response.json();
}