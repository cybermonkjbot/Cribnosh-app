/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Resend } from 'resend';
import {
  CardSection,
  ContentText,
  Divider,
  EmailWrapper,
  FooterSection,
  HeaderSection,
  PrimaryButton,
  SocialLinks,
} from './components';

interface PrelaunchEmailProps {
  user: {
    name: string;
    city?: string;
    perk?: string;
  };
  days_since_signup?: number | string;
  expected_launch_date?: string;
  days_to_launch?: number | string;
  featured_chef?: {
    name: string;
    cuisine: string;
  };
  unsubscribeUrl: string;
  companyAddress: string;
}

const socialLinks = [
  {
    href: 'https://x.com/CribNosh?t=YDYNvB1ZIaVe0IX5NDe9YQ&s=09',
    icon: 'https://cdn-icons-png.flaticon.com/512/733/733579.png',
    alt: 'X (Twitter)',
    label: 'X (Twitter)',
  },
  {
    href: 'https://www.instagram.com/cribnoshuk?igsh=MXM3NWxsOHpsbDB1bA==',
    icon: 'https://cdn-icons-png.flaticon.com/512/2111/2111463.png',
    alt: 'Instagram',
    label: 'Instagram',
  },
];

const footerLinks = [
  { href: 'emailUrls.support()', text: 'Support' },
  { href: 'emailUrls.faq()', text: 'FAQ' },
];

// 1. Welcome Email
export const PrelaunchWelcome = ({ user, unsubscribeUrl, companyAddress }: PrelaunchEmailProps) => (
  <EmailWrapper
    previewText={`Welcome to CribNosh, ${user.name}! Your taste adventure starts now.`}
    title="Welcome to CribNosh"
  >
    <HeaderSection title="You're officially on the guest list!" showLogo />
    <ContentText variant="large">Hi {user.name},</ContentText>
    <ContentText>
      Thanks for joining CribNosh early! You&apos;re not just a number, you&apos;re a founding foodie. We&apos;re building a platform where every meal is a vibe, every chef is a storyteller, and every bite is curated for you.
    </ContentText>
    <CardSection>
      <ContentText>
        Over the next few weeks, well share sneak peeks, chef stories, and exclusive perks. Stay tuned, your citys food scene is about to get a glow-up.
      </ContentText>
    </CardSection>
    <img
      src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80"
      alt="Welcome to CribNosh"
      style={{ width: '100%', borderRadius: '12px', margin: '24px 0' }}
    />
    <PrimaryButton href="emailUrls.chefs()">Meet the Chefs</PrimaryButton>
    <Divider />
    <SocialLinks links={socialLinks} />
    <FooterSection
      unsubscribeUrl={unsubscribeUrl}
      address={companyAddress}
      companyName="CribNosh"
      additionalLinks={footerLinks}
      showDivider
    />
  </EmailWrapper>
);

// 2. Sneak Peek Email
export const PrelaunchSneakPeek = ({ user, days_since_signup, unsubscribeUrl, companyAddress }: PrelaunchEmailProps) => (
  <EmailWrapper
    previewText={`A taste of whats coming to ${user.city || 'your city'}!`}
    title="Sneak Peek: Your Future Cravings"
  >
    <HeaderSection title="Sneak peek: Your future cravings, curated" showLogo />
    <ContentText variant="large">Hey {user.name},</ContentText>
    <ContentText>
      Its been {days_since_signup} days since you joined CribNosh, so heres a little amuse-bouche. Imagine: chef-led pop-ups, mood-based menus, and food that feels like home (or a wild adventure).
    </ContentText>
    <CardSection>
      <ContentText>
        Were working with local chefs to bring you experiences you wont find anywhere else. Want a preview?
      </ContentText>
    </CardSection>
    <img
      src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80"
      alt="Sneak Peek"
      style={{ width: '100%', borderRadius: '12px', margin: '24px 0' }}
    />
    <PrimaryButton href="emailUrls.experiences()">See Whats Cooking</PrimaryButton>
    <Divider />
    <ContentText align="center">Got a favorite dish or chef? Hit reply and tell us!</ContentText>
    <SocialLinks links={socialLinks} />
    <FooterSection
      unsubscribeUrl={unsubscribeUrl}
      address={companyAddress}
      companyName="CribNosh"
      additionalLinks={footerLinks}
      showDivider
    />
  </EmailWrapper>
);

