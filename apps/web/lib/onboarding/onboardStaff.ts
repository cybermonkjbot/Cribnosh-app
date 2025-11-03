import { mattermostService } from '@/lib/mattermost';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

export async function onboardStaff(validatedData: any) {
  // --- MATTERMOST USER SETUP ---
  // Generate a username and password (for demo: use email prefix and random string)
  const username = validatedData.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const password = Math.random().toString(36).slice(-10) + 'Aa1!'; // Simple random password, should be improved
  let mattermostUser = null;
  try {
    // Try to create the user (if already exists, Mattermost will error)
    mattermostUser = await mattermostService.createUser({
      email: validatedData.email,
      username,
      password,
      first_name: validatedData.firstName,
      last_name: validatedData.lastName,
    });
    // If user already exists, try to fetch their user ID
    if (!mattermostUser) {
      // Try to find user by email (GET /api/v4/users/email/{email})
      const res = await fetch(`${process.env.MATTERMOST_SERVER_URL}/api/v4/users/email/${encodeURIComponent(validatedData.email)}`, {
        headers: { 'Authorization': `Bearer ${process.env.MATTERMOST_BOT_TOKEN}` },
      });
      if (res.ok) {
        mattermostUser = await res.json();
      }
    }
    if (mattermostUser && mattermostUser.id) {
      // Add user to default team
      await mattermostService.addUserToTeam(mattermostUser.id);
      // Add user to default channel
      await mattermostService.addUserToChannel(mattermostUser.id);
      // Set custom Mattermost theme
      // const sampleTheme = {
      //   sidebarBg: '#1A1A1A',
      //   sidebarText: '#FFFFFF',
      //   sidebarUnreadText: '#F99104',
      //   sidebarTextActiveBorder: '#F99104',
      //   sidebarTextActiveColor: '#F99104',
      //   sidebarHeaderBg: '#23272A',
      //   sidebarHeaderTextColor: '#F99104',
      //   onlineIndicator: '#43B581',
      //   awayIndicator: '#F99104',
      //   dndIndicator: '#F04747',
      //   mentionBg: '#F99104',
      //   mentionBj: '#F99104',
      //   mentionColor: '#FFFFFF',
      //   centerChannelBg: '#18191C',
      //   centerChannelText: '#FFFFFF',
      //   newMessageSeparator: '#F99104',
      //   linkColor: '#F99104',
      //   buttonBg: '#F99104',
      //   buttonColor: '#FFFFFF',
      //   errorTextColor: '#F04747',
      //   mentionHighlightBg: '#F99104',
      //   mentionHighlightLink: '#F99104',
      //   codeTheme: 'monokai',
      // };
      // const themeSet = await mattermostService.setUserTheme(mattermostUser.id, sampleTheme);
      // if (!themeSet) {
      //   console.error('Failed to set Mattermost theme for user:', validatedData.email);
      // }
      // Store Mattermost user ID in DB
      try {
        const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || 'http://localhost:3000');
        try {
          await convex.mutation(api.mutations.users.updateMattermostStatus, {
            email: validatedData.email,
            mattermostActive: true,
            mattermostProfile: mattermostUser,
            mattermostUserId: mattermostUser.id,
          });
        } catch (err) {
          if (err instanceof Error && err.message && err.message.includes('User not found')) {
            // Create minimal user and retry
            await convex.mutation(api.mutations.users.createMinimalUser, {
              name: `${validatedData.firstName} ${validatedData.lastName}`,
              email: validatedData.email,
            });
            await convex.mutation(api.mutations.users.updateMattermostStatus, {
              email: validatedData.email,
              mattermostActive: true,
              mattermostProfile: mattermostUser,
              mattermostUserId: mattermostUser.id,
            });
          } else {
            throw err;
          }
        }
      } catch (err) {
        console.error('Failed to update Mattermost user ID in DB:', validatedData.email, err);
      }
    } else {
      console.error('Failed to create or find Mattermost user for onboarding:', validatedData.email);
    }
  } catch (err) {
    console.error('Mattermost user setup error:', validatedData.email, err);
  }
  // --- END MATTERMOST USER SETUP ---
  return { success: true, email: validatedData.email, mattermostUser };
} 