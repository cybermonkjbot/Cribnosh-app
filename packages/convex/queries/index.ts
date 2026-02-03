// @ts-nocheck
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
  getByUserId as getCustomerBalanceTransactionsByUserId,
  getCountByUserId as getCustomerBalanceTransactionsCountByUserId
} from './customerBalanceTransactions';
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

// Export claimed offers queries
export * from './claimedOffers';

// Export admin queries
export * from './admin';

// Export waitlist queries
export * from './waitlist';

// Export blog queries
export * from './blog';

// Export recipes queries
export * from './recipes';

// Export stories queries
export * from './stories';

// Export video posts queries
export * from './videoPosts';

// Export users queries (explicit exports to avoid conflicts)
export {
  countUnreadNotifications, getAll, getAllDocuments, getAllStaff, getAllUsers, getById, getCurrentUser, getDietaryPreferences,
  getFavoriteCuisines, getRecentUsers, getReferralLeaderboard, getStripeCustomerId, getTotalUserCount, getUserByEmail, getUserById, getUserByNameOrEmail, getUserByOAuthProvider, getUserByPhone, getUserBySessionToken, getUserByToken, getUserDocuments, getUserNotifications, getUserProfile, getUserReferralHistory,
  getUserReferralHistoryPaginated, getUserReferralStats, getUsersByRole,
  getUsersByStatus, getUsersForAdmin
} from './users';

// Export vehicles queries
export * from './vehicles';

// Export banks queries
export * from './banks';

// Export chef courses queries with explicit naming to avoid conflicts
export {
  getByChefAndCourse as getChefCourseByChefAndCourse,
  getProgressSummary as getChefCourseProgressSummary,
  getByChefId as getChefCoursesByChefId,
  isOnboardingComplete as isChefOnboardingComplete
} from './chefCourses';

// Export chef queries
export {
  getAllChefContent, isBasicOnboardingComplete
} from './chefs';

// Export chef documents queries with explicit naming to avoid conflicts
export {
  getByChefAndType as getChefDocumentsByChefAndType, getByChefId as getChefDocumentsByChefId, getSummary as getChefDocumentsSummary
} from './chefDocuments';

// Export chef earnings queries
export * from './chefEarnings';

// Export chef transactions queries
export * from './chefTransactions';

// Export chef tax queries
export * from './chefTax';

// Export chef payouts queries
export * from './chefPayouts';

// Export chef bank accounts queries
export * from './chefBankAccounts';

// Export course modules queries
export * from './courseModules';

// Export certificates queries
export * from './certificates';

// Export live sessions queries
export * from './liveSessions';

// Export meals queries
export * from './meals';

