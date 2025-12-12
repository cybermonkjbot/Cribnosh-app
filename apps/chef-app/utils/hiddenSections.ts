// Hidden Sections Utility
// Manages the display logic for initially hidden sections

export interface HiddenSectionConfig {
    id: string;
    name: string;
    description: string;
    showConditions: string[];
    priority: number;
    minPosition: number;
    maxPosition: number;
}

export interface UserBehavior {
    totalOrders?: number;
    daysActive?: number;
    usualDinnerItems?: string[];
    favoriteSections?: string[];
    playToWinHistory?: {
        gamesPlayed: number;
        gamesWon: number;
        lastPlayed?: Date;
    };
    colleagueConnections?: number;
    freeFoodPreferences?: string[];
    clickedSections?: string[];
}

export interface TimeContext {
    hour: number;
    minute: number;
    isWeekend: boolean;
    mealTime?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

// Configuration for hidden sections
export const HIDDEN_SECTIONS_CONFIG = {
    ENABLED: true,
    USUAL_DINNER_ENABLED: true,
    MADE_YOUR_DAY_ENABLED: true,
    PLAY_TO_WIN_ENABLED: true,
    SHOW_FREQUENCY: 0.3, // 30% chance to show
    MIN_ORDER_COUNT: 3,
    MIN_DAYS_ACTIVE: 7,
};

// Play to win configuration
export const PLAY_TO_WIN_CONFIG = {
    ENABLED: true,
    FREE_AMOUNT: 0, // All items are free (£0)
    MAX_PARTICIPANTS: 10,
    GAME_DURATION: 24 * 60 * 60 * 1000, // 24 hours
    MIN_COLLEAGUES: 2,
};

// Hidden sections definitions
export const HIDDEN_SECTIONS: HiddenSectionConfig[] = [
    {
        id: 'usual_dinner',
        name: 'Your Dinner Favourites',
        description: 'Personalized dinner recommendations based on your order history',
        showConditions: ['min_orders', 'dinner_time', 'usual_items'],
        priority: 6,
        minPosition: 5,
        maxPosition: 8,
    },
    {
        id: 'play_to_win',
        name: 'Play to Win - Free Lunch with Colleagues',
        description: 'Free lunch games with colleagues - all items are £0',
        showConditions: ['colleagues_available', 'lunch_time', 'game_ready'],
        priority: 4,
        minPosition: 5,
        maxPosition: 8,
    }
];

// Check if "Your Dinner Favourites" section should be shown
export function shouldShowUsualDinnerSection(timeContext: TimeContext, userBehavior: UserBehavior): boolean {
    if (!HIDDEN_SECTIONS_CONFIG.USUAL_DINNER_ENABLED) return false;

    // Check minimum orders
    if ((userBehavior.totalOrders || 0) < HIDDEN_SECTIONS_CONFIG.MIN_ORDER_COUNT) return false;

    // Check if it's dinner time
    if (timeContext.mealTime !== 'dinner') return false;

    // Check if user has usual dinner items
    if (!userBehavior.usualDinnerItems || userBehavior.usualDinnerItems.length === 0) return false;

    // Check minimum days active
    if ((userBehavior.daysActive || 0) < HIDDEN_SECTIONS_CONFIG.MIN_DAYS_ACTIVE) return false;

    // Random chance based on show frequency
    return Math.random() < HIDDEN_SECTIONS_CONFIG.SHOW_FREQUENCY;
}

// Check if "Play to Win" section should be shown
export function shouldShowPlayToWinSection(timeContext: TimeContext, userBehavior: UserBehavior): boolean {
    if (!HIDDEN_SECTIONS_CONFIG.PLAY_TO_WIN_ENABLED || !PLAY_TO_WIN_CONFIG.ENABLED) return false;

    // Check if it's lunch time
    if (timeContext.mealTime !== 'lunch') return false;

    // Check if user has colleagues available
    if ((userBehavior.colleagueConnections || 0) < PLAY_TO_WIN_CONFIG.MIN_COLLEAGUES) return false;

    // Check minimum days active
    if ((userBehavior.daysActive || 0) < HIDDEN_SECTIONS_CONFIG.MIN_DAYS_ACTIVE) return false;

    // Check if user hasn't played recently (within 24 hours)
    if (userBehavior.playToWinHistory?.lastPlayed) {
        const hoursSinceLastPlay = (Date.now() - userBehavior.playToWinHistory.lastPlayed.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastPlay < 24) return false;
    }

    // Random chance based on show frequency
    return Math.random() < HIDDEN_SECTIONS_CONFIG.SHOW_FREQUENCY;
}

// Get all hidden sections that should be shown
export function getHiddenSectionsToShow(timeContext: TimeContext, userBehavior: UserBehavior): HiddenSectionConfig[] {
    if (!HIDDEN_SECTIONS_CONFIG.ENABLED) return [];

    const sectionsToShow: HiddenSectionConfig[] = [];

    // Check each hidden section
    if (shouldShowUsualDinnerSection(timeContext, userBehavior)) {
        sectionsToShow.push(HIDDEN_SECTIONS.find(s => s.id === 'usual_dinner')!);
    }

    if (shouldShowPlayToWinSection(timeContext, userBehavior)) {
        sectionsToShow.push(HIDDEN_SECTIONS.find(s => s.id === 'play_to_win')!);
    }

    return sectionsToShow;
}

// Get section data for "Your Dinner Favourites"
export function getUsualDinnerData(userBehavior: UserBehavior) {
    return {
        title: "Your Dinner Favourites",
        subtitle: "Based on your order history",
        items: userBehavior.usualDinnerItems || [],
        totalOrders: userBehavior.totalOrders || 0,
        lastOrderTime: userBehavior.playToWinHistory?.lastPlayed,
    };
}

// Get section data for "Play to Win"
export function getPlayToWinData(userBehavior: UserBehavior) {
    return {
        title: "Play to Win - Free Lunch with Colleagues",
        subtitle: "All items are £0 - Free lunch with friends!",
        freeAmount: PLAY_TO_WIN_CONFIG.FREE_AMOUNT,
        maxParticipants: PLAY_TO_WIN_CONFIG.MAX_PARTICIPANTS,
        minColleagues: PLAY_TO_WIN_CONFIG.MIN_COLLEAGUES,
        gameDuration: PLAY_TO_WIN_CONFIG.GAME_DURATION,
        colleagueConnections: userBehavior.colleagueConnections || 0,
        playHistory: userBehavior.playToWinHistory,
        freeFoodPreferences: userBehavior.freeFoodPreferences || [],
    };
}

// Check if user is eligible for play to win games
export function isEligibleForPlayToWin(userBehavior: UserBehavior): boolean {
    return (userBehavior.colleagueConnections || 0) >= PLAY_TO_WIN_CONFIG.MIN_COLLEAGUES &&
        (userBehavior.daysActive || 0) >= HIDDEN_SECTIONS_CONFIG.MIN_DAYS_ACTIVE;
}

// Get play to win game status
export function getPlayToWinGameStatus(userBehavior: UserBehavior) {
    const isEligible = isEligibleForPlayToWin(userBehavior);
    const canPlayNow = !userBehavior.playToWinHistory?.lastPlayed ||
        (Date.now() - userBehavior.playToWinHistory.lastPlayed.getTime()) >= PLAY_TO_WIN_CONFIG.GAME_DURATION;

    return {
        isEligible,
        canPlayNow,
        gamesPlayed: userBehavior.playToWinHistory?.gamesPlayed || 0,
        gamesWon: userBehavior.playToWinHistory?.gamesWon || 0,
        colleagueCount: userBehavior.colleagueConnections || 0,
    };
}
