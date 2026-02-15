// Dynamic Search Prompts Utility
// Generates contextual search placeholders based on time, meal times, and user preferences

export interface SearchPromptContext {
  hour: number;
  minute: number;
  isWeekend: boolean;
  isHoliday?: boolean;
  specialOccasion?: string;
  userPreferences?: {
    cuisine?: string[];
    dietary?: string[];
    budget?: 'low' | 'medium' | 'high';
    mood?: 'hungry' | 'craving' | 'healthy' | 'indulgent' | 'quick';
  };
}

export interface SearchPrompt {
  placeholder: string;
  category?: string;
  urgency?: 'low' | 'medium' | 'high';
  mood?: string;
}

// Time-based search prompts
function getTimeBasedPrompts(context: SearchPromptContext): SearchPrompt[] {
  const { hour, isWeekend } = context;
  
  if (hour >= 5 && hour < 8) {
    // Early morning (5-8 AM)
    return [
      { placeholder: "I want to eat breakfast", category: "breakfast", urgency: "medium", mood: "fresh" },
      { placeholder: "Show me morning meals", category: "breakfast", urgency: "low", mood: "energetic" },
      { placeholder: "What's good for breakfast?", category: "breakfast", urgency: "medium", mood: "curious" },
      { placeholder: "I need coffee and food", category: "breakfast", urgency: "high", mood: "urgent" },
      { placeholder: "Breakfast ideas please", category: "breakfast", urgency: "low", mood: "casual" }
    ];
  } else if (hour >= 8 && hour < 12) {
    // Morning (8-12 PM)
    return [
      { placeholder: "I want to eat something filling", category: "lunch", urgency: "medium", mood: "hungry" },
      { placeholder: "Show me lunch options", category: "lunch", urgency: "medium", mood: "focused" },
      { placeholder: "What's for lunch today?", category: "lunch", urgency: "medium", mood: "curious" },
      { placeholder: "I'm hungry, feed me", category: "lunch", urgency: "high", mood: "urgent" },
      { placeholder: "Lunch break calling", category: "lunch", urgency: "medium", mood: "casual" }
    ];
  } else if (hour >= 12 && hour < 17) {
    // Afternoon (12-5 PM)
    return [
      { placeholder: "I want to eat something quick", category: "snack", urgency: "medium", mood: "quick" },
      { placeholder: "Afternoon pick-me-up", category: "snack", urgency: "low", mood: "casual" },
      { placeholder: "Show me light meals", category: "lunch", urgency: "low", mood: "healthy" },
      { placeholder: "I need energy food", category: "snack", urgency: "medium", mood: "energetic" },
      { placeholder: "What's good for afternoon?", category: "snack", urgency: "low", mood: "curious" }
    ];
  } else if (hour >= 17 && hour < 21) {
    // Evening (5-9 PM)
    return [
      { placeholder: "I want to eat dinner", category: "dinner", urgency: "medium", mood: "hungry" },
      { placeholder: "What's for dinner tonight?", category: "dinner", urgency: "medium", mood: "curious" },
      { placeholder: "Show me dinner options", category: "dinner", urgency: "medium", mood: "focused" },
      { placeholder: "I'm starving, feed me", category: "dinner", urgency: "high", mood: "urgent" },
      { placeholder: "Dinner time, what's cooking?", category: "dinner", urgency: "medium", mood: "casual" }
    ];
  } else if (hour >= 21 && hour < 23) {
    // Night (9-11 PM)
    return [
      { placeholder: "I want to eat something light", category: "snack", urgency: "low", mood: "casual" },
      { placeholder: "Late night snack ideas", category: "snack", urgency: "low", mood: "relaxed" },
      { placeholder: "Show me night food", category: "snack", urgency: "low", mood: "curious" },
      { placeholder: "I need comfort food", category: "snack", urgency: "medium", mood: "comfort" },
      { placeholder: "What's good for late night?", category: "snack", urgency: "low", mood: "casual" }
    ];
  } else {
    // Late night (11 PM-5 AM)
    return [
      { placeholder: "I want to eat something quick", category: "snack", urgency: "medium", mood: "urgent" },
      { placeholder: "Late night cravings", category: "snack", urgency: "medium", mood: "craving" },
      { placeholder: "Show me 24/7 food", category: "snack", urgency: "medium", mood: "urgent" },
      { placeholder: "I need food now", category: "snack", urgency: "high", mood: "urgent" },
      { placeholder: "What's open late?", category: "snack", urgency: "medium", mood: "curious" }
    ];
  }
}

