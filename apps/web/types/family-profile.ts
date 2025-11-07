/**
 * Family Profile Types
 * Type definitions for family profile API requests and responses
 */

export interface FamilyMemberInput {
  name: string;
  email: string;
  phone?: string;
  relationship: string;
  budget_settings?: {
    daily_limit?: number;
    weekly_limit?: number;
    monthly_limit?: number;
    currency?: string;
  };
}

export interface FamilyMemberPreferences {
  allergy_ids?: string[];
  dietary_preference_id?: string;
  parent_controlled?: boolean;
}

export interface FamilyProfileSettings {
  shared_payment_methods?: boolean;
  shared_orders?: boolean;
  allow_child_ordering?: boolean;
  require_approval_for_orders?: boolean;
  spending_notifications?: boolean;
}

export interface SetupFamilyProfileRequest {
  family_members?: FamilyMemberInput[];
  settings?: FamilyProfileSettings;
}

export interface InviteFamilyMemberRequest {
  member: FamilyMemberInput;
  family_profile_id?: string;
}

export interface UpdateMemberBudgetRequest {
  budget_settings?: {
    daily_limit?: number;
    weekly_limit?: number;
    monthly_limit?: number;
    currency?: string;
  };
  preferences?: FamilyMemberPreferences;
}

