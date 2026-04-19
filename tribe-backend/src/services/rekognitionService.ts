/**
 * AI Vision Service — Powered by Gemini (FREE tier)
 * Replaces AWS Rekognition for: content moderation, identity verification, auto-tagging.
 * Uses gemini-2.0-flash (free: 15 RPM, 1M TPM).
 */
import { GoogleGenerativeAI } from "@google/generative-ai";

function getModel() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
}

// ─── Content Moderation ──────────────────────────────────────────────────────
export async function moderateMedia(base64Image: string): Promise<{ isSafe: boolean; flaggedLabels: string[] }> {
    const model = getModel();
    if (!model) {
        console.warn("[AI Vision] GEMINI_API_KEY not set — skipping moderation.");
        return { isSafe: true, flaggedLabels: [] };
    }

    try {
        const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");
        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: "image/jpeg",
                    data: cleanBase64
                }
            },
            {
                text: `You are a content moderation system. Analyze this image and determine if it contains any of the following:
- Explicit nudity or sexual content
- Extreme violence or gore
- Hate symbols or extremist imagery
- Drug use or illegal activity

Respond ONLY with a JSON object in this exact format, no markdown:
{"isSafe": true, "flaggedLabels": []}

If unsafe, set isSafe to false and list the categories found in flaggedLabels.`
            }
        ]);

        const text = result.response.text().trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                isSafe: parsed.isSafe ?? true,
                flaggedLabels: parsed.flaggedLabels ?? []
            };
        }
        return { isSafe: true, flaggedLabels: [] };
    } catch (error) {
        console.error("[AI Vision] Moderation error:", error);
        return { isSafe: true, flaggedLabels: [] };
    }
}

// ─── Identity Verification (Face Comparison) ────────────────────────────────
export async function verifyIdentity(selfieBase64: string, avatarBase64: string): Promise<boolean> {
    const model = getModel();
    if (!model) return true;

    try {
        const cleanSelfie = selfieBase64.replace(/^data:image\/\w+;base64,/, "");
        const cleanAvatar = avatarBase64.replace(/^data:image\/\w+;base64,/, "");

        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: "image/jpeg",
                    data: cleanSelfie
                }
            },
            {
                inlineData: {
                    mimeType: "image/jpeg",
                    data: cleanAvatar
                }
            },
            {
                text: `Compare these two face images. Determine if they are LIKELY the same person.
Consider facial structure, features, and overall appearance. Minor differences in lighting, angle, or accessories are acceptable.

Respond ONLY with a JSON object:
{"isSamePerson": true, "confidence": 0.85}

confidence should be 0.0 to 1.0. If confidence >= 0.70, consider it a match.`
            }
        ]);

        const text = result.response.text().trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return (parsed.confidence ?? 0) >= 0.70;
        }
        return false;
    } catch (error) {
        console.error("[AI Vision] Identity verification error:", error);
        return false;
    }
}

// ─── Auto-Tagging (Object/Scene Detection) ───────────────────────────────────
export async function detectLabels(base64Image: string): Promise<string[]> {
    const model = getModel();
    if (!model) {
        console.warn("[AI Vision] GEMINI_API_KEY not set — returning mock tags.");
        return ["Outdoors", "Adventure", "Nature"];
    }

    try {
        const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: "image/jpeg",
                    data: cleanBase64
                }
            },
            {
                text: `You are an image tagging system for a creative social network. Analyze this image and return the most relevant creative interest/hobby tags.

Examples of good tags: Photography, Painting, Music, Cooking, Fashion, Travel, Fitness, Gaming, Writing, Dance, Filmmaking, Architecture, Surfing, Skateboarding, Gardening, Pottery, Calligraphy, Street Art, Digital Art, Woodworking

Return ONLY a JSON array of 3-5 single-word or two-word tags:
["Photography", "Travel", "Nature"]

No markdown, no explanation — just the JSON array.`
            }
        ]);

        const text = result.response.text().trim();
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return parsed.filter((t: unknown) => typeof t === 'string').slice(0, 5);
        }
        return [];
    } catch (error) {
        console.error("[AI Vision] Label detection error:", error);
        return [];
    }
}
