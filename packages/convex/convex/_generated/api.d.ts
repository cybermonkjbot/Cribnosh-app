/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions_agora from "../actions/agora.js";
import type * as actions_data_compilation from "../actions/data_compilation.js";
import type * as actions_dripScheduler from "../actions/dripScheduler.js";
import type * as actions_emotionsEngine from "../actions/emotionsEngine.js";
import type * as actions_index from "../actions/index.js";
import type * as actions_liveSessions from "../actions/liveSessions.js";
import type * as actions_orders from "../actions/orders.js";
import type * as actions_password from "../actions/password.js";
import type * as actions_prelaunchEmails from "../actions/prelaunchEmails.js";
import type * as actions_resend from "../actions/resend.js";
import type * as actions_seedData from "../actions/seedData.js";
import type * as actions_staff from "../actions/staff.js";
import type * as actions_users from "../actions/users.js";
import type * as actions_waitlist from "../actions/waitlist.js";
import type * as actions_weather from "../actions/weather.js";
import type * as convex__generated_api from "../convex/_generated/api.js";
import type * as convex__generated_server from "../convex/_generated/server.js";
import type * as crons_autoRegister from "../crons/autoRegister.js";
import type * as crons_cleanupExpiredOTPs from "../crons/cleanupExpiredOTPs.js";
import type * as crons_dripScheduler from "../crons/dripScheduler.js";
import type * as crons_healthCheck from "../crons/healthCheck.js";
import type * as crons_maintenance from "../crons/maintenance.js";
import type * as crons_refundEligibility from "../crons/refundEligibility.js";
import type * as crons from "../crons.js";
import type * as emailAnalytics from "../emailAnalytics.js";
import type * as emailAutomation from "../emailAutomation.js";
import type * as emailConfig from "../emailConfig.js";
import type * as http from "../http.js";
import type * as internal_appleNotifications from "../internal/appleNotifications.js";
import type * as internal_liveSessions from "../internal/liveSessions.js";
import type * as internal_maintenance from "../internal/maintenance.js";
import type * as internal_registerMaintenanceCrons from "../internal/registerMaintenanceCrons.js";
import type * as mutations_accountDeletions from "../mutations/accountDeletions.js";
import type * as mutations_admin from "../mutations/admin.js";
import type * as mutations_aiChat from "../mutations/aiChat.js";
import type * as mutations_allergies from "../mutations/allergies.js";
import type * as mutations_analytics from "../mutations/analytics.js";
import type * as mutations_blog from "../mutations/blog.js";
import type * as mutations_cache from "../mutations/cache.js";
import type * as mutations_careers from "../mutations/careers.js";
import type * as mutations_changes from "../mutations/changes.js";
import type * as mutations_chats from "../mutations/chats.js";
import type * as mutations_chefAdmin from "../mutations/chefAdmin.js";
import type * as mutations_chefRatings from "../mutations/chefRatings.js";
import type * as mutations_chefs from "../mutations/chefs.js";
import type * as mutations_cities from "../mutations/cities.js";
import type * as mutations_compliance from "../mutations/compliance.js";
import type * as mutations_contacts from "../mutations/contacts.js";
import type * as mutations_content from "../mutations/content.js";
import type * as mutations_customOrders from "../mutations/customOrders.js";
import type * as mutations_customerBalance from "../mutations/customerBalance.js";
import type * as mutations_dataDownloads from "../mutations/dataDownloads.js";
import type * as mutations_dataSharingPreferences from "../mutations/dataSharingPreferences.js";
import type * as mutations_delivery from "../mutations/delivery.js";
import type * as mutations_deliveryAdmin from "../mutations/deliveryAdmin.js";
import type * as mutations_dietaryPreferences from "../mutations/dietaryPreferences.js";
import type * as mutations_documents from "../mutations/documents.js";
import type * as mutations_dripEmails from "../mutations/dripEmails.js";
import type * as mutations_drivers from "../mutations/drivers.js";
import type * as mutations_email from "../mutations/email.js";
import type * as mutations_emailAnalytics from "../mutations/emailAnalytics.js";
import type * as mutations_emailAssets from "../mutations/emailAssets.js";
import type * as mutations_emotionsEngine from "../mutations/emotionsEngine.js";
import type * as mutations_eventChefRequests from "../mutations/eventChefRequests.js";
import type * as mutations_familyProfiles from "../mutations/familyProfiles.js";
import type * as mutations_files from "../mutations/files.js";
import type * as mutations_foodSafetySettings from "../mutations/foodSafetySettings.js";
import type * as mutations_forkPrint from "../mutations/forkPrint.js";
import type * as mutations_groupOrders from "../mutations/groupOrders.js";
import type * as mutations_index from "../mutations/index.js";
import type * as mutations_jobQueue from "../mutations/jobQueue.js";
import type * as mutations_kitchens from "../mutations/kitchens.js";
import type * as mutations_liveSessions from "../mutations/liveSessions.js";
import type * as mutations_mealLogs from "../mutations/mealLogs.js";
import type * as mutations_meals from "../mutations/meals.js";
import type * as mutations_monitoring from "../mutations/monitoring.js";
import type * as mutations_noshPoints from "../mutations/noshPoints.js";
import type * as mutations_notifications from "../mutations/notifications.js";
import type * as mutations_nutrition from "../mutations/nutrition.js";
import type * as mutations_orderAdmin from "../mutations/orderAdmin.js";
import type * as mutations_orderReviews from "../mutations/orderReviews.js";
import type * as mutations_orders from "../mutations/orders.js";
import type * as mutations_otp from "../mutations/otp.js";
import type * as mutations_paymentAnalytics from "../mutations/paymentAnalytics.js";
import type * as mutations_paymentMethods from "../mutations/paymentMethods.js";
import type * as mutations_payroll from "../mutations/payroll.js";
import type * as mutations_presence from "../mutations/presence.js";
import type * as mutations_reviews from "../mutations/reviews.js";
import type * as mutations_sessions from "../mutations/sessions.js";
import type * as mutations_specialOffers from "../mutations/specialOffers.js";
import type * as mutations_staff from "../mutations/staff.js";
import type * as mutations_streaks from "../mutations/streaks.js";
import type * as mutations_supportCases from "../mutations/supportCases.js";
import type * as mutations_timeTracking from "../mutations/timeTracking.js";
import type * as mutations_timelogs from "../mutations/timelogs.js";
import type * as mutations_treats from "../mutations/treats.js";
import type * as mutations_updateTestUsers from "../mutations/updateTestUsers.js";
import type * as mutations_userConnections from "../mutations/userConnections.js";
import type * as mutations_userFavorites from "../mutations/userFavorites.js";
import type * as mutations_userFollows from "../mutations/userFollows.js";
import type * as mutations_userManagement from "../mutations/userManagement.js";
import type * as mutations_users from "../mutations/users.js";
import type * as mutations_verificationSessions from "../mutations/verificationSessions.js";
import type * as mutations_videoCollections from "../mutations/videoCollections.js";
import type * as mutations_videoComments from "../mutations/videoComments.js";
import type * as mutations_videoPosts from "../mutations/videoPosts.js";
import type * as mutations_waitlist from "../mutations/waitlist.js";
import type * as mutations_workSessions from "../mutations/workSessions.js";
import type * as paymentAnalytics from "../paymentAnalytics.js";
import type * as payroll_admin from "../payroll/admin.js";
import type * as payroll_index from "../payroll/index.js";
import type * as payroll_periods from "../payroll/periods.js";
import type * as payroll_reports from "../payroll/reports.js";
import type * as payroll_staff from "../payroll/staff.js";
import type * as payroll_types from "../payroll/types.js";
import type * as queries_accountDeletions from "../queries/accountDeletions.js";
import type * as queries_activityFeed from "../queries/activityFeed.js";
import type * as queries_admin from "../queries/admin.js";
import type * as queries_adminActions from "../queries/adminActions.js";
import type * as queries_adminLogs from "../queries/adminLogs.js";
import type * as queries_aiChat from "../queries/aiChat.js";
import type * as queries_allergies from "../queries/allergies.js";
import type * as queries_analytics from "../queries/analytics.js";
import type * as queries_blog from "../queries/blog.js";
import type * as queries_bookings from "../queries/bookings.js";
import type * as queries_cache from "../queries/cache.js";
import type * as queries_careers from "../queries/careers.js";
import type * as queries_carts from "../queries/carts.js";
import type * as queries_chats from "../queries/chats.js";
import type * as queries_chefs from "../queries/chefs.js";
import type * as queries_cities from "../queries/cities.js";
import type * as queries_compliance from "../queries/compliance.js";
import type * as queries_contacts from "../queries/contacts.js";
import type * as queries_content from "../queries/content.js";
import type * as queries_custom_orders from "../queries/custom_orders.js";
import type * as queries_customerBalance from "../queries/customerBalance.js";
import type * as queries_dashboardStats from "../queries/dashboardStats.js";
import type * as queries_dataDownloads from "../queries/dataDownloads.js";
import type * as queries_dataSharingPreferences from "../queries/dataSharingPreferences.js";
import type * as queries_delivery from "../queries/delivery.js";
import type * as queries_dietaryPreferences from "../queries/dietaryPreferences.js";
import type * as queries_documents from "../queries/documents.js";
import type * as queries_dripEmails from "../queries/dripEmails.js";
import type * as queries_drivers from "../queries/drivers.js";
import type * as queries_email from "../queries/email.js";
import type * as queries_emailAssets from "../queries/emailAssets.js";
import type * as queries_emailConfig from "../queries/emailConfig.js";
import type * as queries_emotionsEngine from "../queries/emotionsEngine.js";
import type * as queries_familyProfiles from "../queries/familyProfiles.js";
import type * as queries_foodSafetySettings from "../queries/foodSafetySettings.js";
import type * as queries_forkPrint from "../queries/forkPrint.js";
import type * as queries_groupOrders from "../queries/groupOrders.js";
import type * as queries_index from "../queries/index.js";
import type * as queries_kitchens from "../queries/kitchens.js";
import type * as queries_liveSessions from "../queries/liveSessions.js";
import type * as queries_mealLogs from "../queries/mealLogs.js";
import type * as queries_mealRecommendations from "../queries/mealRecommendations.js";
import type * as queries_meals from "../queries/meals.js";
import type * as queries_noshPoints from "../queries/noshPoints.js";
import type * as queries_notifications from "../queries/notifications.js";
import type * as queries_nutrition from "../queries/nutrition.js";
import type * as queries_orders from "../queries/orders.js";
import type * as queries_otp from "../queries/otp.js";
import type * as queries_paymentAnalytics from "../queries/paymentAnalytics.js";
import type * as queries_paymentMethods from "../queries/paymentMethods.js";
import type * as queries_payroll from "../queries/payroll.js";
import type * as queries_presence from "../queries/presence.js";
import type * as queries_reviews from "../queries/reviews.js";
import type * as queries_sessions from "../queries/sessions.js";
import type * as queries_specialOffers from "../queries/specialOffers.js";
import type * as queries_staff from "../queries/staff.js";
import type * as queries_stats from "../queries/stats.js";
import type * as queries_streaks from "../queries/streaks.js";
import type * as queries_supportAgents from "../queries/supportAgents.js";
import type * as queries_supportCases from "../queries/supportCases.js";
import type * as queries_systemHealth from "../queries/systemHealth.js";
import type * as queries_timeTracking from "../queries/timeTracking.js";
import type * as queries_timelogs from "../queries/timelogs.js";
import type * as queries_treats from "../queries/treats.js";
import type * as queries_userConnections from "../queries/userConnections.js";
import type * as queries_userFavorites from "../queries/userFavorites.js";
import type * as queries_userFollows from "../queries/userFollows.js";
import type * as queries_userManagement from "../queries/userManagement.js";
import type * as queries_users from "../queries/users.js";
import type * as queries_videoCollections from "../queries/videoCollections.js";
import type * as queries_videoComments from "../queries/videoComments.js";
import type * as queries_videoPosts from "../queries/videoPosts.js";
import type * as queries_waitlist from "../queries/waitlist.js";
import type * as queries_workSessions from "../queries/workSessions.js";
import type * as schemaDrip from "../schemaDrip.js";
import type * as services_resend from "../services/resend.js";
import type * as types_convexContexts from "../types/convexContexts.js";
import type * as types_email from "../types/email.js";
import type * as types_livestream from "../types/livestream.js";
import type * as utils_auth from "../utils/auth.js";
import type * as utils_ecoImpact from "../utils/ecoImpact.js";
import type * as utils_mealRecommendations from "../utils/mealRecommendations.js";
import type * as utils_priceEstimation from "../utils/priceEstimation.js";
import type * as utils_regionValidation from "../utils/regionValidation.js";
import type * as utils_userPreferencesFilter from "../utils/userPreferencesFilter.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "actions/agora": typeof actions_agora;
  "actions/data_compilation": typeof actions_data_compilation;
  "actions/dripScheduler": typeof actions_dripScheduler;
  "actions/emotionsEngine": typeof actions_emotionsEngine;
  "actions/index": typeof actions_index;
  "actions/liveSessions": typeof actions_liveSessions;
  "actions/orders": typeof actions_orders;
  "actions/password": typeof actions_password;
  "actions/prelaunchEmails": typeof actions_prelaunchEmails;
  "actions/resend": typeof actions_resend;
  "actions/seedData": typeof actions_seedData;
  "actions/staff": typeof actions_staff;
  "actions/users": typeof actions_users;
  "actions/waitlist": typeof actions_waitlist;
  "actions/weather": typeof actions_weather;
  "convex/_generated/api": typeof convex__generated_api;
  "convex/_generated/server": typeof convex__generated_server;
  "crons/autoRegister": typeof crons_autoRegister;
  "crons/cleanupExpiredOTPs": typeof crons_cleanupExpiredOTPs;
  "crons/dripScheduler": typeof crons_dripScheduler;
  "crons/healthCheck": typeof crons_healthCheck;
  "crons/maintenance": typeof crons_maintenance;
  "crons/refundEligibility": typeof crons_refundEligibility;
  crons: typeof crons;
  emailAnalytics: typeof emailAnalytics;
  emailAutomation: typeof emailAutomation;
  emailConfig: typeof emailConfig;
  http: typeof http;
  "internal/appleNotifications": typeof internal_appleNotifications;
  "internal/liveSessions": typeof internal_liveSessions;
  "internal/maintenance": typeof internal_maintenance;
  "internal/registerMaintenanceCrons": typeof internal_registerMaintenanceCrons;
  "mutations/accountDeletions": typeof mutations_accountDeletions;
  "mutations/admin": typeof mutations_admin;
  "mutations/aiChat": typeof mutations_aiChat;
  "mutations/allergies": typeof mutations_allergies;
  "mutations/analytics": typeof mutations_analytics;
  "mutations/blog": typeof mutations_blog;
  "mutations/cache": typeof mutations_cache;
  "mutations/careers": typeof mutations_careers;
  "mutations/changes": typeof mutations_changes;
  "mutations/chats": typeof mutations_chats;
  "mutations/chefAdmin": typeof mutations_chefAdmin;
  "mutations/chefRatings": typeof mutations_chefRatings;
  "mutations/chefs": typeof mutations_chefs;
  "mutations/cities": typeof mutations_cities;
  "mutations/compliance": typeof mutations_compliance;
  "mutations/contacts": typeof mutations_contacts;
  "mutations/content": typeof mutations_content;
  "mutations/customOrders": typeof mutations_customOrders;
  "mutations/customerBalance": typeof mutations_customerBalance;
  "mutations/dataDownloads": typeof mutations_dataDownloads;
  "mutations/dataSharingPreferences": typeof mutations_dataSharingPreferences;
  "mutations/delivery": typeof mutations_delivery;
  "mutations/deliveryAdmin": typeof mutations_deliveryAdmin;
  "mutations/dietaryPreferences": typeof mutations_dietaryPreferences;
  "mutations/documents": typeof mutations_documents;
  "mutations/dripEmails": typeof mutations_dripEmails;
  "mutations/drivers": typeof mutations_drivers;
  "mutations/email": typeof mutations_email;
  "mutations/emailAnalytics": typeof mutations_emailAnalytics;
  "mutations/emailAssets": typeof mutations_emailAssets;
  "mutations/emotionsEngine": typeof mutations_emotionsEngine;
  "mutations/eventChefRequests": typeof mutations_eventChefRequests;
  "mutations/familyProfiles": typeof mutations_familyProfiles;
  "mutations/files": typeof mutations_files;
  "mutations/foodSafetySettings": typeof mutations_foodSafetySettings;
  "mutations/forkPrint": typeof mutations_forkPrint;
  "mutations/groupOrders": typeof mutations_groupOrders;
  "mutations/index": typeof mutations_index;
  "mutations/jobQueue": typeof mutations_jobQueue;
  "mutations/kitchens": typeof mutations_kitchens;
  "mutations/liveSessions": typeof mutations_liveSessions;
  "mutations/mealLogs": typeof mutations_mealLogs;
  "mutations/meals": typeof mutations_meals;
  "mutations/monitoring": typeof mutations_monitoring;
  "mutations/noshPoints": typeof mutations_noshPoints;
  "mutations/notifications": typeof mutations_notifications;
  "mutations/nutrition": typeof mutations_nutrition;
  "mutations/orderAdmin": typeof mutations_orderAdmin;
  "mutations/orderReviews": typeof mutations_orderReviews;
  "mutations/orders": typeof mutations_orders;
  "mutations/otp": typeof mutations_otp;
  "mutations/paymentAnalytics": typeof mutations_paymentAnalytics;
  "mutations/paymentMethods": typeof mutations_paymentMethods;
  "mutations/payroll": typeof mutations_payroll;
  "mutations/presence": typeof mutations_presence;
  "mutations/reviews": typeof mutations_reviews;
  "mutations/sessions": typeof mutations_sessions;
  "mutations/specialOffers": typeof mutations_specialOffers;
  "mutations/staff": typeof mutations_staff;
  "mutations/streaks": typeof mutations_streaks;
  "mutations/supportCases": typeof mutations_supportCases;
  "mutations/timeTracking": typeof mutations_timeTracking;
  "mutations/timelogs": typeof mutations_timelogs;
  "mutations/treats": typeof mutations_treats;
  "mutations/updateTestUsers": typeof mutations_updateTestUsers;
  "mutations/userConnections": typeof mutations_userConnections;
  "mutations/userFavorites": typeof mutations_userFavorites;
  "mutations/userFollows": typeof mutations_userFollows;
  "mutations/userManagement": typeof mutations_userManagement;
  "mutations/users": typeof mutations_users;
  "mutations/verificationSessions": typeof mutations_verificationSessions;
  "mutations/videoCollections": typeof mutations_videoCollections;
  "mutations/videoComments": typeof mutations_videoComments;
  "mutations/videoPosts": typeof mutations_videoPosts;
  "mutations/waitlist": typeof mutations_waitlist;
  "mutations/workSessions": typeof mutations_workSessions;
  paymentAnalytics: typeof paymentAnalytics;
  "payroll/admin": typeof payroll_admin;
  "payroll/index": typeof payroll_index;
  "payroll/periods": typeof payroll_periods;
  "payroll/reports": typeof payroll_reports;
  "payroll/staff": typeof payroll_staff;
  "payroll/types": typeof payroll_types;
  "queries/accountDeletions": typeof queries_accountDeletions;
  "queries/activityFeed": typeof queries_activityFeed;
  "queries/admin": typeof queries_admin;
  "queries/adminActions": typeof queries_adminActions;
  "queries/adminLogs": typeof queries_adminLogs;
  "queries/aiChat": typeof queries_aiChat;
  "queries/allergies": typeof queries_allergies;
  "queries/analytics": typeof queries_analytics;
  "queries/blog": typeof queries_blog;
  "queries/bookings": typeof queries_bookings;
  "queries/cache": typeof queries_cache;
  "queries/careers": typeof queries_careers;
  "queries/carts": typeof queries_carts;
  "queries/chats": typeof queries_chats;
  "queries/chefs": typeof queries_chefs;
  "queries/cities": typeof queries_cities;
  "queries/compliance": typeof queries_compliance;
  "queries/contacts": typeof queries_contacts;
  "queries/content": typeof queries_content;
  "queries/custom_orders": typeof queries_custom_orders;
  "queries/customerBalance": typeof queries_customerBalance;
  "queries/dashboardStats": typeof queries_dashboardStats;
  "queries/dataDownloads": typeof queries_dataDownloads;
  "queries/dataSharingPreferences": typeof queries_dataSharingPreferences;
  "queries/delivery": typeof queries_delivery;
  "queries/dietaryPreferences": typeof queries_dietaryPreferences;
  "queries/documents": typeof queries_documents;
  "queries/dripEmails": typeof queries_dripEmails;
  "queries/drivers": typeof queries_drivers;
  "queries/email": typeof queries_email;
  "queries/emailAssets": typeof queries_emailAssets;
  "queries/emailConfig": typeof queries_emailConfig;
  "queries/emotionsEngine": typeof queries_emotionsEngine;
  "queries/familyProfiles": typeof queries_familyProfiles;
  "queries/foodSafetySettings": typeof queries_foodSafetySettings;
  "queries/forkPrint": typeof queries_forkPrint;
  "queries/groupOrders": typeof queries_groupOrders;
  "queries/index": typeof queries_index;
  "queries/kitchens": typeof queries_kitchens;
  "queries/liveSessions": typeof queries_liveSessions;
  "queries/mealLogs": typeof queries_mealLogs;
  "queries/mealRecommendations": typeof queries_mealRecommendations;
  "queries/meals": typeof queries_meals;
  "queries/noshPoints": typeof queries_noshPoints;
  "queries/notifications": typeof queries_notifications;
  "queries/nutrition": typeof queries_nutrition;
  "queries/orders": typeof queries_orders;
  "queries/otp": typeof queries_otp;
  "queries/paymentAnalytics": typeof queries_paymentAnalytics;
  "queries/paymentMethods": typeof queries_paymentMethods;
  "queries/payroll": typeof queries_payroll;
  "queries/presence": typeof queries_presence;
  "queries/reviews": typeof queries_reviews;
  "queries/sessions": typeof queries_sessions;
  "queries/specialOffers": typeof queries_specialOffers;
  "queries/staff": typeof queries_staff;
  "queries/stats": typeof queries_stats;
  "queries/streaks": typeof queries_streaks;
  "queries/supportAgents": typeof queries_supportAgents;
  "queries/supportCases": typeof queries_supportCases;
  "queries/systemHealth": typeof queries_systemHealth;
  "queries/timeTracking": typeof queries_timeTracking;
  "queries/timelogs": typeof queries_timelogs;
  "queries/treats": typeof queries_treats;
  "queries/userConnections": typeof queries_userConnections;
  "queries/userFavorites": typeof queries_userFavorites;
  "queries/userFollows": typeof queries_userFollows;
  "queries/userManagement": typeof queries_userManagement;
  "queries/users": typeof queries_users;
  "queries/videoCollections": typeof queries_videoCollections;
  "queries/videoComments": typeof queries_videoComments;
  "queries/videoPosts": typeof queries_videoPosts;
  "queries/waitlist": typeof queries_waitlist;
  "queries/workSessions": typeof queries_workSessions;
  schemaDrip: typeof schemaDrip;
  "services/resend": typeof services_resend;
  "types/convexContexts": typeof types_convexContexts;
  "types/email": typeof types_email;
  "types/livestream": typeof types_livestream;
  "utils/auth": typeof utils_auth;
  "utils/ecoImpact": typeof utils_ecoImpact;
  "utils/mealRecommendations": typeof utils_mealRecommendations;
  "utils/priceEstimation": typeof utils_priceEstimation;
  "utils/regionValidation": typeof utils_regionValidation;
  "utils/userPreferencesFilter": typeof utils_userPreferencesFilter;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {
  crons: {
    public: {
      del: FunctionReference<
        "mutation",
        "internal",
        { identifier: { id: string } | { name: string } },
        null
      >;
      get: FunctionReference<
        "query",
        "internal",
        { identifier: { id: string } | { name: string } },
        {
          args: Record<string, any>;
          functionHandle: string;
          id: string;
          name?: string;
          schedule:
            | { kind: "interval"; ms: number }
            | { cronspec: string; kind: "cron"; tz?: string };
        } | null
      >;
      list: FunctionReference<
        "query",
        "internal",
        {},
        Array<{
          args: Record<string, any>;
          functionHandle: string;
          id: string;
          name?: string;
          schedule:
            | { kind: "interval"; ms: number }
            | { cronspec: string; kind: "cron"; tz?: string };
        }>
      >;
      register: FunctionReference<
        "mutation",
        "internal",
        {
          args: Record<string, any>;
          functionHandle: string;
          name?: string;
          schedule:
            | { kind: "interval"; ms: number }
            | { cronspec: string; kind: "cron"; tz?: string };
        },
        string
      >;
    };
  };
  resend: {
    lib: {
      cancelEmail: FunctionReference<
        "mutation",
        "internal",
        { emailId: string },
        null
      >;
      cleanupAbandonedEmails: FunctionReference<
        "mutation",
        "internal",
        { olderThan?: number },
        null
      >;
      cleanupOldEmails: FunctionReference<
        "mutation",
        "internal",
        { olderThan?: number },
        null
      >;
      createManualEmail: FunctionReference<
        "mutation",
        "internal",
        {
          from: string;
          headers?: Array<{ name: string; value: string }>;
          replyTo?: Array<string>;
          subject: string;
          to: string;
        },
        string
      >;
      get: FunctionReference<
        "query",
        "internal",
        { emailId: string },
        {
          complained: boolean;
          createdAt: number;
          errorMessage?: string;
          finalizedAt: number;
          from: string;
          headers?: Array<{ name: string; value: string }>;
          html?: string;
          opened: boolean;
          replyTo: Array<string>;
          resendId?: string;
          segment: number;
          status:
            | "waiting"
            | "queued"
            | "cancelled"
            | "sent"
            | "delivered"
            | "delivery_delayed"
            | "bounced"
            | "failed";
          subject: string;
          text?: string;
          to: string;
        } | null
      >;
      getStatus: FunctionReference<
        "query",
        "internal",
        { emailId: string },
        {
          complained: boolean;
          errorMessage: string | null;
          opened: boolean;
          status:
            | "waiting"
            | "queued"
            | "cancelled"
            | "sent"
            | "delivered"
            | "delivery_delayed"
            | "bounced"
            | "failed";
        } | null
      >;
      handleEmailEvent: FunctionReference<
        "mutation",
        "internal",
        { event: any },
        null
      >;
      sendEmail: FunctionReference<
        "mutation",
        "internal",
        {
          from: string;
          headers?: Array<{ name: string; value: string }>;
          html?: string;
          options: {
            apiKey: string;
            initialBackoffMs: number;
            onEmailEvent?: { fnHandle: string };
            retryAttempts: number;
            testMode: boolean;
          };
          replyTo?: Array<string>;
          subject: string;
          text?: string;
          to: string;
        },
        string
      >;
      updateManualEmail: FunctionReference<
        "mutation",
        "internal",
        {
          emailId: string;
          errorMessage?: string;
          resendId?: string;
          status:
            | "waiting"
            | "queued"
            | "cancelled"
            | "sent"
            | "delivered"
            | "delivery_delayed"
            | "bounced"
            | "failed";
        },
        null
      >;
    };
  };
};
