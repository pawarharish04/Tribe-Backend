import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateBioEmbedding(text: string): Promise<number[]> {
    if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY not found, mocking 768-d embedding vector.");
        return new Array(768).fill(0).map(() => Math.random() * 2 - 1);
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    try {
        const model = genAI.getGenerativeModel({ model: "text-embedding-004"});
        const result = await model.embedContent(text);
        const embedding = result.embedding;
        return embedding.values; 
    } catch (error) {
        console.error("Embedding Error:", error);
        throw new Error("Failed to generate embedding");
    }
}