// Weekend-specific prompts
function getWeekendPrompts(context: SearchPromptContext): SearchPrompt[] {
  const { hour } = context;
  
  if (hour >= 10 && hour < 14) {
    // Weekend brunch time
    return [
      { placeholder: "I want to eat brunch", category: "brunch", urgency: "low", mood: "relaxed" },
      { placeholder: "Show me brunch spots", category: "brunch", urgency: "low", mood: "casual" },
      { placeholder: "Weekend brunch ideas", category: "brunch", urgency: "low", mood: "curious" },
      { placeholder: "What's good for brunch?", category: "brunch", urgency: "low", mood: "casual" },
      { placeholder: "Brunch time, let's feast", category: "brunch", urgency: "medium", mood: "excited" }
    ];
  } else if (hour >= 14 && hour < 18) {
    // Weekend afternoon
    return [
      { placeholder: "I want to eat something special", category: "lunch", urgency: "low", mood: "indulgent" },
      { placeholder: "Weekend treat ideas", category: "lunch", urgency: "low", mood: "casual" },
      { placeholder: "Show me weekend food", category: "lunch", urgency: "low", mood: "curious" },
      { placeholder: "What's good for weekend lunch?", category: "lunch", urgency: "low", mood: "casual" },
      { placeholder: "Weekend vibes, what to eat?", category: "lunch", urgency: "low", mood: "relaxed" }
    ];
  } else {
    // Weekend evening/night
    return [
      { placeholder: "I want to eat something nice", category: "dinner", urgency: "low", mood: "indulgent" },
      { placeholder: "Weekend dinner ideas", category: "dinner", urgency: "low", mood: "casual" },
      { placeholder: "Show me weekend dinner", category: "dinner", urgency: "low", mood: "curious" },
      { placeholder: "What's good for weekend dinner?", category: "dinner", urgency: "low", mood: "casual" },
      { placeholder: "Weekend feast time", category: "dinner", urgency: "medium", mood: "excited" }
    ];
  }
}

// Mood-based prompts
function getMoodBasedPrompts(context: SearchPromptContext): SearchPrompt[] {
  const { userPreferences } = context;
  const mood = userPreferences?.mood || 'hungry';
  
  const moodPrompts: Record<string, SearchPrompt[]> = {
    hungry: [
      { placeholder: "I'm hungry, feed me", category: "any", urgency: "high" as const, mood: "urgent" },
      { placeholder: "I want to eat something filling", category: "any", urgency: "high" as const, mood: "hungry" },
      { placeholder: "I need food now", category: "any", urgency: "high" as const, mood: "urgent" },
      { placeholder: "Show me big portions", category: "any", urgency: "high" as const, mood: "hungry" },
      { placeholder: "I'm starving", category: "any", urgency: "high" as const, mood: "urgent" }
    ],
    craving: [
      { placeholder: "I'm craving something specific", category: "any", urgency: "medium" as const, mood: "craving" },
      { placeholder: "I want to eat my favorite food", category: "any", urgency: "medium" as const, mood: "craving" },
      { placeholder: "Show me comfort food", category: "any", urgency: "medium" as const, mood: "comfort" },
      { placeholder: "I need something satisfying", category: "any", urgency: "medium" as const, mood: "craving" },
      { placeholder: "What am I craving today?", category: "any", urgency: "low" as const, mood: "curious" }
    ],
    healthy: [
      { placeholder: "I want to eat something healthy", category: "healthy", urgency: "low" as const, mood: "healthy" },
      { placeholder: "Show me nutritious options", category: "healthy", urgency: "low" as const, mood: "healthy" },
      { placeholder: "I need healthy food", category: "healthy", urgency: "medium" as const, mood: "healthy" },
      { placeholder: "What's good for my body?", category: "healthy", urgency: "low" as const, mood: "healthy" },
      { placeholder: "Show me clean eating", category: "healthy", urgency: "low" as const, mood: "healthy" }
    ],
    indulgent: [
      { placeholder: "I want to eat something indulgent", category: "any", urgency: "low" as const, mood: "indulgent" },
      { placeholder: "Show me treat food", category: "any", urgency: "low" as const, mood: "indulgent" },
      { placeholder: "I deserve something special", category: "any", urgency: "low" as const, mood: "indulgent" },
      { placeholder: "What's the best food here?", category: "any", urgency: "low" as const, mood: "indulgent" },
      { placeholder: "Show me luxury food", category: "any", urgency: "low" as const, mood: "indulgent" }
    ],
    quick: [
      { placeholder: "I want to eat something quick", category: "fast", urgency: "high" as const, mood: "quick" },
      { placeholder: "Show me fast food", category: "fast", urgency: "high" as const, mood: "quick" },
      { placeholder: "I need food in 30 minutes", category: "fast", urgency: "high" as const, mood: "urgent" },
      { placeholder: "What's the fastest delivery?", category: "fast", urgency: "high" as const, mood: "urgent" },
      { placeholder: "Quick meal ideas", category: "fast", urgency: "high" as const, mood: "quick" }
    ]
  };
  
  return moodPrompts[mood] || moodPrompts.hungry;
}

