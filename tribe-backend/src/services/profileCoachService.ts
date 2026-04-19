/**
 * AI Profile Coach — Powered by Gemini (FREE tier)
 * Analyzes a user's profile and gives actionable improvement suggestions.
 */
import { GoogleGenerativeAI } from "@google/generative-ai";

function getModel() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
}

export interface ProfileReview {
    overallScore: number;          // 0-100
    strengths: string[];           // What's great about the profile
    improvements: ProfileTip[];    // Actionable suggestions
    personalMessage: string;       // Encouraging summary 
}

export interface ProfileTip {
    category: 'bio' | 'interests' | 'posts' | 'avatar' | 'activity';
    priority: 'high' | 'medium' | 'low';
    message: string;
    impact: string;                // e.g. "3x more matches"
}

interface ProfileData {
    name: string | null;
    bio: string | null;
    avatarUrl: string | null;
    interestCount: number;
    interests: string[];
    postCount: number;
    postInterests: string[];       // interests the user has posted about
    matchCount: number;
    isVerified: boolean;
    daysSinceJoined: number;
}

export async function reviewProfile(profile: ProfileData): Promise<ProfileReview> {
    const model = getModel();

    // Rule-based fallback if no API key
    if (!model) {
        return generateRuleBasedReview(profile);
    }

    try {
        const result = await model.generateContent([
            {
                text: `You are a profile optimization coach for Tribe, a creative social network. Analyze this user's profile and provide specific, actionable feedback.

PROFILE DATA:
- Name: ${profile.name || 'Not set'}
- Bio: ${profile.bio ? `"${profile.bio}" (${profile.bio.length} chars)` : 'Empty'}
- Avatar: ${profile.avatarUrl ? 'Set' : 'Not set'}
- Interests: ${profile.interests.length > 0 ? profile.interests.join(', ') : 'None'} (${profile.interestCount} total)
- Posts: ${profile.postCount} total, covering: ${profile.postInterests.join(', ') || 'none'}
- Matches: ${profile.matchCount}
- Verified: ${profile.isVerified ? 'Yes' : 'No'}
- Account age: ${profile.daysSinceJoined} days

Respond ONLY with this JSON structure:
{
  "overallScore": 65,
  "strengths": ["Your interests are well-defined", "Active poster"],
  "improvements": [
    {
      "category": "bio",
      "priority": "high",
      "message": "Your bio is only 12 characters. Profiles with 50+ word bios get 3x more matches. Tell people what you create and what excites you.",
      "impact": "3x more matches"
    }
  ],
  "personalMessage": "You're off to a great start! Focus on..."
}

Rules:
- overallScore: 0-100 based on profile completeness and quality
- Include 1-3 strengths (things they're doing right)
- Include 2-5 improvements ordered by priority
- Categories: bio, interests, posts, avatar, activity
- Be specific and encouraging, never harsh
- Reference real data from above`
            }
        ]);

        const text = result.response.text().trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                overallScore: Math.min(100, Math.max(0, parsed.overallScore ?? 50)),
                strengths: parsed.strengths ?? [],
                improvements: parsed.improvements ?? [],
                personalMessage: parsed.personalMessage ?? "Keep building your creative profile!"
            };
        }

        return generateRuleBasedReview(profile);
    } catch (error) {
        console.error("[AI Coach] Profile review error:", error);
        return generateRuleBasedReview(profile);
    }
}

// ─── Rule-based fallback (works without API key) ─────────────────────────────
function generateRuleBasedReview(profile: ProfileData): ProfileReview {
    const improvements: ProfileTip[] = [];
    const strengths: string[] = [];
    let score = 20; // Base score for having an account

    // Bio check
    if (!profile.bio) {
        improvements.push({
            category: 'bio',
            priority: 'high',
            message: "Your bio is empty! Tell fellow creators who you are and what you create. Even 2-3 sentences makes a huge difference.",
            impact: "4x more profile views"
        });
    } else if (profile.bio.length < 50) {
        improvements.push({
            category: 'bio',
            priority: 'medium',
            message: `Your bio is only ${profile.bio.length} characters. Expand it to 50+ words to help the AI better understand your creative style and match you with compatible creators.`,
            impact: "3x better matching"
        });
        score += 10;
    } else {
        strengths.push("Your bio is detailed and helps the AI find great matches for you");
        score += 20;
    }

    // Avatar check
    if (!profile.avatarUrl) {
        improvements.push({
            category: 'avatar',
            priority: 'high',
            message: "Add a profile photo! Profiles with photos get 10x more engagement than blank profiles.",
            impact: "10x more engagement"
        });
    } else {
        strengths.push("You have a profile photo — great first impression!");
        score += 15;
    }

    // Interests check
    if (profile.interestCount === 0) {
        improvements.push({
            category: 'interests',
            priority: 'high',
            message: "You have no interests selected! Add at least 3 interests so the compatibility engine can find your creative soulmates.",
            impact: "Unlocks the matchmaking feed"
        });
    } else if (profile.interestCount < 3) {
        improvements.push({
            category: 'interests',
            priority: 'medium',
            message: `You only have ${profile.interestCount} interest${profile.interestCount > 1 ? 's' : ''}. Creators with 4+ interests appear in 2x more feeds.`,
            impact: "2x more visibility"
        });
        score += 10;
    } else {
        strengths.push(`${profile.interestCount} interests selected — excellent range!`);
        score += 20;
    }

    // Posts check
    if (profile.postCount === 0) {
        improvements.push({
            category: 'posts',
            priority: 'medium',
            message: "You haven't posted any creative work yet. Share your first piece — it's the best way to attract like-minded creators.",
            impact: "5x match quality"
        });
    } else {
        strengths.push(`${profile.postCount} creative posts shared — your portfolio is growing!`);
        score += 15;
    }

    // Verification
    if (!profile.isVerified) {
        improvements.push({
            category: 'avatar',
            priority: 'low',
            message: "Get verified with a quick selfie to earn a ✅ badge. Verified profiles get priority placement in the discovery feed.",
            impact: "Priority feed placement"
        });
    } else {
        strengths.push("Verified profile ✅ — you stand out in the feed!");
        score += 10;
    }

    score = Math.min(100, score);

    const personalMessage = score >= 80
        ? "Your profile is looking stellar! You're set up for great creative connections."
        : score >= 50
        ? "You're making progress! A few tweaks and you'll be in the top tier of creative profiles."
        : "Let's level up your profile! Focus on the high-priority suggestions above — each one will dramatically improve your experience.";

    return { overallScore: score, strengths, improvements, personalMessage };
}
