// Feature flags and configuration
export const CONFIG = {
  SHAKE_TO_EAT_ENABLED: false, // Disable shake to eat feature
  DEBUG_MODE: true, // Enable debug mode for testing

  // Hidden sections configuration
  HIDDEN_SECTIONS: {
    ENABLED: true, // Master toggle for hidden sections
    USUAL_DINNER_ENABLED: true, // "Your Dinner Favourites" section
    MADE_YOUR_DAY_ENABLED: true, // "Sections like these made your day" section
    PLAY_TO_WIN_ENABLED: true, // "Play to win" free food section
    SHOW_FREQUENCY: 0.3, // 30% chance to show hidden sections when conditions are met
    MIN_ORDER_COUNT: 3, // Minimum orders before showing "usual dinner" section
    MIN_DAYS_ACTIVE: 7, // Minimum days active before showing hidden sections
  },

  // Play to win configuration
  PLAY_TO_WIN: {
    ENABLED: true,
    FREE_AMOUNT: 0, // All items are free (£0)
    MAX_PARTICIPANTS: 10, // Maximum participants per game
    GAME_DURATION: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    MIN_COLLEAGUES: 2, // Minimum colleagues needed to start game
  },
};