// Cuisine-specific prompts
function getCuisinePrompts(context: SearchPromptContext): SearchPrompt[] {
  const { userPreferences } = context;
  const cuisines = userPreferences?.cuisine || [];
  
  if (cuisines.length === 0) return [];
  
  const cuisinePrompts: Record<string, SearchPrompt[]> = {
    italian: [
      { placeholder: "I want to eat Italian food", category: "italian", urgency: "medium" as const, mood: "craving" },
      { placeholder: "Show me pizza and pasta", category: "italian", urgency: "medium" as const, mood: "craving" },
      { placeholder: "I'm craving Italian", category: "italian", urgency: "medium" as const, mood: "craving" }
    ],
    chinese: [
      { placeholder: "I want to eat Chinese food", category: "chinese", urgency: "medium" as const, mood: "craving" },
      { placeholder: "Show me Chinese takeout", category: "chinese", urgency: "medium" as const, mood: "craving" },
      { placeholder: "I'm craving Chinese", category: "chinese", urgency: "medium" as const, mood: "craving" }
    ],
    indian: [
      { placeholder: "I want to eat Indian food", category: "indian", urgency: "medium" as const, mood: "craving" },
      { placeholder: "Show me curry and naan", category: "indian", urgency: "medium" as const, mood: "craving" },
      { placeholder: "I'm craving Indian", category: "indian", urgency: "medium" as const, mood: "craving" }
    ],
    mexican: [
      { placeholder: "I want to eat Mexican food", category: "mexican", urgency: "medium" as const, mood: "craving" },
      { placeholder: "Show me tacos and burritos", category: "mexican", urgency: "medium" as const, mood: "craving" },
      { placeholder: "I'm craving Mexican", category: "mexican", urgency: "medium" as const, mood: "craving" }
    ],
    japanese: [
      { placeholder: "I want to eat Japanese food", category: "japanese", urgency: "medium" as const, mood: "craving" },
      { placeholder: "Show me sushi and ramen", category: "japanese", urgency: "medium" as const, mood: "craving" },
      { placeholder: "I'm craving Japanese", category: "japanese", urgency: "medium" as const, mood: "craving" }
    ],
    american: [
      { placeholder: "I want to eat American food", category: "american", urgency: "medium" as const, mood: "craving" },
      { placeholder: "Show me burgers and fries", category: "american", urgency: "medium" as const, mood: "craving" },
      { placeholder: "I'm craving American", category: "american", urgency: "medium" as const, mood: "craving" }
    ],
    thai: [
      { placeholder: "I want to eat Thai food", category: "thai", urgency: "medium" as const, mood: "craving" },
      { placeholder: "Show me pad thai and curry", category: "thai", urgency: "medium" as const, mood: "craving" },
      { placeholder: "I'm craving Thai", category: "thai", urgency: "medium" as const, mood: "craving" }
    ],
    mediterranean: [
      { placeholder: "I want to eat Mediterranean food", category: "mediterranean", urgency: "medium" as const, mood: "craving" },
      { placeholder: "Show me Greek and Lebanese", category: "mediterranean", urgency: "medium" as const, mood: "craving" },
      { placeholder: "I'm craving Mediterranean", category: "mediterranean", urgency: "medium" as const, mood: "craving" }
    ]
  };
  
  // Return prompts for the first preferred cuisine
  return cuisinePrompts[cuisines[0]] || [];
}