// 3. Chef Feature / App Teaser
export const PrelaunchChefFeature = ({ user, featured_chef, unsubscribeUrl, companyAddress }: PrelaunchEmailProps) => (
  <EmailWrapper
    previewText={`Meet your new favorite chef, ${user.name}!`}
    title="Chef Spotlight: Local Flavor, Global Soul"
  >
    <HeaderSection title="Chef spotlight: Local flavor, global soul" showLogo />
    <ContentText variant="large">Hi {user.name},</ContentText>
    <ContentText>
      At CribNosh, we believe every chef has a story. This week, meet {featured_chef?.name || 'one of our chefs'}, whos bringing {featured_chef?.cuisine || 'amazing cuisine'} to {user.city || 'your city'}. Expect bold flavors, secret family recipes, and a dash of magic.
    </ContentText>
    <CardSection>
      <ContentText>
        Want to see how CribNosh will match you with experiences like this? Stay tuned for our app sneak peek!
      </ContentText>
    </CardSection>
    <img
      src="https://images.unsplash.com/photo-1526178613658-3f1622045557?auto=format&fit=crop&w=600&q=80"
      alt="Chef Feature"
      style={{ width: '100%', borderRadius: '12px', margin: '24px 0' }}
    />
    <PrimaryButton href="emailUrls.app()">Preview the App</PrimaryButton>
    <Divider />
    <SocialLinks links={socialLinks} />
    <FooterSection
      unsubscribeUrl={unsubscribeUrl}
      address={companyAddress}
      companyName="CribNosh"
      additionalLinks={footerLinks}
      showDivider
    />
  </EmailWrapper>
);

// 4. Brand Story / Behind the Scenes
export const PrelaunchBrandStory = ({ user, unsubscribeUrl, companyAddress }: PrelaunchEmailProps) => (
  <EmailWrapper
    previewText="The CribNosh story: Why were building this for you"
    title="Behind the Scenes: Food, Culture, and Community"
  >
    <HeaderSection title="Behind the scenes: Food, culture, and community" showLogo />
    <ContentText variant="large">Hey {user.name},</ContentText>
    <ContentText>
      We started CribNosh because we believe food is more than fuel, its connection, culture, and comfort. Our team is obsessed with finding the best local chefs and curating experiences that feel personal.
    </ContentText>
    <CardSection>
      <ContentText>
        Want to see how were building CribNosh for you? Check out our story.
      </ContentText>
    </CardSection>
    <img
      src="https://images.unsplash.com/photo-1464306076886-debca5e8a6b0?auto=format&fit=crop&w=600&q=80"
      alt="Brand Story"
      style={{ width: '100%', borderRadius: '12px', margin: '24px 0' }}
    />
    <PrimaryButton href="emailUrls.story()">Read Our Story</PrimaryButton>
    <Divider />
    <ContentText align="center">You&apos;re not just waiting, you&apos;re shaping what&apos;s next.</ContentText>
    <SocialLinks links={socialLinks} />
    <FooterSection
      unsubscribeUrl={unsubscribeUrl}
      address={companyAddress}
      companyName="CribNosh"
      additionalLinks={footerLinks}
      showDivider
    />
  </EmailWrapper>
);

