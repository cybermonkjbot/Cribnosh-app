
export async function onboardStaff(validatedData: any) {
  // Mattermost onboarding removed
  return { success: true, email: validatedData.email, mattermostUser: null };
} 