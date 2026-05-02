import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const translationsTable = pgTable("translations", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  sourceLanguage: text("source_language").notNull().default("auto"),
  targetLanguage: text("target_language").notNull().default("English"),
  register: text("register").notNull().default("casual"),
  result: jsonb("result").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTranslationSchema = createInsertSchema(translationsTable).omit({ id: true, createdAt: true });
export type InsertTranslation = z.infer<typeof insertTranslationSchema>;
export type Translation = typeof translationsTable.$inferSelect;
