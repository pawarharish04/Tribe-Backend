/**
 * AI Text Safety Service — Powered by Gemini (FREE tier)
 * Replaces AWS Comprehend for toxicity detection in chat messages.
 * Uses gemini-2.0-flash (free: 15 RPM, 1M TPM).
 */
import { GoogleGenerativeAI } from "@google/generative-ai";

function getModel() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
}

export async function isToxic(text: string): Promise<boolean> {
    if (!text || text.trim().length === 0) return false;

    const model = getModel();
    if (!model) {
        // No API key — skip toxicity check gracefully
        return false;
    }

    try {
        const result = await model.generateContent([
            {
                text: `You are a content safety classifier for a social network chat.
Analyze the following message and determine if it contains:
- Hate speech or discrimination
- Harassment, bullying, or threats
- Explicit sexual content
- Spam or scam links
- Violent threats

Message: "${text}"

Respond ONLY with a JSON object:
{"toxic": false, "reason": ""}

Set toxic to true and provide the reason ONLY if the message is clearly harmful. Do NOT flag normal conversations, mild disagreements, or casual language.`
            }
        ]);

        const responseText = result.response.text().trim();
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.toxic) {
                console.log(`[AI Safety] Toxic message blocked: "${text.slice(0, 50)}..." — Reason: ${parsed.reason}`);
            }
            return parsed.toxic ?? false;
        }
        return false;
    } catch (error) {
        console.error("[AI Safety] Toxicity check error:", error);
        return false; // Fail open — don't block messages on API errors
    }
}