// Dietary-specific prompts
function getDietaryPrompts(context: SearchPromptContext): SearchPrompt[] {
  const { userPreferences } = context;
  const dietary = userPreferences?.dietary || [];
  
  if (dietary.length === 0) return [];
  
  const dietaryPrompts: Record<string, SearchPrompt[]> = {
    vegan: [
      { placeholder: "I want to eat vegan food", category: "vegan", urgency: "medium" as const, mood: "healthy" },
      { placeholder: "Show me plant-based options", category: "vegan", urgency: "medium" as const, mood: "healthy" },
      { placeholder: "I need vegan meals", category: "vegan", urgency: "medium" as const, mood: "healthy" }
    ],
    vegetarian: [
      { placeholder: "I want to eat vegetarian food", category: "vegetarian", urgency: "medium" as const, mood: "healthy" },
      { placeholder: "Show me meat-free options", category: "vegetarian", urgency: "medium" as const, mood: "healthy" },
      { placeholder: "I need vegetarian meals", category: "vegetarian", urgency: "medium" as const, mood: "healthy" }
    ],
    glutenfree: [
      { placeholder: "I want to eat gluten-free food", category: "glutenfree", urgency: "medium" as const, mood: "healthy" },
      { placeholder: "Show me gluten-free options", category: "glutenfree", urgency: "medium" as const, mood: "healthy" },
      { placeholder: "I need gluten-free meals", category: "glutenfree", urgency: "medium" as const, mood: "healthy" }
    ],
    halal: [
      { placeholder: "I want to eat halal food", category: "halal", urgency: "medium" as const, mood: "craving" },
      { placeholder: "Show me halal options", category: "halal", urgency: "medium" as const, mood: "craving" },
      { placeholder: "I need halal meals", category: "halal", urgency: "medium" as const, mood: "craving" }
    ],
    kosher: [
      { placeholder: "I want to eat kosher food", category: "kosher", urgency: "medium" as const, mood: "craving" },
      { placeholder: "Show me kosher options", category: "kosher", urgency: "medium" as const, mood: "craving" },
      { placeholder: "I need kosher meals", category: "kosher", urgency: "medium" as const, mood: "craving" }
    ]
  };
  
  // Return prompts for the first dietary preference
  return dietaryPrompts[dietary[0]] || [];
}

// Budget-specific prompts
function getBudgetPrompts(context: SearchPromptContext): SearchPrompt[] {
  const { userPreferences } = context;
  const budget = userPreferences?.budget || 'medium';
  
  const budgetPrompts: Record<string, SearchPrompt[]> = {
    low: [
      { placeholder: "I want to eat something cheap", category: "budget", urgency: "medium" as const, mood: "budget" },
      { placeholder: "Show me affordable food", category: "budget", urgency: "medium" as const, mood: "budget" },
      { placeholder: "I need budget-friendly meals", category: "budget", urgency: "medium" as const, mood: "budget" },
      { placeholder: "What's under £10?", category: "budget", urgency: "medium" as const, mood: "budget" },
      { placeholder: "Show me cheap eats", category: "budget", urgency: "medium" as const, mood: "budget" }
    ],
    medium: [
      { placeholder: "I want to eat something good", category: "any", urgency: "medium" as const, mood: "casual" },
      { placeholder: "Show me quality food", category: "any", urgency: "medium" as const, mood: "casual" },
      { placeholder: "I need a decent meal", category: "any", urgency: "medium" as const, mood: "casual" },
      { placeholder: "What's worth trying?", category: "any", urgency: "medium" as const, mood: "curious" },
      { placeholder: "Show me good value food", category: "any", urgency: "medium" as const, mood: "casual" }
    ],
    high: [
      { placeholder: "I want to eat something special", category: "premium", urgency: "low" as const, mood: "indulgent" },
      { placeholder: "Show me premium food", category: "premium", urgency: "low" as const, mood: "indulgent" },
      { placeholder: "I need luxury dining", category: "premium", urgency: "low" as const, mood: "indulgent" },
      { placeholder: "What's the best food here?", category: "premium", urgency: "low" as const, mood: "indulgent" },
      { placeholder: "Show me fine dining", category: "premium", urgency: "low" as const, mood: "indulgent" }
    ]
  };
  
  return budgetPrompts[budget];
}

