import { ai } from "../ai/geminiClient";
import { IIssue } from "../models/AuditResult";

export const generateExplanations = async (
  issues: IIssue[],
): Promise<IIssue[]> => {
  if (issues.length === 0) return [];

  const prompt = `
    You are a technical SEO expert. I will provide a JSON array of SEO issues.
    For each issue, return a JSON array of objects with the exact same 'type', 'severity', and 'element' fields, but add:
    - 'explanation': A 1-sentence explanation of why it matters.
    - 'fix': A concise code snippet or developer instruction to fix it.
    
    Issues: ${JSON.stringify(issues)}
    
    Return ONLY valid JSON. No markdown formatting, no backticks.
    `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  const textResult = response.text || "[]";
  const cleanedText = textResult
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleanedText) as IIssue[];
  } catch (e) {
    console.error("Failed to parse Gemini output:", textResult);
    throw new Error("AI returned invalid JSON");
  }
};
