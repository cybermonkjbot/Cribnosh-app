/**
 * Parses a time string (e.g., "15 mins", "1 hour", "45 minutes") into minutes.
 * @param timeStr The time string to parse
 * @returns Number of minutes
 */
export function parsePrepTime(timeStr: string): number {
    if (!timeStr) return 0;

    const text = timeStr.toLowerCase();

    // Handle hours
    if (text.includes('hour') || text.includes('hr')) {
        const match = text.match(/(\d+)/);
        if (match) {
            const val = parseInt(match[1], 10);
            return val * 60; // Convert hours to minutes
        }
    }

    // Handle minutes
    if (text.includes('min') || text.includes('m')) {
        const match = text.match(/(\d+)/);
        if (match) {
            return parseInt(match[1], 10);
        }
    }

    // Fallback: try parsing as a raw number assuming minutes
    const rawNum = parseInt(text, 10);
    return isNaN(rawNum) ? 0 : rawNum;
}