// Special occasion prompts
function getSpecialOccasionPrompts(context: SearchPromptContext): SearchPrompt[] {
  const { specialOccasion } = context;
  
  if (!specialOccasion) return [];
  
  const occasionPrompts: Record<string, SearchPrompt[]> = {
    valentines: [
      { placeholder: "I want to eat romantic food", category: "romantic", urgency: "low" as const, mood: "indulgent" },
      { placeholder: "Show me date night food", category: "romantic", urgency: "low" as const, mood: "indulgent" },
      { placeholder: "I need romantic dining", category: "romantic", urgency: "low" as const, mood: "indulgent" }
    ],
    birthday: [
      { placeholder: "I want to eat birthday food", category: "celebration", urgency: "low" as const, mood: "indulgent" },
      { placeholder: "Show me celebration food", category: "celebration", urgency: "low" as const, mood: "indulgent" },
      { placeholder: "I need birthday treats", category: "celebration", urgency: "low" as const, mood: "indulgent" }
    ],
    christmas: [
      { placeholder: "I want to eat festive food", category: "festive", urgency: "low" as const, mood: "indulgent" },
      { placeholder: "Show me Christmas food", category: "festive", urgency: "low" as const, mood: "indulgent" },
      { placeholder: "I need holiday treats", category: "festive", urgency: "low" as const, mood: "indulgent" }
    ],
    anniversary: [
      { placeholder: "I want to eat anniversary food", category: "romantic", urgency: "low" as const, mood: "indulgent" },
      { placeholder: "Show me special occasion food", category: "romantic", urgency: "low" as const, mood: "indulgent" },
      { placeholder: "I need anniversary dining", category: "romantic", urgency: "low" as const, mood: "indulgent" }
    ]
  };
  
  return occasionPrompts[specialOccasion] || [];
}

// Random general prompts
function getRandomGeneralPrompts(): SearchPrompt[] {
  return [
    { placeholder: "I want to eat something delicious", category: "any", urgency: "medium", mood: "craving" },
    { placeholder: "Show me what's good", category: "any", urgency: "low", mood: "curious" },
    { placeholder: "I need food inspiration", category: "any", urgency: "low", mood: "curious" },
    { placeholder: "What should I eat today?", category: "any", urgency: "low", mood: "curious" },
    { placeholder: "I want to try something new", category: "any", urgency: "low", mood: "adventurous" },
    { placeholder: "Show me popular food", category: "any", urgency: "low", mood: "curious" },
    { placeholder: "I need a food adventure", category: "any", urgency: "low", mood: "adventurous" },
    { placeholder: "What's everyone eating?", category: "any", urgency: "low", mood: "curious" },
    { placeholder: "I want to eat something amazing", category: "any", urgency: "medium", mood: "indulgent" },
    { placeholder: "Show me the best food", category: "any", urgency: "low", mood: "indulgent" }
  ];
}

// Get current time context
export function getCurrentSearchContext(): SearchPromptContext {
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
    userPreferences: {
      cuisine: [],
      dietary: [],
      budget: 'medium',
      mood: 'hungry'
    }
  };
}

// Main function to get a dynamic search prompt
export function getDynamicSearchPrompt(context?: Partial<SearchPromptContext>): SearchPrompt {
  const currentContext = {
    ...getCurrentSearchContext(),
    ...context
  };
  
  // Collect all possible prompts
  let allPrompts: SearchPrompt[] = [];
  
  // Add time-based prompts
  allPrompts.push(...getTimeBasedPrompts(currentContext));
  
  // Add weekend-specific prompts if it's weekend
  if (currentContext.isWeekend) {
    allPrompts.push(...getWeekendPrompts(currentContext));
  }
  
  // Add mood-based prompts
  allPrompts.push(...getMoodBasedPrompts(currentContext));
  
  // Add cuisine-specific prompts
  allPrompts.push(...getCuisinePrompts(currentContext));
  
  // Add dietary-specific prompts
  allPrompts.push(...getDietaryPrompts(currentContext));
  
  // Add budget-specific prompts
  allPrompts.push(...getBudgetPrompts(currentContext));
  
  // Add special occasion prompts
  allPrompts.push(...getSpecialOccasionPrompts(currentContext));
  
  // Add random general prompts
  allPrompts.push(...getRandomGeneralPrompts());
  
  // Remove duplicates based on placeholder text
  const uniquePrompts = allPrompts.filter((prompt, index, self) => 
    index === self.findIndex(p => p.placeholder === prompt.placeholder)
  );
  
  // Randomly select one prompt
  const randomIndex = Math.floor(Math.random() * uniquePrompts.length);
  return uniquePrompts[randomIndex];
}

