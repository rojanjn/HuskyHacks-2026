import { Router } from "express";
import { ai } from "@workspace/integrations-gemini-ai";
import { db } from "@workspace/db";
import { translationsTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import {
  TranslateTextBody,
} from "@workspace/api-zod";

const router = Router();

const EXAMPLE_PHRASES = [
  { text: "no cap fr fr, that bussin no 🧢", language: "English (Gen Z)", description: "Gen Z internet slang" },
  { text: "不装了我摊牌了", language: "Chinese", description: "Chinese internet slang meaning 'I'll stop pretending and lay my cards on the table'" },
  { text: "ostia tío, qué fuerte", language: "Spanish", description: "Spanish slang — expression of shock or disbelief" },
  { text: "it is what it is", language: "English", description: "English idiom with deep cultural weight" },
  { text: "ça marche", language: "French", description: "French casual expression for 'works for me / okay'" },
  { text: "بعمل كده عشان بحبك", language: "Arabic (Egyptian)", description: "Egyptian Arabic — 'I do this because I love you'" },
  { text: "마음이 콩밭에 가 있다", language: "Korean", description: "Korean idiom — mind is in a bean field (distracted)" },
  { text: "shikata ga nai", language: "Japanese", description: "Japanese phrase meaning 'it cannot be helped'" },
];

router.get("/examples", (_req, res) => {
  res.json(EXAMPLE_PHRASES);
});

router.get("/history", async (req, res) => {
  try {
    const history = await db
      .select()
      .from(translationsTable)
      .orderBy(desc(translationsTable.createdAt))
      .limit(10);

    res.json(
      history.map((row) => ({
        id: row.id,
        text: row.text,
        source_language: row.sourceLanguage,
        target_language: row.targetLanguage,
        register: row.register,
        result: row.result,
        created_at: row.createdAt,
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to fetch translation history");
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

router.post("/", async (req, res) => {
  const parsed = TranslateTextBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { text, sourceLanguage = "auto", targetLanguage = "English", register = "casual" } = parsed.data;

  const systemPrompt = `You are a cultural linguist and slang expert. The user will give you a phrase or sentence. You must return a JSON object (no markdown, pure JSON) with these exact fields:
- "literal_translation": word-for-word translation to ${targetLanguage}
- "contextual_meaning": what this phrase actually means in real conversation (2-3 sentences)
- "slang_breakdown": array of objects, each with "term" and "explanation" for any slang, idiom, or figurative language detected. If none, return empty array.
- "tone": one of exactly these values: "formal", "casual", "humorous", "sarcastic", "aggressive", "affectionate", "neutral"
- "cultural_notes": any cultural context important for understanding the phrase (1-3 sentences)
- "equivalent_phrase": the most natural equivalent in ${targetLanguage} that a native speaker would use (consider the ${register} register)
- "detected_language": the language/dialect of the input text

Always detect the source language automatically${sourceLanguage !== "auto" ? `. The user believes it is ${sourceLanguage}` : ""}.
Target register/formality level: ${register}.
Return only valid JSON, no markdown code blocks.`;

  const userMessage = `Translate and analyze this text: "${text}"`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    });

    const rawText = response.text ?? "{}";
    let result: Record<string, unknown>;

    try {
      result = JSON.parse(rawText);
    } catch {
      req.log.error({ rawText }, "Failed to parse Gemini JSON response");
      res.status(500).json({ error: "Failed to parse AI response" });
      return;
    }

    // Save to history
    try {
      await db.insert(translationsTable).values({
        text,
        sourceLanguage,
        targetLanguage,
        register,
        result,
      });
    } catch (dbErr) {
      req.log.warn({ dbErr }, "Failed to save translation to history");
    }

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Gemini API error");
    res.status(500).json({ error: "Translation failed. Please try again." });
  }
});

export default router;
