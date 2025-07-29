import { getHiddenSectionsToShow as getHiddenSectionsFromUtil } from './hiddenSections';

// Section Ordering Utility for Home Screen
// Dynamically organizes content sections based on user behavior, time, and context

export interface SectionConfig {
  id: string;
  name: string;
  priority: number; // Base priority (1-10, higher = more important)
  timeWeight: number; // How much time affects this section (0-1)
  userWeight: number; // How much user behavior affects this section (0-1)
  contextWeight: number; // How much context affects this section (0-1)
  minPosition: number; // Minimum position (0 = top)
  maxPosition: number; // Maximum position (10 = bottom)
  isRequired: boolean; // Whether this section must always be shown
  isConditional: boolean; // Whether this section can be hidden
  dependencies?: string[]; // Sections this depends on
  conflicts?: string[]; // Sections this conflicts with
  isHidden?: boolean; // Whether this is a hidden section
  showConditions?: string[]; // Conditions that must be met to show this section
}

export interface UserBehavior {
  lastOrderTime?: Date;
  favoriteCuisines?: string[];
  dietaryPreferences?: string[];
  budgetPreference?: 'low' | 'medium' | 'high';
  orderFrequency?: 'low' | 'medium' | 'high';
  preferredMealTimes?: string[];
  recentSearches?: string[];
  viewedSections?: string[];
  clickedSections?: string[];
  
  // New fields for hidden sections
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
}