// Get multiple search prompts for variety
export function getMultipleSearchPrompts(count: number = 5, context?: Partial<SearchPromptContext>): SearchPrompt[] {
  const currentContext = {
    ...getCurrentSearchContext(),
    ...context
  };
  
  let allPrompts: SearchPrompt[] = [];
  
  // Add time-based prompts
  allPrompts.push(...getTimeBasedPrompts(currentContext));
  
  // Add weekend-specific prompts if it's weekend
  if (currentContext.isWeekend) {
    allPrompts.push(...getWeekendPrompts(currentContext));
  }
  
  // Add mood-based prompts
  allPrompts.push(...getMoodBasedPrompts(currentContext));
  
  // Add cuisine-specific prompts
  allPrompts.push(...getCuisinePrompts(currentContext));
  
  // Add dietary-specific prompts
  allPrompts.push(...getDietaryPrompts(currentContext));
  
  // Add budget-specific prompts
  allPrompts.push(...getBudgetPrompts(currentContext));
  
  // Add special occasion prompts
  allPrompts.push(...getSpecialOccasionPrompts(currentContext));
  
  // Add random general prompts
  allPrompts.push(...getRandomGeneralPrompts());
  
  // Remove duplicates based on placeholder text
  const uniquePrompts = allPrompts.filter((prompt, index, self) => 
    index === self.findIndex(p => p.placeholder === prompt.placeholder)
  );
  
  // Shuffle and return requested number
  const shuffled = uniquePrompts.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// Get search prompt by category
export function getSearchPromptByCategory(category: string, context?: Partial<SearchPromptContext>): SearchPrompt {
  const currentContext = {
    ...getCurrentSearchContext(),
    ...context
  };
  
  let categoryPrompts: SearchPrompt[] = [];
  
  // Get all prompts and filter by category
  const allPrompts = [
    ...getTimeBasedPrompts(currentContext),
    ...getWeekendPrompts(currentContext),
    ...getMoodBasedPrompts(currentContext),
    ...getCuisinePrompts(currentContext),
    ...getDietaryPrompts(currentContext),
    ...getBudgetPrompts(currentContext),
    ...getSpecialOccasionPrompts(currentContext),
    ...getRandomGeneralPrompts()
  ];
  
  categoryPrompts = allPrompts.filter(prompt => prompt.category === category);
  
  // If no category-specific prompts, return a general one
  if (categoryPrompts.length === 0) {
    return getDynamicSearchPrompt(context);
  }
  
  // Return random category prompt
  const randomIndex = Math.floor(Math.random() * categoryPrompts.length);
  return categoryPrompts[randomIndex];
}

// Get search prompt by urgency
export function getSearchPromptByUrgency(urgency: 'low' | 'medium' | 'high', context?: Partial<SearchPromptContext>): SearchPrompt {
  const currentContext = {
    ...getCurrentSearchContext(),
    ...context
  };
  
  let urgencyPrompts: SearchPrompt[] = [];
  
  // Get all prompts and filter by urgency
  const allPrompts = [
    ...getTimeBasedPrompts(currentContext),
    ...getWeekendPrompts(currentContext),
    ...getMoodBasedPrompts(currentContext),
    ...getCuisinePrompts(currentContext),
    ...getDietaryPrompts(currentContext),
    ...getBudgetPrompts(currentContext),
    ...getSpecialOccasionPrompts(currentContext),
    ...getRandomGeneralPrompts()
  ];
  
  urgencyPrompts = allPrompts.filter(prompt => prompt.urgency === urgency);
  
  // If no urgency-specific prompts, return a general one
  if (urgencyPrompts.length === 0) {
    return getDynamicSearchPrompt(context);
  }
  
  // Return random urgency prompt
  const randomIndex = Math.floor(Math.random() * urgencyPrompts.length);
  return urgencyPrompts[randomIndex];
} 