// 5. Countdown / Incentive
export const PrelaunchCountdown = ({ user, days_to_launch, expected_launch_date, unsubscribeUrl, companyAddress }: PrelaunchEmailProps) => (
  <EmailWrapper
    previewText={`CribNosh launches in ${days_to_launch} days!`}
    title="The Countdown is On, Get Ready for Exclusive Perks"
  >
    <HeaderSection title="The countdown is on, get ready for exclusive perks" showLogo />
    <ContentText variant="large">Hi {user.name},</ContentText>
    <ContentText>
      Only {days_to_launch} days until CribNosh opens in {user.city || 'your city'}! As an early supporter, youll get first dibs on reservations and a special launch-day treat.
    </ContentText>
    <CardSection>
      <ContentText>
        Mark your calendar: {expected_launch_date}. We cant wait to serve you.
      </ContentText>
    </CardSection>
    <img
      src="https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=600&q=80"
      alt="Countdown"
      style={{ width: '100%', borderRadius: '12px', margin: '24px 0' }}
    />
    <PrimaryButton href="emailUrls.launch()">Add to Calendar</PrimaryButton>
    <Divider />
    <ContentText align="center">Questions? Just reply, real humans here.</ContentText>
    <SocialLinks links={socialLinks} />
    <FooterSection
      unsubscribeUrl={unsubscribeUrl}
      address={companyAddress}
      companyName="CribNosh"
      additionalLinks={footerLinks}
      showDivider
    />
  </EmailWrapper>
);

// 6. Launch Day
export const PrelaunchLaunchDay = ({ user, unsubscribeUrl, companyAddress }: PrelaunchEmailProps) => (
  <EmailWrapper
    previewText={`CribNosh is live! Your tables waiting, ${user.name}`}
    title="You're In! Welcome to the New Food Frontier"
  >
    <HeaderSection title="You're in! Welcome to the new food frontier" showLogo />
    <ContentText variant="large">{user.name}, its go time.</ContentText>
    <ContentText>
      CribNosh is officially live in {user.city || 'your city'}! Log in, explore chef-led experiences, and book your first meal. As promised, heres your exclusive early-access perk: {user.perk || 'a special treat'}.
    </ContentText>
    <CardSection>
      <ContentText>
        Lets make food memories together.
      </ContentText>
    </CardSection>
    <img
      src="https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=600&q=80"
      alt="Launch Day"
      style={{ width: '100%', borderRadius: '12px', margin: '24px 0' }}
    />
    <PrimaryButton href="emailUrls.book()">Book Your First Experience</PrimaryButton>
    <Divider />
    <ContentText align="center">Thank you for believing in CribNosh. See you at the table!</ContentText>
    <SocialLinks links={socialLinks} />
    <FooterSection
      unsubscribeUrl={unsubscribeUrl}
      address={companyAddress}
      companyName="CribNosh"
      additionalLinks={footerLinks}
      showDivider
    />
  </EmailWrapper>
);

// 7. Community Invitation
export const PrelaunchCommunityInvite = ({ user, unsubscribeUrl, companyAddress }: PrelaunchEmailProps) => (
  <EmailWrapper
    previewText={`Join the CribNosh community, ${user.name}!`}
    title="You're Invited: CribNosh Community"
  >
    <HeaderSection title="You're invited!" showLogo />
    <ContentText variant="large">Hey {user.name},</ContentText>
    <ContentText>
      Were building more than an app, were building a movement. Join our private community to connect with fellow food lovers, get early event invites, and help shape CribNosh from the inside.
    </ContentText>
    <CardSection>
      <ContentText>
        Ready to meet your new foodie fam?
      </ContentText>
    </CardSection>
    <img
      src="https://images.unsplash.com/photo-1515168833906-d2a3b82b3029?auto=format&fit=crop&w=600&q=80"
      alt="Community Invitation"
      style={{ width: '100%', borderRadius: '12px', margin: '24px 0' }}
    />
    <PrimaryButton href="emailUrls.community()">Join the Community</PrimaryButton>
    <Divider />
    <ContentText align="center">See you inside!</ContentText>
    <SocialLinks links={socialLinks} />
    <FooterSection unsubscribeUrl={unsubscribeUrl} address={companyAddress} companyName="CribNosh" additionalLinks={footerLinks} showDivider />
  </EmailWrapper>
);