export interface TimeContext {
  hour: number;
  minute: number;
  isWeekend: boolean;
  isHoliday?: boolean;
  specialOccasion?: string;
  mealTime?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface OrderingContext {
  timeContext: TimeContext;
  userBehavior: UserBehavior;
  currentLocation?: {
    latitude: number;
    longitude: number;
    city?: string;
  };
  weather?: {
    condition: string;
    temperature: number;
  };
  appState?: 'active' | 'background' | 'inactive';
}

// Default section configurations
export const DEFAULT_SECTIONS: SectionConfig[] = [
  {
    id: 'search',
    name: 'Search Bar',
    priority: 10,
    timeWeight: 0.1,
    userWeight: 0.1,
    contextWeight: 0.1,
    minPosition: 0,
    maxPosition: 0,
    isRequired: true,
    isConditional: false,
  },
  {
    id: 'featured_kitchens',
    name: 'Featured Kitchens',
    priority: 9,
    timeWeight: 0.3,
    userWeight: 0.4,
    contextWeight: 0.2,
    minPosition: 1,
    maxPosition: 3,
    isRequired: true,
    isConditional: false,
  },
  {
    id: 'popular_meals',
    name: 'Popular Meals',
    priority: 8,
    timeWeight: 0.4,
    userWeight: 0.3,
    contextWeight: 0.3,
    minPosition: 2,
    maxPosition: 4,
    isRequired: true,
    isConditional: false,
  },
  {
    id: 'cuisine_categories',
    name: 'Cuisine Categories',
    priority: 7,
    timeWeight: 0.2,
    userWeight: 0.5,
    contextWeight: 0.2,
    minPosition: 3,
    maxPosition: 6,
    isRequired: true,
    isConditional: false,
  },
  {
    id: 'recent_orders',
    name: 'Recent Orders',
    priority: 6,
    timeWeight: 0.1,
    userWeight: 0.8,
    contextWeight: 0.1,
    minPosition: 4,
    maxPosition: 7,
    isRequired: false,
    isConditional: true,
  },
  {
    id: 'special_offers',
    name: 'Special Offers',
    priority: 5,
    timeWeight: 0.3,
    userWeight: 0.2,
    contextWeight: 0.6,
    minPosition: 5,
    maxPosition: 8,
    isRequired: false,
    isConditional: true,
  },
  {
    id: 'nearby_kitchens',
    name: 'Kitchens Near Me',
    priority: 4,
    timeWeight: 0.2,
    userWeight: 0.3,
    contextWeight: 0.7,
    minPosition: 6,
    maxPosition: 9,
    isRequired: false,
    isConditional: true,
  },
  {
    id: 'sustainability',
    name: 'Sustainability',
    priority: 3,
    timeWeight: 0.1,
    userWeight: 0.1,
    contextWeight: 0.2,
    minPosition: 7,
    maxPosition: 10,
    isRequired: false,
    isConditional: true,
  },
  {
    id: 'group_orders',
    name: 'Group Orders',
    priority: 2,
    timeWeight: 0.2,
    userWeight: 0.4,
    contextWeight: 0.3,
    minPosition: 8,
    maxPosition: 10,
    isRequired: false,
    isConditional: true,
  },
  {
    id: 'live_content',
    name: 'Live Content',
    priority: 1,
    timeWeight: 0.5,
    userWeight: 0.3,
    contextWeight: 0.4,
    minPosition: 9,
    maxPosition: 10,
    isRequired: false,
    isConditional: true,
  },
  
  // Hidden sections - initially hidden, shown based on conditions
  {
    id: 'usual_dinner',
    name: 'You Usually Have These for Dinner',
    priority: 6,
    timeWeight: 0.4,
    userWeight: 0.8,
    contextWeight: 0.2,
    minPosition: 3,
    maxPosition: 6,
    isRequired: false,
    isConditional: true,
    isHidden: true,
    showConditions: ['min_orders', 'dinner_time', 'usual_items'],
  },
  {
    id: 'made_your_day',
    name: 'Sections Like These Made Your Day',
    priority: 5,
    timeWeight: 0.3,
    userWeight: 0.7,
    contextWeight: 0.3,
    minPosition: 4,
    maxPosition: 7,
    isRequired: false,
    isConditional: true,
    isHidden: true,
    showConditions: ['favorite_sections', 'positive_feedback'],
  },
  {
    id: 'play_to_win',
    name: 'Play to Win - Free Lunch with Colleagues',
    priority: 4,
    timeWeight: 0.2,
    userWeight: 0.6,
    contextWeight: 0.5,
    minPosition: 5,
    maxPosition: 8,
    isRequired: false,
    isConditional: true,
    isHidden: true,
    showConditions: ['colleagues_available', 'lunch_time', 'game_ready'],
  }
];

// Time-based scoring functions
function getTimeScore(section: SectionConfig, timeContext: TimeContext): number {
  const { hour, isWeekend, mealTime } = timeContext;
  
  // Base time score
  let timeScore = 0;
  
  // Meal time bonuses
  if (mealTime) {
    const mealBonuses = {
      breakfast: ['search', 'featured_kitchens', 'popular_meals'],
      lunch: ['popular_meals', 'cuisine_categories', 'nearby_kitchens'],
      dinner: ['featured_kitchens', 'popular_meals', 'special_offers'],
      snack: ['popular_meals', 'nearby_kitchens', 'live_content']
    };
    
    if (mealBonuses[mealTime].includes(section.id)) {
      timeScore += 0.3;
    }
  }
  
  // Time of day bonuses
  if (hour >= 6 && hour < 10) {
    // Morning - prioritize featured and popular
    if (['featured_kitchens', 'popular_meals'].includes(section.id)) {
      timeScore += 0.2;
    }
  } else if (hour >= 11 && hour < 14) {
    // Lunch time - prioritize popular and nearby
    if (['popular_meals', 'nearby_kitchens', 'cuisine_categories'].includes(section.id)) {
      timeScore += 0.2;
    }
  } else if (hour >= 17 && hour < 20) {
    // Dinner time - prioritize featured and special offers
    if (['featured_kitchens', 'special_offers', 'popular_meals'].includes(section.id)) {
      timeScore += 0.2;
    }
  } else if (hour >= 20 || hour < 6) {
    // Late night - prioritize nearby and live content
    if (['nearby_kitchens', 'live_content', 'popular_meals'].includes(section.id)) {
      timeScore += 0.2;
    }
  }
  
  // Weekend bonuses
  if (isWeekend) {
    if (['group_orders', 'live_content', 'special_offers'].includes(section.id)) {
      timeScore += 0.1;
    }
  }
  
  return Math.min(timeScore, 1);
}

// User behavior scoring functions
function getUserScore(section: SectionConfig, userBehavior: UserBehavior): number {
  let userScore = 0;
  
  // Recent orders influence
  if (section.id === 'recent_orders' && userBehavior.lastOrderTime) {
    const hoursSinceLastOrder = (Date.now() - userBehavior.lastOrderTime.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastOrder < 24) {
      userScore += 0.4;
    } else if (hoursSinceLastOrder < 72) {
      userScore += 0.2;
    }
  }
  
  // Favorite cuisines influence
  if (section.id === 'cuisine_categories' && userBehavior.favoriteCuisines?.length) {
    userScore += 0.3;
  }
  
  // Dietary preferences influence
  if (section.id === 'cuisine_categories' && userBehavior.dietaryPreferences?.length) {
    userScore += 0.2;
  }
  
  // Budget preference influence
  if (section.id === 'special_offers' && userBehavior.budgetPreference === 'low') {
    userScore += 0.3;
  }
  
  // Order frequency influence
  if (userBehavior.orderFrequency === 'high') {
    if (['recent_orders', 'popular_meals'].includes(section.id)) {
      userScore += 0.2;
    }
  } else if (userBehavior.orderFrequency === 'low') {
    if (['featured_kitchens', 'special_offers'].includes(section.id)) {
      userScore += 0.2;
    }
  }
  
  // Recent searches influence
  if (section.id === 'cuisine_categories' && userBehavior.recentSearches?.length) {
    userScore += 0.1;
  }
  
  // Viewed sections influence (reduce priority for frequently viewed)
  if (userBehavior.viewedSections?.includes(section.id)) {
    userScore -= 0.1;
  }
  
  // Clicked sections influence (increase priority for clicked)
  if (userBehavior.clickedSections?.includes(section.id)) {
    userScore += 0.2;
  }
  
  return Math.max(-0.5, Math.min(userScore, 1));
}

// Context-based scoring functions
function getContextScore(section: SectionConfig, context: OrderingContext): number {
  let contextScore = 0;
  
  // Location influence
  if (context.currentLocation) {
    if (section.id === 'nearby_kitchens') {
      contextScore += 0.4;
    }
  }
  
  // Weather influence
  if (context.weather) {
    const { condition, temperature } = context.weather;
    
    if (condition.includes('rain') || condition.includes('snow')) {
      if (['nearby_kitchens', 'popular_meals'].includes(section.id)) {
        contextScore += 0.2;
      }
    }
    
    if (temperature > 25) {
      if (['popular_meals', 'cuisine_categories'].includes(section.id)) {
        contextScore += 0.1;
      }
    }
  }
  
  // Special occasions influence
  if (context.timeContext.specialOccasion) {
    if (section.id === 'special_offers') {
      contextScore += 0.3;
    }
    if (section.id === 'group_orders') {
      contextScore += 0.2;
    }
  }
  
  // App state influence
  if (context.appState === 'active') {
    if (['live_content', 'popular_meals'].includes(section.id)) {
      contextScore += 0.1;
    }
  }
  
  return Math.min(contextScore, 1);
}

// Calculate meal time based on hour
function getMealTime(hour: number): 'breakfast' | 'lunch' | 'dinner' | 'snack' | undefined {
  if (hour >= 6 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 16) return 'lunch';
  if (hour >= 16 && hour < 21) return 'dinner';
  if (hour >= 21 || hour < 6) return 'snack';
  return undefined;
}

// Get current time context
export function getCurrentTimeContext(): TimeContext {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;
  
  return {
    hour,
    minute,
    isWeekend,
    isHoliday: false, // You can add holiday detection logic here
    specialOccasion: undefined, // You can add special occasion detection here
    mealTime: getMealTime(hour)
  };
}

// Calculate section scores
function calculateSectionScores(sections: SectionConfig[], context: OrderingContext): Array<SectionConfig & { score: number }> {
  return sections.map(section => {
    const timeScore = getTimeScore(section, context.timeContext);
    const userScore = getUserScore(section, context.userBehavior);
    const contextScore = getContextScore(section, context);
    
    // Weighted score calculation
    const weightedScore = 
      section.priority * 0.4 + // Base priority
      timeScore * section.timeWeight * 0.3 + // Time influence
      userScore * section.userWeight * 0.2 + // User behavior influence
      contextScore * section.contextWeight * 0.1; // Context influence
    
    return {
      ...section,
      score: weightedScore
    };
  });
}

// Sort sections by score and apply constraints
function sortSections(sectionsWithScores: Array<SectionConfig & { score: number }>): SectionConfig[] {
  // Sort by score (highest first)
  const sorted = sectionsWithScores.sort((a, b) => b.score - a.score);
  
  // Apply position constraints
  const result: SectionConfig[] = [];
  const usedPositions = new Set<number>();
  
  // Handle required sections first
  const requiredSections = sorted.filter(s => s.isRequired);
  const optionalSections = sorted.filter(s => !s.isRequired);
  
  // Place required sections
  for (const section of requiredSections) {
    let position = section.minPosition;
    
    // Find the best available position within constraints
    while (usedPositions.has(position) && position <= section.maxPosition) {
      position++;
    }
    
    if (position <= section.maxPosition) {
      usedPositions.add(position);
      result[position] = section;
    }
  }
  
  // Place optional sections
  for (const section of optionalSections) {
    let position = section.minPosition;
    
    // Find the best available position within constraints
    while (usedPositions.has(position) && position <= section.maxPosition) {
      position++;
    }
    
    if (position <= section.maxPosition) {
      usedPositions.add(position);
      result[position] = section;
    }
  }
  
  // Remove empty slots and return
  return result.filter(Boolean);
}

// Main function to get ordered sections
export function getOrderedSections(
  context: OrderingContext,
  customSections?: SectionConfig[]
): SectionConfig[] {
  const sections = customSections || DEFAULT_SECTIONS;
  const sectionsWithScores = calculateSectionScores(sections, context);
  return sortSections(sectionsWithScores);
}

// Get sections with scores for debugging
export function getSectionsWithScores(
  context: OrderingContext,
  customSections?: SectionConfig[]
): Array<SectionConfig & { score: number }> {
  const sections = customSections || DEFAULT_SECTIONS;
  return calculateSectionScores(sections, context);
}

// Get sections for specific meal time
export function getMealTimeSections(mealTime: 'breakfast' | 'lunch' | 'dinner' | 'snack'): SectionConfig[] {
  const timeContext: TimeContext = {
    hour: mealTime === 'breakfast' ? 8 : mealTime === 'lunch' ? 12 : mealTime === 'dinner' ? 18 : 22,
    minute: 0,
    isWeekend: false,
    mealTime
  };
  
  const context: OrderingContext = {
    timeContext,
    userBehavior: {},
  };
  
  return getOrderedSections(context);
}

// Get sections for specific user type
export function getUserTypeSections(userType: 'new' | 'regular' | 'power'): SectionConfig[] {
  const userBehavior: UserBehavior = {
    orderFrequency: userType === 'new' ? 'low' : userType === 'regular' ? 'medium' : 'high',
    budgetPreference: userType === 'new' ? 'medium' : userType === 'regular' ? 'medium' : 'high',
  };
  
  const context: OrderingContext = {
    timeContext: getCurrentTimeContext(),
    userBehavior,
  };
  
  return getOrderedSections(context);
}

// Get sections for specific time of day
export function getTimeOfDaySections(timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'): SectionConfig[] {
  const hourMap = {
    morning: 8,
    afternoon: 14,
    evening: 18,
    night: 22
  };
  
  const timeContext: TimeContext = {
    hour: hourMap[timeOfDay],
    minute: 0,
    isWeekend: false,
    mealTime: getMealTime(hourMap[timeOfDay])
  };
  
  const context: OrderingContext = {
    timeContext,
    userBehavior: {},
  };
  
  return getOrderedSections(context);
}

// Utility function to check if section should be visible
export function shouldShowSection(section: SectionConfig, context: OrderingContext): boolean {
  if (section.isRequired) return true;
  if (!section.isConditional) return true;
  
  // Add custom visibility logic here
  const sectionsWithScores = calculateSectionScores([section], context);
  const sectionWithScore = sectionsWithScores[0];
  
  // Hide sections with very low scores
  return sectionWithScore.score > 0.5;
}

// Utility function to get section priority level
export function getSectionPriorityLevel(section: SectionConfig, context: OrderingContext): 'high' | 'medium' | 'low' {
  const sectionsWithScores = calculateSectionScores([section], context);
  const sectionWithScore = sectionsWithScores[0];
  
  if (sectionWithScore.score >= 8) return 'high';
  if (sectionWithScore.score >= 5) return 'medium';
  return 'low';
}

// Get hidden sections that should be shown
export function getHiddenSectionsToShow(context: OrderingContext): SectionConfig[] {
  const hiddenSectionsToShow = getHiddenSectionsFromUtil(context.timeContext, context.userBehavior);
  
  return hiddenSectionsToShow.map(hiddenSection => ({
    id: hiddenSection.id,
    name: hiddenSection.name,
    priority: hiddenSection.priority,
    timeWeight: 0.3,
    userWeight: 0.6,
    contextWeight: 0.2,
    minPosition: hiddenSection.minPosition,
    maxPosition: hiddenSection.maxPosition,
    isRequired: false,
    isConditional: true,
    isHidden: true,
    showConditions: hiddenSection.showConditions,
  }));
}

// Get all sections including hidden ones that should be shown
export function getAllSectionsWithHidden(context: OrderingContext): SectionConfig[] {
  const regularSections = DEFAULT_SECTIONS.filter(section => !section.isHidden);
  const hiddenSectionsToShow = getHiddenSectionsToShow(context);
  
  return [...regularSections, ...hiddenSectionsToShow];
}

// Get sections with hidden sections included in ordering
export function getOrderedSectionsWithHidden(context: OrderingContext): SectionConfig[] {
  const allSections = getAllSectionsWithHidden(context);
  return getOrderedSections(context, allSections);
} 