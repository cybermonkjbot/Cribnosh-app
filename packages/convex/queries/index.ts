// Export all queries from the workSessions module
export * from './workSessions';

// Export all queries from the email module
export * from './email';

// Export all queries from the aiChat module
export * from './aiChat';

// Export queries from the new modules with explicit naming to avoid conflicts
export {
  getByUserId as getAccountDeletionByUserId
} from './accountDeletions';
export {
  getByUserId as getAllergiesByUserId
} from './allergies';
export {
  getByUserId as getCustomerBalanceByUserId,
  getTransactions as getCustomerBalanceTransactions
} from './customerBalance';
export {
  getRecentByUserId as getRecentDataDownloadsByUserId
} from './dataDownloads';
export {
  getByUserId as getDataSharingPreferencesByUserId
} from './dataSharingPreferences';
export {
  getByUserId as getDietaryPreferencesByUserId
} from './dietaryPreferences';
export {
  getByUserId as getFamilyProfileByUserId
} from './familyProfiles';
export {
  getByUserId as getFoodSafetySettingsByUserId
} from './foodSafetySettings';
export {
  getById as getPaymentMethodById, getByUserId as getPaymentMethodsByUserId
} from './paymentMethods';
export {
  getByOrderId as getSupportCasesByOrderId, getByUserId as getSupportCasesByUserId
} from './supportCases';

// Export profile tracking queries
export {
  getScoreByUserId as getForkPrintScoreByUserId
} from './forkPrint';
export {
  getMealLogsByDateRange,
  getMealsByMonth,
  getMealsByWeek
} from './mealLogs';
export {
  getTransactionsByUserId as getNoshPointTransactionsByUserId, getPointsByUserId as getNoshPointsByUserId
} from './noshPoints';
export {
  getCaloriesProgress,
  getNutritionGoal
} from './nutrition';
export {
  getMonthlyOverview,
  getWeeklySummary
} from './stats';
export {
  getStreakByUserId
} from './streaks';

// Export group orders queries
export * from './groupOrders';

// Export treats queries
export * from './treats';

// Export user connections queries
export * from './userConnections';

// Export special offers queries
export * from './specialOffers';

// Export admin queries
export * from './admin';

// Export users queries (explicit exports to avoid conflicts)
export {
  countUnreadNotifications, getAll, getAllDocuments, getAllStaff, getAllUsers, getById, getCurrentUser, getDietaryPreferences,
  getFavoriteCuisines, getRecentUsers, getReferralLeaderboard, getStripeCustomerId, getTotalUserCount, getUserByEmail, getUserById, getUserByNameOrEmail, getUserByOAuthProvider, getUserByPhone, getUserBySessionToken, getUserByToken, getUserDocuments, getUserNotifications, getUserProfile, getUserReferralHistory,
  getUserReferralHistoryPaginated, getUserReferralStats, getUsersByRole,
  getUsersByStatus, getUsersForAdmin
} from './users';