// 8. User Story/Spotlight
export const PrelaunchUserSpotlight = ({ user, unsubscribeUrl, companyAddress }: PrelaunchEmailProps) => (
  <EmailWrapper
    previewText={`Meet a fellow CribNosh early adopter!`}
    title="Foodie Spotlight: Community Stories"
  >
    <HeaderSection title="Foodie spotlight: Community stories" showLogo />
    <ContentText variant="large">Hey {user.name},</ContentText>
    <ContentText>
      Every CribNosh member has a story. This week, meet one of your fellow early adopters and see how food brings us all together. Want to be featured? Reply and share your story!
    </ContentText>
    <CardSection>
      <ContentText>
        Food is connection. Lets celebrate it, together.
      </ContentText>
    </CardSection>
    <img
      src="https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80"
      alt="User Spotlight"
      style={{ width: '100%', borderRadius: '12px', margin: '24px 0' }}
    />
    <PrimaryButton href="emailUrls.stories()">See More Stories</PrimaryButton>
    <Divider />
    <ContentText align="center">Want to be featured? Just reply!</ContentText>
    <SocialLinks links={socialLinks} />
    <FooterSection unsubscribeUrl={unsubscribeUrl} address={companyAddress} companyName="CribNosh" additionalLinks={footerLinks} showDivider />
  </EmailWrapper>
);

// 9. Feedback Request
export const PrelaunchFeedbackRequest = ({ user, unsubscribeUrl, companyAddress }: PrelaunchEmailProps) => (
  <EmailWrapper
    previewText={`We want your feedback, ${user.name}!`}
    title="Help Shape CribNosh"
  >
    <HeaderSection title="We want your feedback!" showLogo />
    <ContentText variant="large">Hi {user.name},</ContentText>
    <ContentText>
      You&apos;re an early voice in our community. What features, foods, or experiences do you want to see? Your feedback will help us build something truly special.
    </ContentText>
    <CardSection>
      <ContentText>
        Take 2 minutes to share your thoughts and help shape CribNosh.
      </ContentText>
    </CardSection>
    <img
      src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80"
      alt="Feedback Request"
      style={{ width: '100%', borderRadius: '12px', margin: '24px 0' }}
    />
    <PrimaryButton href="emailUrls.feedback()">Give Feedback</PrimaryButton>
    <Divider />
    <ContentText align="center">We read every response. Thank you!</ContentText>
    <SocialLinks links={socialLinks} />
    <FooterSection unsubscribeUrl={unsubscribeUrl} address={companyAddress} companyName="CribNosh" additionalLinks={footerLinks} showDivider />
  </EmailWrapper>
);

// 10. Local Food Guide
export const PrelaunchLocalGuide = ({ user, unsubscribeUrl, companyAddress }: PrelaunchEmailProps) => (
  <EmailWrapper
    previewText={`Hidden food gems in ${user.city || 'your city'}!`}
    title="Your Local Food Guide"
  >
    <HeaderSection title={`Hidden gems in ${user.city || 'your city'}`} showLogo />
    <ContentText variant="large">Hey {user.name},</ContentText>
    <ContentText>
      While you wait for CribNosh, heres a curated guide to some of the best under-the-radar eats in {user.city || 'your city'}. Got a favorite spot? Let us know and well add it!
    </ContentText>
    <CardSection>
      <ContentText>
        Food is better when its shared. Explore, taste, and tell us what you find!
      </ContentText>
    </CardSection>
    <img
      src="https://images.unsplash.com/photo-1504674900247-ec6b0b1b6c83?auto=format&fit=crop&w=600&q=80"
      alt="Local Food Guide"
      style={{ width: '100%', borderRadius: '12px', margin: '24px 0' }}
    />
    <PrimaryButton href="emailUrls.guide()">See the Guide</PrimaryButton>
    <Divider />
    <ContentText align="center">Share your favorite with us!</ContentText>
    <SocialLinks links={socialLinks} />
    <FooterSection unsubscribeUrl={unsubscribeUrl} address={companyAddress} companyName="CribNosh" additionalLinks={footerLinks} showDivider />
  </EmailWrapper>
);

