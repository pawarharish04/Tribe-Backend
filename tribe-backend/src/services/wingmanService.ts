/**
 * AI Wingman Agent — Powered by Gemini (FREE tier)
 * An in-chat copilot that generates contextual icebreakers,
 * collaboration briefs, and conversation rescue prompts.
 */
import { GoogleGenerativeAI } from "@google/generative-ai";

function getModel() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
}

interface UserProfile {
    name: string;
    bio: string | null;
    interests: string[];
    recentPosts: { caption: string | null; interestName: string }[];
}

// ─── Smart Icebreakers on Match ──────────────────────────────────────────────
export async function generateIcebreakers(userA: UserProfile, userB: UserProfile): Promise<string[]> {
    const model = getModel();
    if (!model) {
        return [
            `Hey! I noticed we both love ${userA.interests[0] || 'creating'}. What got you into it?`,
            `Your profile caught my eye — would love to hear about your creative journey!`,
            `We seem to have a lot in common. What are you working on right now?`
        ];
    }

    try {
        const result = await model.generateContent([
            {
                text: `You are a friendly AI wingman for a creative social network called Tribe. Two creators just matched!

PERSON A:
- Name: ${userA.name}
- Bio: ${userA.bio || 'No bio yet'}
- Interests: ${userA.interests.join(', ') || 'Not specified'}
- Recent posts about: ${userA.recentPosts.map(p => p.interestName).join(', ') || 'None yet'}

PERSON B:
- Name: ${userB.name}
- Bio: ${userB.bio || 'No bio yet'}
- Interests: ${userB.interests.join(', ') || 'Not specified'}
- Recent posts about: ${userB.recentPosts.map(p => p.interestName).join(', ') || 'None yet'}

Generate 3 personalized, warm, natural-sounding icebreaker messages that Person A could send to Person B. These should:
- Reference specific shared interests or complementary skills
- Feel casual and genuine, NOT corporate or forced
- Be 1-2 sentences each
- Encourage a real conversation

Respond ONLY with a JSON array of 3 strings:
["message1", "message2", "message3"]`
            }
        ]);

        const text = result.response.text().trim();
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]).slice(0, 3);
        }
        return [];
    } catch (error) {
        console.error("[AI Wingman] Icebreaker generation error:", error);
        return [];
    }
}

// ─── Collaboration Brief Generator ───────────────────────────────────────────
export async function generateCollaborationBrief(userA: UserProfile, userB: UserProfile): Promise<string> {
    const model = getModel();
    if (!model) {
        return `## Collaboration Brief\n\n**${userA.name} × ${userB.name}**\n\nYou both share interests in ${userA.interests.slice(0, 2).join(' and ')}. Consider collaborating on a creative project that combines your unique perspectives!`;
    }

    try {
        const result = await model.generateContent([
            {
                text: `You are a creative director AI for Tribe, a creative social network. Generate a collaboration brief for two matched creators.

CREATOR A:
- Name: ${userA.name}
- Bio: ${userA.bio || 'No bio yet'}
- Interests: ${userA.interests.join(', ')}
- Recent work themes: ${userA.recentPosts.map(p => `${p.interestName}: "${p.caption || 'untitled'}"`).join(', ') || 'None'}

CREATOR B:
- Name: ${userB.name}
- Bio: ${userB.bio || 'No bio yet'}
- Interests: ${userB.interests.join(', ')}
- Recent work themes: ${userB.recentPosts.map(p => `${p.interestName}: "${p.caption || 'untitled'}"`).join(', ') || 'None'}

Generate a creative collaboration brief in this exact markdown format:

## ${userA.name} × ${userB.name}

**Project Concept:** [A specific, inspiring project idea combining both creators' strengths]

**${userA.name} brings:** [2-3 specific skills/perspectives]
**${userB.name} brings:** [2-3 specific skills/perspectives]

**Suggested Deliverable:** [A concrete output they could create together]

**Timeline:** [Realistic estimate]

Keep it inspiring, specific, and actionable. Output ONLY the markdown, no code fences.`
            }
        ]);

        return result.response.text().trim();
    } catch (error) {
        console.error("[AI Wingman] Collaboration brief error:", error);
        return `## Collaboration Brief\n\nWe couldn't generate a brief right now. Try chatting about your shared interests and see what clicks!`;
    }
}

// ─── Conversation Rescue (when chat goes cold) ──────────────────────────────
export async function generateConversationRescue(
    userA: UserProfile,
    userB: UserProfile,
    recentMessages: { sender: string; content: string }[]
): Promise<string[]> {
    const model = getModel();
    if (!model) {
        return [
            "What creative project are you most excited about right now?",
            "I'd love to see more of your work — got any recent pieces you're proud of?",
            "Have you tried any new techniques or tools lately?"
        ];
    }

    try {
        const chatHistory = recentMessages
            .slice(-10)
            .map(m => `${m.sender}: ${m.content}`)
            .join('\n');

        const result = await model.generateContent([
            {
                text: `You are a conversational AI wingman. A conversation between two creators on Tribe has gone quiet. Help ${userA.name} re-engage.

${userA.name}'s interests: ${userA.interests.join(', ')}
${userB.name}'s interests: ${userB.interests.join(', ')}

Last messages:
${chatHistory || '[No recent messages]'}

Generate 3 natural conversation starters that ${userA.name} could send to reignite the conversation. These should:
- Reference something from the conversation or their shared interests
- Feel natural, not forced
- Ask an engaging question

JSON array only:
["message1", "message2", "message3"]`
            }
        ]);

        const text = result.response.text().trim();
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]).slice(0, 3);
        }
        return [];
    } catch (error) {
        console.error("[AI Wingman] Rescue generation error:", error);
        return [];
    }
}
