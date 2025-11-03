/**
 * Email URL utilities for consistent URL generation across all email templates
 */

const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_BASE_URL || 'https://cribnosh.com';
};

export const emailUrls = {
  // Base URL
  base: getBaseUrl(),
  
  // Main pages
  home: () => `${getBaseUrl()}`,
  support: () => `${getBaseUrl()}/support`,
  faq: () => `${getBaseUrl()}/faq`,
  privacy: () => `${getBaseUrl()}/privacy`,
  terms: () => `${getBaseUrl()}/terms`,
  unsubscribe: () => `${getBaseUrl()}/unsubscribe`,
  
  // User actions
  order: () => `${getBaseUrl()}/order`,
  track: () => `${getBaseUrl()}/track`,
  profile: () => `${getBaseUrl()}/profile`,
  reviews: () => `${getBaseUrl()}/reviews`,
  orders: () => `${getBaseUrl()}/orders`,
  
  // Features
  chefs: () => `${getBaseUrl()}/chefs`,
  creators: () => `${getBaseUrl()}/creators`,
  rewards: () => `${getBaseUrl()}/rewards`,
  events: () => `${getBaseUrl()}/events`,
  recipes: () => `${getBaseUrl()}/recipes`,
  status: () => `${getBaseUrl()}/status`,
  
  // App features
  app: () => `${getBaseUrl()}/app`,
  experiences: () => `${getBaseUrl()}/experiences`,
  story: () => `${getBaseUrl()}/story`,
  launch: () => `${getBaseUrl()}/launch`,
  book: () => `${getBaseUrl()}/book`,
  community: () => `${getBaseUrl()}/community`,
  stories: () => `${getBaseUrl()}/stories`,
  feedback: () => `${getBaseUrl()}/feedback`,
  guide: () => `${getBaseUrl()}/guide`,
  firstLook: () => `${getBaseUrl()}/first-look`,
  howItWorks: () => `${getBaseUrl()}/how-it-works`,
  updates: () => `${getBaseUrl()}/updates`,
  celebrate: () => `${getBaseUrl()}/celebrate`,
  
  // Dynamic URLs
  invite: (name: string) => `${getBaseUrl()}/invite/${name.toLowerCase()}`,
  orderItem: (itemName: string) => `${getBaseUrl()}/order/${itemName.toLowerCase().replace(/\s+/g, '-')}`,
  redeemReward: (rewardId: string) => `${getBaseUrl()}/rewards/redeem/${rewardId}`,
  
  // Social links
  social: {
    twitter: 'https://twitter.com/cribnosh',
    instagram: 'https://instagram.com/cribnosh',
    website: () => getBaseUrl(),
  },
  
  // External services
  external: {
    huly: 'https://app.huly.io',
  }
};

// Legacy function for backward compatibility
export const getEmailUrl = (path: string = '') => {
  const baseUrl = getBaseUrl();
  return path ? `${baseUrl}/${path.replace(/^\//, '')}` : baseUrl;
};