// 11. First Look (Feature/Chef)
export const PrelaunchFirstLook = ({ user, unsubscribeUrl, companyAddress }: PrelaunchEmailProps) => (
  <EmailWrapper
    previewText={`First look: Something new is coming to CribNosh!`}
    title="First Look: New Features & Chefs"
  >
    <HeaderSection title="First look: New features & chefs" showLogo />
    <ContentText variant="large">Hi {user.name},</ContentText>
    <ContentText>
      Were always cooking up something new. Heres a sneak peek at a feature or chef partnership coming soon. Stay tuned for more ways to explore, connect, and taste.
    </ContentText>
    <CardSection>
      <ContentText>
        Want to be the first to try? Keep an eye on your inbox!
      </ContentText>
    </CardSection>
    <img
      src="https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=600&q=80"
      alt="First Look"
      style={{ width: '100%', borderRadius: '12px', margin: '24px 0' }}
    />
    <PrimaryButton href="emailUrls.firstLook()">See Whats New</PrimaryButton>
    <Divider />
    <SocialLinks links={socialLinks} />
    <FooterSection unsubscribeUrl={unsubscribeUrl} address={companyAddress} companyName="CribNosh" additionalLinks={footerLinks} showDivider />
  </EmailWrapper>
);

// 12. Refer a Friend
export const PrelaunchReferral = ({ user, unsubscribeUrl, companyAddress }: PrelaunchEmailProps) => (
  <EmailWrapper
    previewText={`Share the love, invite a friend to CribNosh!`}
    title="Refer a Friend: Spread the Flavor"
  >
    <HeaderSection title="Share the love, refer a friend!" showLogo />
    <ContentText variant="large">Hey {user.name},</ContentText>
    <ContentText>
      Good food is better with friends. Invite someone to join CribNosh and youll both get a tasty reward when they sign up. Sharing is caring (and delicious)!
    </ContentText>
    <CardSection>
      <ContentText>
        Your unique invite link: <b>emailUrls.home()/invite/{user.name?.toLowerCase() || 'yourname'}</b>
      </ContentText>
    </CardSection>
    <img
      src="https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80"
      alt="Refer a Friend"
      style={{ width: '100%', borderRadius: '12px', margin: '24px 0' }}
    />
    <PrimaryButton href={`emailUrls.home()/invite/${user.name?.toLowerCase() || 'yourname'}`}>Invite a Friend</PrimaryButton>
    <Divider />
    <ContentText align="center">Thanks for spreading the word!</ContentText>
    <SocialLinks links={socialLinks} />
    <FooterSection unsubscribeUrl={unsubscribeUrl} address={companyAddress} companyName="CribNosh" additionalLinks={footerLinks} showDivider />
  </EmailWrapper>
);

// 13. Your Taste Profile
export const PrelaunchTasteProfile = ({ user, unsubscribeUrl, companyAddress }: PrelaunchEmailProps) => (
  <EmailWrapper
    previewText={`Your taste profile is ready, ${user.name}!`}
    title="Your Taste Profile"
  >
    <HeaderSection title="Your taste profile is ready!" showLogo />
    <ContentText variant="large">Hi {user.name},</ContentText>
    <ContentText>
      Weve crunched the numbers (and the snacks). Heres a peek at your personalized taste profile. Use it to discover new chefs and experiences that match your vibe.
    </ContentText>
    <CardSection>
      <ContentText>
        Want to update your preferences? Click below to edit your profile.
      </ContentText>
    </CardSection>
    <img
      src="https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=600&q=80"
      alt="Taste Profile"
      style={{ width: '100%', borderRadius: '12px', margin: '24px 0' }}
    />
    <PrimaryButton href="emailUrls.profile()">View Your Profile</PrimaryButton>
    <Divider />
    <ContentText align="center">Your taste, your way.</ContentText>
    <SocialLinks links={socialLinks} />
    <FooterSection unsubscribeUrl={unsubscribeUrl} address={companyAddress} companyName="CribNosh" additionalLinks={footerLinks} showDivider />
  </EmailWrapper>
);

