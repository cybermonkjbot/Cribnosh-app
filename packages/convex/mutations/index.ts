// Export all mutations from individual files
export * from './admin';
// Export aiChat mutations with explicit naming to avoid conflicts
export {
  createChannel, generateAIResponse, getOrCreateUser as getOrCreateAIUser, sendMessage as sendAIMessage
} from './aiChat';
export * from './analytics';
export * from './cache';
export * from './careers';
export * from './changes';
export * from './chats';

// Export chefs mutations with explicit naming to avoid conflicts
export {
  createChef,
  createCuisine, updateAvailability, updateChef,
  // Rename the conflicting 'update' to 'updateChefCustomOrder' for clarity
  update as updateChefCustomOrder, updateCuisine,
  skipComplianceTraining
} from './chefs';

// Export chef admin mutations with explicit naming to avoid conflicts
export {
  sendChefMessage,
  updateChefPerformance, updateChefVerification
} from './chefAdmin';

// Export chef courses mutations
export * from './chefCourses';

// Export chef documents mutations
export * from './chefDocuments';

// Export chef payouts mutations
export * from './chefPayouts';

// Export chef bank accounts mutations
export * from './chefBankAccounts';

// Export course modules mutations
export * from './courseModules';

// Export certificates mutations
export * from './certificates';

// Export order admin mutations with explicit naming to avoid conflicts
export {
  sendOrderNotification as sendOrderNotificationAdmin, updateOrderStatus as updateOrderStatusAdmin
} from './orderAdmin';

// Export delivery admin mutations with explicit naming to avoid conflicts
export {
  assignDriver as assignDriverToDelivery, flagDeliveryForReview, sendDeliveryNotification as sendDeliveryNotificationAdmin, updateDeliveryStatus as updateDeliveryStatusAdmin, updateDriverLocation as updateDriverLocationAdmin
} from './deliveryAdmin';

// Export contacts mutations with explicit naming to avoid conflicts
export {
  // Rename the conflicting 'create' to 'createContact' for clarity
  create as createContact
} from './contacts';

// Export customOrders mutations with explicit naming to avoid conflicts
export {
  // Rename the conflicting 'create' to 'createCustomOrder' for clarity
  create as createCustomOrder,
  update as updateCustomOrder
} from './customOrders';
export * from './delivery';
export * from './documents';
export * from './dripEmails';
export * from './drivers';
export * from './emotionsEngine';
export * from './files';
export * from './jobQueue';
export * from './kitchens';
export * from './liveSessions';
export * from './meals';
export * from './monitoring';
// Export notifications mutations with explicit naming to avoid conflicts
export {
  // Rename the conflicting 'create' to 'createNotification' for clarity
  create as createNotification
} from './notifications';
export * from './orders';
export * from './otp';
export * from './presence';
// Export reviews mutations with explicit naming to avoid conflicts
export {
  // Rename the conflicting 'create' to 'createReview' for clarity
  create as createReview,
  updateReview
} from './reviews';

// Export sessions mutations with explicit naming to avoid conflicts
export {
  // Rename the conflicting 'deleteSession' to 'deleteUserSession' for clarity
  deleteSession as deleteUserSession,
  deleteSessionByToken
} from './sessions';

export * from './specialOffers';

// Export claimed offers mutations
export * from './claimedOffers';
export * from './staff';
export * from './timelogs';
export * from './users';

// Export mutations from the new modules with explicit naming to avoid conflicts
export {
  create as createAccountDeletion,
  updateFeedback as updateAccountDeletionFeedback
} from './accountDeletions';
export {
  updateByUserId as updateAllergiesByUserId
} from './allergies';
export {
  updateChefAverageRating
} from './chefRatings';
export {
  addTransaction as addCustomerBalanceTransaction, createOrUpdate as createOrUpdateCustomerBalance
} from './customerBalance';
export {
  create as createDataDownload
} from './dataDownloads';
export {
  updateByUserId as updateDataSharingPreferencesByUserId
} from './dataSharingPreferences';
export {
  updateByUserId as updateDietaryPreferencesByUserId
} from './dietaryPreferences';
export {
  create as createFamilyProfile
} from './familyProfiles';
export {
  updateCrossContamination as updateFoodSafetyCrossContamination
} from './foodSafetySettings';
export {
  create as createPaymentMethod,
  setDefault as setPaymentMethodDefault
} from './paymentMethods';
export {
  create as createSupportCase
} from './supportCases';

// Export profile tracking mutations
export {
  unlockLevel as unlockForkPrintLevel, updateScore as updateForkPrintScore
} from './forkPrint';
export {
  bulkCreateMealLogs, createMealLog
} from './mealLogs';
export {
  addPoints as addNoshPoints, initializePoints as initializeNoshPoints, spendPoints as spendNoshPoints
} from './noshPoints';
export {
  setNutritionGoal
} from './nutrition';
export {
  initializeStreak,
  updateStreak
} from './streaks';

// Export waitlist mutations with explicit naming to avoid conflicts with admin
export {
  addToWaitlist, approveWaitlistEntry as approveWaitlistEntryFromWaitlist, createEmailCampaign, deleteWaitlistEntry as deleteWaitlistEntryFromWaitlist, rejectWaitlistEntry as rejectWaitlistEntryFromWaitlist, sendEmailCampaign, updateWaitlistEntry as updateWaitlistEntryFromWaitlist, updateWaitlistStatus
} from './waitlist';

// Export workSessions mutations with explicit naming to avoid conflicts
export {
  // Rename the conflicting 'deleteSession' to 'deleteWorkSession' for clarity
  deleteSession as deleteWorkSession
} from './workSessions';

// Export group orders mutations
export * from './groupOrders';

// Export treats mutations
export * from './treats';

// Export user connections mutations
export * from './userConnections';

// Export event chef requests mutations
export * from './eventChefRequests';

// Export blog mutations
export * from './blog';

// Export recipes mutations
export * from './recipes';

// Export stories mutations
export * from './stories';

// Export compliance mutations
export * from './compliance';
