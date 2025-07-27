/**
 * Dynamic Header Messages Utility
 * 
 * This utility generates contextual header messages based on:
 * - Time of day (morning, afternoon, evening, night)
 * - Meal times (breakfast, brunch, lunch, dinner, late night)
 * - Special occasions and events
 * - User preferences and context
 */

export interface HeaderMessage {
  greeting: string;
  mainMessage: string;
  subMessage?: string;
}

export interface TimeContext {
  hour: number;
  minute: number;
  isWeekend: boolean;
  isHoliday?: boolean;
  specialOccasion?: string;
}

/**
 * Get the current time context
 */
export function getCurrentTimeContext(): TimeContext {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const dayOfWeek = now.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
  
  return {
    hour,
    minute,
    isWeekend,
  };
}

/**
 * Determine the time period of day
 */
export function getTimePeriod(hour: number): 'early-morning' | 'morning' | 'afternoon' | 'evening' | 'night' | 'late-night' {
  if (hour >= 5 && hour < 8) return 'early-morning';
  if (hour >= 8 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  if (hour >= 21 && hour < 23) return 'night';
  return 'late-night';
}

/**
 * Determine the current meal time
 */
export function getMealTime(hour: number, isWeekend: boolean): 'breakfast' | 'brunch' | 'lunch' | 'dinner' | 'late-night' | 'snack' {
  if (isWeekend) {
    // Weekend meal times are more relaxed
    if (hour >= 6 && hour < 10) return 'breakfast';
    if (hour >= 10 && hour < 14) return 'brunch';
    if (hour >= 14 && hour < 17) return 'lunch';
    if (hour >= 17 && hour < 22) return 'dinner';
    if (hour >= 22 || hour < 2) return 'late-night';
    return 'snack';
  } else {
    // Weekday meal times
    if (hour >= 6 && hour < 9) return 'breakfast';
    if (hour >= 9 && hour < 11) return 'brunch';
    if (hour >= 11 && hour < 15) return 'lunch';
    if (hour >= 15 && hour < 21) return 'dinner';
    if (hour >= 21 || hour < 2) return 'late-night';
    return 'snack';
  }
}

/**
 * Get meal-specific messages
 */
function getMealMessages(mealTime: string, userName: string): HeaderMessage {
  const messages: Record<string, HeaderMessage> = {
    breakfast: {
      greeting: `Good morning, ${userName}`,
      mainMessage: "What's for\nbreakfast?",
      subMessage: "Start your day right with a delicious meal"
    },
    brunch: {
      greeting: `Good morning, ${userName}`,
      mainMessage: "Brunch time!\nWhat's cooking?",
      subMessage: "The perfect blend of breakfast and lunch"
    },
    lunch: {
      greeting: `Good afternoon, ${userName}`,
      mainMessage: "Lunch break\ncalling!",
      subMessage: "Time to fuel up for the rest of your day"
    },
    dinner: {
      greeting: `Good evening, ${userName}`,
      mainMessage: "Dinner time!\nWhat's on the menu?",
      subMessage: "End your day with something special"
    },
    'late-night': {
      greeting: `Hey ${userName}`,
      mainMessage: "Late night\ncravings?",
      subMessage: "We've got you covered, even at this hour"
    },
    snack: {
      greeting: `Hi ${userName}`,
      mainMessage: "Snack time!\nWhat's your mood?",
      subMessage: "Perfect timing for a little treat"
    }
  };
  
  return messages[mealTime] || messages.snack;
}

/**
 * Get time period specific messages
 */
function getTimePeriodMessages(timePeriod: string, userName: string): HeaderMessage {
  const messages: Record<string, HeaderMessage> = {
    'early-morning': {
      greeting: `Early bird, ${userName}`,
      mainMessage: "Rise and\nshine!",
      subMessage: "Fresh meals to start your day"
    },
    morning: {
      greeting: `Good morning, ${userName}`,
      mainMessage: "Fresh start,\nfresh food!",
      subMessage: "What will fuel your day?"
    },
    afternoon: {
      greeting: `Good afternoon, ${userName}`,
      mainMessage: "Afternoon\nenergy boost!",
      subMessage: "Keep the momentum going"
    },
    evening: {
      greeting: `Good evening, ${userName}`,
      mainMessage: "Evening\nvibes!",
      subMessage: "Time to unwind with great food"
    },
    night: {
      greeting: `Good night, ${userName}`,
      mainMessage: "Night owl\nspecial!",
      subMessage: "Late night delights await"
    },
    'late-night': {
      greeting: `Hey ${userName}`,
      mainMessage: "Late night\nadventures!",
      subMessage: "We're here when you need us"
    }
  };
  
  return messages[timePeriod] || messages.afternoon;
}

/**
 * Get weekend specific messages
 */
function getWeekendMessages(userName: string): HeaderMessage {
  const messages = [
    {
      greeting: `Happy weekend, ${userName}`,
      mainMessage: "Weekend\nvibes!",
      subMessage: "Time to treat yourself"
    },
    {
      greeting: `Weekend mode, ${userName}`,
      mainMessage: "Relax and\nenjoy!",
      subMessage: "No rush, just great food"
    },
    {
      greeting: `Weekend warrior, ${userName}`,
      mainMessage: "Weekend\nfeast!",
      subMessage: "Make it special"
    }
  ];
  
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Get special occasion messages
 */
function getSpecialOccasionMessages(occasion: string, userName: string): HeaderMessage {
  const messages: Record<string, HeaderMessage> = {
    'new-year': {
      greeting: `Happy New Year, ${userName}`,
      mainMessage: "New year,\nnew flavors!",
      subMessage: "Start 2024 with amazing food"
    },
    'valentines': {
      greeting: `Happy Valentine's, ${userName}`,
      mainMessage: "Love is in\nthe air!",
      subMessage: "Romantic meals for two"
    },
    'christmas': {
      greeting: `Merry Christmas, ${userName}`,
      mainMessage: "Christmas\ncheer!",
      subMessage: "Festive feasts await"
    },
    'birthday': {
      greeting: `Happy Birthday, ${userName}`,
      mainMessage: "Birthday\ncelebration!",
      subMessage: "Let's make it special"
    }
  };
  
  return messages[occasion] || {
    greeting: `Hi ${userName}`,
    mainMessage: "Special\nday!",
    subMessage: "Time to celebrate with great food"
  };
}

/**
 * Main function to get dynamic header message
 */
export function getDynamicHeaderMessage(
  userName: string = "there",
  context?: Partial<TimeContext>,
  showSubtitle: boolean = false
): HeaderMessage {
  const timeContext = context || getCurrentTimeContext();
  const { hour, isWeekend } = timeContext;
  
  // Ensure hour is defined, fallback to current time if not
  const currentHour = hour ?? new Date().getHours();
  
  // Check for special occasions first
  if (timeContext.specialOccasion) {
    const message = getSpecialOccasionMessages(timeContext.specialOccasion, userName);
    return {
      ...message,
      subMessage: showSubtitle ? message.subMessage : undefined
    };
  }
  
  // Get meal time and time period
  const mealTime = getMealTime(currentHour, isWeekend ?? false);
  const timePeriod = getTimePeriod(currentHour);
  
  // Weekend messages take priority for certain times
  if (isWeekend && (currentHour >= 10 && currentHour < 16)) {
    const message = getWeekendMessages(userName);
    return {
      ...message,
      subMessage: showSubtitle ? message.subMessage : undefined
    };
  }
  
  // Meal-specific messages for appropriate times
  if (mealTime !== 'snack') {
    const message = getMealMessages(mealTime, userName);
    return {
      ...message,
      subMessage: showSubtitle ? message.subMessage : undefined
    };
  }
  
  // Fall back to time period messages
  const message = getTimePeriodMessages(timePeriod, userName);
  return {
    ...message,
    subMessage: showSubtitle ? message.subMessage : undefined
  };
}

/**
 * Get a random motivational food message
 */
export function getRandomFoodMessage(): string {
  const messages = [
    "What will you eat?",
    "Nosh is ready!",
    "Time to feast!",
    "Hungry? We've got you!",
    "Delicious awaits!",
    "Food adventure time!",
    "Taste the difference!",
    "Fresh flavors calling!",
    "Culinary journey starts here!",
    "Good food, good mood!",
    "Ready to nosh?",
    "Flavor town awaits!",
    "Eat well, live well!",
    "Your taste buds will thank you!",
    "Foodie paradise!",
    "Delicious discoveries!",
    "Fresh and tasty!",
    "Cooking up happiness!",
    "Flavor explosion!",
    "Taste bud heaven!"
  ];
  
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Get a contextual welcome message
 */
export function getContextualWelcomeMessage(userName: string = "there"): string {
  const timeContext = getCurrentTimeContext();
  const { hour, isWeekend } = timeContext;
  
  if (isWeekend) {
    return `Welcome back, ${userName}!`;
  }
  
  const timePeriod = getTimePeriod(hour);
  
  switch (timePeriod) {
    case 'early-morning':
      return `Welcome back, ${userName}!`;
    case 'morning':
      return `Welcome back, ${userName}!`;
    case 'afternoon':
      return `Welcome back, ${userName}!`;
    case 'evening':
      return `Welcome back, ${userName}!`;
    case 'night':
      return `Welcome back, ${userName}!`;
    case 'late-night':
      return `Welcome back, ${userName}!`;
    default:
      return `Welcome back, ${userName}!`;
  }
}

/**
 * Get a complete dynamic header with all components
 */
export function getCompleteDynamicHeader(
  userName: string = "there", 
  showSubtitle: boolean = false
): HeaderMessage {
  const timeContext = getCurrentTimeContext();
  const dynamicMessage = getDynamicHeaderMessage(userName, timeContext);
  
  // Sometimes use a random food message instead of the main message
  if (Math.random() < 0.3) { // 30% chance
    return {
      ...dynamicMessage,
      mainMessage: getRandomFoodMessage(),
      subMessage: showSubtitle ? dynamicMessage.subMessage : undefined
    };
  }
  
  return {
    ...dynamicMessage,
    subMessage: showSubtitle ? dynamicMessage.subMessage : undefined
  };
} 