// 14. How It Works
export const PrelaunchHowItWorks = ({ user, unsubscribeUrl, companyAddress }: PrelaunchEmailProps) => (
  <EmailWrapper
    previewText="How CribNosh works: A quick guide"
    title="How It Works: CribNosh 101"
  >
    <HeaderSection title="How it works: CribNosh 101" showLogo />
    <ContentText variant="large">Hey {user.name},</ContentText>
    <ContentText>
      Heres a quick guide to how CribNosh brings you chef-led, emotion-based dining. From sign-up to your first meal, weve made it easy (and fun) to explore, book, and enjoy.
    </ContentText>
    <CardSection>
      <ContentText>
        Ready to see how it all comes together? Dive in below!
      </ContentText>
    </CardSection>
    <img
      src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80"
      alt="How It Works"
      style={{ width: '100%', borderRadius: '12px', margin: '24px 0' }}
    />
    <PrimaryButton href="emailUrls.howItWorks()">See How It Works</PrimaryButton>
    <Divider />
    <ContentText align="center">Still have questions? Just reply!</ContentText>
    <SocialLinks links={socialLinks} />
    <FooterSection unsubscribeUrl={unsubscribeUrl} address={companyAddress} companyName="CribNosh" additionalLinks={footerLinks} showDivider />
  </EmailWrapper>
);

// 15. Were Listening (Feedback Impact)
export const PrelaunchFeedbackImpact = ({ user, unsubscribeUrl, companyAddress }: PrelaunchEmailProps) => (
  <EmailWrapper
    previewText="You spoke, we listened, see whats new!"
    title="Were Listening: Your Feedback in Action"
  >
    <HeaderSection title="Were listening: Your feedback in action" showLogo />
    <ContentText variant="large">Hi {user.name},</ContentText>
    <ContentText>
      Your feedback is shaping CribNosh. Heres what weve changed or added based on what you and others have told us. Keep the ideas coming, were building this together!
    </ContentText>
    <CardSection>
      <ContentText>
        Want to see your idea in the app? Reply and let us know!
      </ContentText>
    </CardSection>
    <img
      src="https://images.unsplash.com/photo-1465101178521-c1a9136a3b41?auto=format&fit=crop&w=600&q=80"
      alt="Feedback Impact"
      style={{ width: '100%', borderRadius: '12px', margin: '24px 0' }}
    />
    <PrimaryButton href="emailUrls.updates()">See Whats New</PrimaryButton>
    <Divider />
    <ContentText align="center">Thank you for helping us grow!</ContentText>
    <SocialLinks links={socialLinks} />
    <FooterSection unsubscribeUrl={unsubscribeUrl} address={companyAddress} companyName="CribNosh" additionalLinks={footerLinks} showDivider />
  </EmailWrapper>
);

// 16. Milestone/Celebration
export const PrelaunchMilestone = ({ user, unsubscribeUrl, companyAddress }: PrelaunchEmailProps) => (
  <EmailWrapper
    previewText="We hit a milestone, thanks to you!"
    title="Milestone: Lets Celebrate Together"
  >
    <HeaderSection title="Milestone: Lets celebrate together!" showLogo />
    <ContentText variant="large">Hey {user.name},</ContentText>
    <ContentText>
      We just hit a major milestone, thanks to you and our amazing community! Whether its new users, new chefs, or a new city, we couldnt have done it without you.
    </ContentText>
    <CardSection>
      <ContentText>
        Celebrate with us and see whats next for CribNosh.
      </ContentText>
    </CardSection>
    <img
      src="https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80"
      alt="Milestone Celebration"
      style={{ width: '100%', borderRadius: '12px', margin: '24px 0' }}
    />
    <PrimaryButton href="emailUrls.celebrate()">Celebrate With Us</PrimaryButton>
    <Divider />
    <ContentText align="center">Heres to more delicious moments together!</ContentText>
    <SocialLinks links={socialLinks} />
    <FooterSection unsubscribeUrl={unsubscribeUrl} address={companyAddress} companyName="CribNosh" additionalLinks={footerLinks} showDivider />
  </EmailWrapper>
);

// Utility to render a React email template to HTML
function renderEmailToHtml(
  Component: React.FC<PrelaunchEmailProps>,
  props: PrelaunchEmailProps
): string {
  return renderToStaticMarkup(<Component {...props} />);
}

