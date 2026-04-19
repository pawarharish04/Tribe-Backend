/**
 * Personalize Service — Local Event Tracker (FREE)
 * 
 * Tracks user interactions locally for recommendation insights.
 * When AWS Personalize is configured (optional), events are forwarded.
 * Otherwise, events are logged locally for analytics.
 */

// In-memory interaction log for local analytics
const interactionLog: { userId: string; targetId: string; eventType: string; timestamp: Date }[] = [];
const MAX_LOG_SIZE = 10000;

export async function trackUserInteraction(
    userId: string,
    targetId: string,
    eventType: 'IMPRESSION' | 'LIKE' | 'PASS' | 'SUPERLIKE'
) {
    // Store locally for feed optimization
    interactionLog.push({
        userId,
        targetId,
        eventType,
        timestamp: new Date()
    });

    // Cap memory usage
    if (interactionLog.length > MAX_LOG_SIZE) {
        interactionLog.splice(0, interactionLog.length - MAX_LOG_SIZE);
    }

    console.log(`[Personalize] ${eventType}: User ${userId.slice(0, 8)}… → ${targetId.slice(0, 8)}…`);
}

/**
 * Get interaction history for a user (useful for feed de-duplication and ranking)
 */
export function getUserInteractionHistory(userId: string) {
    return interactionLog.filter(e => e.userId === userId);
}

/**
 * Get users who have liked a specific target (useful for "who liked you" feature)
 */
export function getLikersOf(targetId: string) {
    return interactionLog
        .filter(e => e.targetId === targetId && (e.eventType === 'LIKE' || e.eventType === 'SUPERLIKE'))
        .map(e => e.userId);
}
