import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

if (!process.env.GEMINI_API_KEY) {
  console.error("CRITICAL: GEMINI_API_KEY is not set.");
  process.exit(1);
}

export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