// List of all prelaunch email templates and their subjects
const prelaunchEmailTemplates = [
  {
    key: 'welcome',
    subject: 'Welcome to CribNosh',
    component: PrelaunchWelcome,
  },
  {
    key: 'sneak_peek',
    subject: 'Sneak Peek: Your Future Cravings',
    component: PrelaunchSneakPeek,
  },
  {
    key: 'chef_feature',
    subject: 'Chef Spotlight: Local Flavor, Global Soul',
    component: PrelaunchChefFeature,
  },
  {
    key: 'brand_story',
    subject: 'Behind the Scenes: Food, Culture, and Community',
    component: PrelaunchBrandStory,
  },
  {
    key: 'countdown',
    subject: 'The Countdown is On, Get Ready for Exclusive Perks',
    component: PrelaunchCountdown,
  },
  {
    key: 'launch_day',
    subject: 'You\'re In! Welcome to the New Food Frontier',
    component: PrelaunchLaunchDay,
  },
  {
    key: 'community_invite',
    subject: 'You\'re Invited: CribNosh Community',
    component: PrelaunchCommunityInvite,
  },
  {
    key: 'user_spotlight',
    subject: 'Foodie Spotlight: Community Stories',
    component: PrelaunchUserSpotlight,
  },
  {
    key: 'feedback_request',
    subject: 'Help Shape CribNosh',
    component: PrelaunchFeedbackRequest,
  },
  {
    key: 'local_guide',
    subject: 'Your Local Food Guide',
    component: PrelaunchLocalGuide,
  },
  {
    key: 'first_look',
    subject: 'First Look: New Features & Chefs',
    component: PrelaunchFirstLook,
  },
  {
    key: 'referral',
    subject: 'Refer a Friend: Spread the Flavor',
    component: PrelaunchReferral,
  },
  {
    key: 'taste_profile',
    subject: 'Your Taste Profile',
    component: PrelaunchTasteProfile,
  },
  {
    key: 'how_it_works',
    subject: 'How It Works: CribNosh 101',
    component: PrelaunchHowItWorks,
  },
  {
    key: 'feedback_impact',
    subject: 'Were Listening: Your Feedback in Action',
    component: PrelaunchFeedbackImpact,
  },
  {
    key: 'milestone',
    subject: 'Milestone: Lets Celebrate Together',
    component: PrelaunchMilestone,
  },
];

// Function to send all prelaunch emails as broadcasts via Resend
export async function sendAllPrelaunchBroadcasts({
  resendApiKey,
  audienceId,
  from,
  defaultProps,
}: {
  resendApiKey: string;
  audienceId: string;
  from: string;
  defaultProps: Omit<PrelaunchEmailProps, 'user'>;
}) {
  const resend = new Resend(resendApiKey);

  for (const template of prelaunchEmailTemplates) {
    // Use Resend's template variables for personalization
    const user = {
      name: '{{{FIRST_NAME|there}}}',
      city: '{{{CITY}}}',
      perk: '{{{PERK}}}',
    };

    // Compose props for the template
    const props = {
      ...defaultProps,
      user,
      // Add other variables as needed for each template
      days_since_signup: '{{{DAYS_SINCE_SIGNUP}}}',
      expected_launch_date: '{{{EXPECTED_LAUNCH_DATE}}}',
      days_to_launch: '{{{DAYS_TO_LAUNCH}}}',
      featured_chef: {
        name: '{{{CHEF_NAME}}}',
        cuisine: '{{{CHEF_CUISINE}}}',
      },
      // unsubscribeUrl and companyAddress are handled by Resend
      unsubscribeUrl: '{{{RESEND_UNSUBSCRIBE_URL}}}',
      companyAddress: '{{{COMPANY_ADDRESS}}}',
    };

    const html = renderEmailToHtml(template.component, props);

    await resend.broadcasts.create({
      audienceId,
      from,
      subject: template.subject,
      html,
    });
  }
}

// Utility to send a single prelaunch email broadcast by key
export async function sendPrelaunchBroadcastByKey({
  key,
  resendApiKey,
  audienceId,
  from,
  defaultProps,
}: {
  key: string;
  resendApiKey: string;
  audienceId: string;
  from: string;
  defaultProps: Omit<PrelaunchEmailProps, 'user'>;
}) {
  const template = prelaunchEmailTemplates.find(t => t.key === key);
  if (!template) throw new Error(`No template found for key: ${key}`);

  const resend = new Resend(resendApiKey);

  // Use Resend's template variables for personalization
  const user = {
    name: '{{{FIRST_NAME|there}}}',
    city: '{{{CITY}}}',
    perk: '{{{PERK}}}',
  };

  const props = {
    ...defaultProps,
    user,
    days_since_signup: '{{{DAYS_SINCE_SIGNUP}}}',
    expected_launch_date: '{{{EXPECTED_LAUNCH_DATE}}}',
    days_to_launch: '{{{DAYS_TO_LAUNCH}}}',
    featured_chef: {
      name: '{{{CHEF_NAME}}}',
      cuisine: '{{{CHEF_CUISINE}}}',
    },
    unsubscribeUrl: '{{{RESEND_UNSUBSCRIBE_URL}}}',
    companyAddress: '{{{COMPANY_ADDRESS}}}',
  };

  const html = renderEmailToHtml(template.component, props);

  await resend.broadcasts.create({
    audienceId,
    from,
    subject: template.subject,
    html,
  });
}

// Utility to preview all prelaunch emails as HTML (for debugging/review)
export function previewAllPrelaunchEmails({
  userOverrides = {},
  otherProps = {},
}: {
  userOverrides?: Partial<PrelaunchEmailProps['user']>;
  otherProps?: Partial<Omit<PrelaunchEmailProps, 'user'>>;
} = {}) {
  const previews: { key: string; subject: string; html: string }[] = [];
  for (const template of prelaunchEmailTemplates) {
    const user = {
      name: 'Test User',
      city: 'Sample City',
      perk: 'Free Dessert',
      ...userOverrides,
    };
    const props = {
      user,
      days_since_signup: 5,
      expected_launch_date: '2026-07-01',
      days_to_launch: 10,
      featured_chef: {
        name: 'Chef Sample',
        cuisine: 'Fusion',
      },
      unsubscribeUrl: 'emailUrls.unsubscribe()',
      companyAddress: '123 Food St, Flavor Town',
      ...otherProps,
    };
    const html = renderEmailToHtml(template.component, props);
    previews.push({ key: template.key, subject: template.subject, html });
  }
  return previews;
}

// Utility to preview a single prelaunch email by key
export function previewPrelaunchEmailByKey(
  key: string,
  {
    userOverrides = {},
    otherProps = {},
  }: {
    userOverrides?: Partial<PrelaunchEmailProps['user']>;
    otherProps?: Partial<Omit<PrelaunchEmailProps, 'user'>>;
  } = {}
): { subject: string; html: string } | undefined {
  const template = prelaunchEmailTemplates.find(t => t.key === key);
  if (!template) return undefined;
  const user = {
    name: 'Test User',
    city: 'Sample City',
    perk: 'Free Dessert',
    ...userOverrides,
  };
  const props = {
    user,
    days_since_signup: 5,
    expected_launch_date: '2026-07-01',
    days_to_launch: 10,
    featured_chef: {
      name: 'Chef Sample',
      cuisine: 'Fusion',
    },
    unsubscribeUrl: 'emailUrls.unsubscribe()',
    companyAddress: '123 Food St, Flavor Town',
    ...otherProps,
  };
  const html = renderEmailToHtml(template.component, props);
  return { subject: template.subject, html };
}

// Optionally export the templates list for external use
export { prelaunchEmailTemplates };

// Example usage (do not commit API keys!)
// await sendAllPrelaunchBroadcasts({
//   resendApiKey: 're_xxxxxxxxx',
//   audienceId: '78261eea-8f8b-4381-83c6-79fa7120f1cf',
//   from: 'CribNosh <onboarding@cribnosh.com>',
//   defaultProps: {},
// });

