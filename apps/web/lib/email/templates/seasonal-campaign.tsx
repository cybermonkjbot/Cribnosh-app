import React from 'react';
import { emailUrls } from '../utils/urls';
import {
  Html,
  Head,
  Preview,
  Container,
  Section,
  Row,
  Column,
} from '@react-email/components';
import {
  EmailWrapper,
  ProfessionalHeader,
  ContentText,
  EmailButton,
  FooterSection,
  FeatureCard,
  CallToActionSection,
  SocialLinks,
  colors,
  spacing,
  typography,
  CountdownTimer,
  StatsHighlight,
  Alert,
  InteractiveButton,
  SocialProof,
  ProgressBar,
} from './components';

interface SeasonalCampaignEmailProps {
  campaignName: string;
  season: 'spring' | 'summer' | 'fall' | 'winter' | 'holiday' | 'special';
  customerName: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundImage?: string;
    icon: string;
  };
  offer: {
    title: string;
    description: string;
    discount: number;
    code?: string;
    expiryDate: string;
    minOrder?: number;
  };
  featuredItems: Array<{
    name: string;
    description: string;
    price: number;
    originalPrice?: number;
    image: string;
    chef: string;
    cuisine: string;
    rating: number;
    limitedTime?: boolean;
  }>;
  seasonalRecipes: Array<{
    name: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    time: string;
    image: string;
  }>;
  events: Array<{
    name: string;
    date: string;
    description: string;
    location?: string;
    virtual?: boolean;
  }>;
  socialChallenges: Array<{
    name: string;
    description: string;
    hashtag: string;
    prize: string;
    endDate: string;
  }>;
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
  { href: 'emailUrls.events()', text: 'Events' },
  { href: 'emailUrls.recipes()', text: 'Recipes' },
];

export const SeasonalCampaignEmail: React.FC<SeasonalCampaignEmailProps> = ({
  campaignName,
  season,
  customerName,
  theme,
  offer,
  featuredItems,
  seasonalRecipes,
  events,
  socialChallenges,
  unsubscribeUrl,
  companyAddress,
}) => {
  const getSeasonalGreeting = () => {
    switch (season) {
      case 'spring': return 'Spring is here!';
      case 'summer': return 'Summer vibes!';
      case 'fall': return 'Fall flavors!';
      case 'winter': return 'Winter warmth!';
      case 'holiday': return 'Holiday cheer!';
      case 'special': return 'Special celebration!';
      default: return 'Seasonal special!';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return colors.success;
      case 'medium': return colors.warning;
      case 'hard': return colors.error;
      default: return colors.textMuted;
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '●';
      case 'medium': return '●';
      case 'hard': return '●';
      default: return '●';
    }
  };

  return (
    <Html>
      <Head />
      <Preview>{campaignName} - {getSeasonalGreeting()}</Preview>
      <EmailWrapper
        previewText={`${campaignName} - ${getSeasonalGreeting()}`}
        title={campaignName}
        backgroundColor={theme.secondaryColor}
      >
        <ProfessionalHeader
          title={`${theme.icon} ${campaignName}`}
          subtitle={getSeasonalGreeting()}
          showLogo
          backgroundColor={theme.primaryColor}
        />

        <Section style={{ padding: `${spacing['2xl']} ${spacing.xl}` }}>
          <ContentText variant="large" color="text">
            Hi {customerName}!
          </ContentText>

          <ContentText>
            {getSeasonalGreeting()} We're excited to bring you this special {season} campaign with 
            amazing offers, seasonal recipes, and exclusive events just for our community.
          </ContentText>

          {/* Countdown Timer */}
          <CountdownTimer
            targetDate={offer.expiryDate}
            label="Offer expires in"
          />

          {/* Main Offer */}
          <StatsHighlight
            value={`${offer.discount}% OFF`}
            label={offer.title}
            description={offer.description}
            color={theme.primaryColor}
          />

          {offer.code && (
            <Alert variant="success" title="Your Exclusive Code">
              <div style={{ textAlign: 'center', marginTop: spacing.sm }}>
                <ContentText style={{ ...typography.body.medium, fontWeight: '600', margin: '0 0 8px 0' }}>
                  Use code: <span style={{ 
                    backgroundColor: theme.primaryColor, 
                    color: colors.background, 
                    padding: '4px 12px', 
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '18px'
                  }}>
                    {offer.code}
                  </span>
                </ContentText>
                {offer.minOrder && (
                  <ContentText style={{ ...typography.body.small, color: colors.textMuted, margin: '0' }}>
                    Minimum order: ${offer.minOrder}
                  </ContentText>
                )}
              </div>
            </Alert>
          )}

          {/* Featured Items */}
          <ContentText style={{ ...typography.heading.h3, textAlign: 'center', margin: `${spacing.xl} 0 ${spacing.lg} 0` }}>
            Featured {season.charAt(0).toUpperCase() + season.slice(1)} Items
          </ContentText>
          
          <Row style={{ marginBottom: spacing.lg }}>
            {featuredItems.slice(0, 2).map((item, index) => (
              <Column key={index} style={{ width: '50%', padding: '0 8px' }}>
                <FeatureCard
                  icon={item.image}
                  title={item.name}
                  description={`${item.cuisine} by ${item.chef}`}
                  highlight={item.limitedTime}
                >
                  <div style={{ marginTop: spacing.md }}>
                    <ContentText style={{ ...typography.body.small, margin: '0 0 8px 0' }}>
                      {item.description}
                    </ContentText>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
                      <div>
                        <ContentText style={{ ...typography.body.medium, fontWeight: '600', color: theme.primaryColor, margin: '0' }}>
                          ${item.price}
                        </ContentText>
                        {item.originalPrice && (
                          <ContentText style={{ ...typography.body.small, color: colors.textMuted, textDecoration: 'line-through', margin: '0' }}>
                            ${item.originalPrice}
                          </ContentText>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '14px' }}>★</span>
                          <ContentText style={{ ...typography.body.small, margin: '0' }}>
                            {item.rating}
                          </ContentText>
                        </div>
                        {item.limitedTime && (
                          <ContentText style={{ ...typography.body.xs, color: colors.error, fontWeight: '600', margin: '0' }}>
                            LIMITED TIME
                          </ContentText>
                        )}
                      </div>
                    </div>
                    <InteractiveButton
                      href={`emailUrls.order()/${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                      variant="primary"
                      size="small"
                      fullWidth
                      trackingId={`featured_item_${index}`}
                    >
                      Order Now
                    </InteractiveButton>
                  </div>
                </FeatureCard>
              </Column>
            ))}
          </Row>

          {/* Seasonal Recipes */}
          <FeatureCard
            icon="Chef"
            title={`${season.charAt(0).toUpperCase() + season.slice(1)} Recipe Collection`}
            description="Try these seasonal recipes at home"
            highlight
          >
            <div style={{ marginTop: spacing.md }}>
              {seasonalRecipes.map((recipe, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: spacing.sm,
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: '8px',
                  marginBottom: spacing.sm,
                }}>
                  <img
                    src={recipe.image}
                    alt={recipe.name}
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                      marginRight: spacing.sm,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <ContentText style={{ ...typography.body.small, fontWeight: '600', margin: '0 0 4px 0' }}>
                      {recipe.name}
                    </ContentText>
                    <ContentText style={{ ...typography.body.xs, color: colors.textMuted, margin: '0 0 4px 0' }}>
                      {recipe.description}
                    </ContentText>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                      <span style={{ fontSize: '12px' }}>
                        {getDifficultyIcon(recipe.difficulty)}
                      </span>
                      <ContentText style={{ 
                        ...typography.body.xs, 
                        color: getDifficultyColor(recipe.difficulty),
                        margin: '0',
                        textTransform: 'capitalize'
                      }}>
                        {recipe.difficulty}
                      </ContentText>
                      <ContentText style={{ ...typography.body.xs, color: colors.textMuted, margin: '0' }}>
                        • {recipe.time}
                      </ContentText>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </FeatureCard>

          {/* Events */}
          {events.length > 0 && (
            <FeatureCard
              icon="Calendar"
              title="Upcoming Events"
              description="Join our community events"
            >
              <div style={{ marginTop: spacing.md }}>
                {events.map((event, index) => (
                  <div key={index} style={{
                    padding: spacing.md,
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: '8px',
                    marginBottom: spacing.sm,
                    border: `2px solid ${theme.primaryColor}`,
                  }}>
                    <ContentText style={{ ...typography.body.medium, fontWeight: '600', margin: '0 0 4px 0' }}>
                      {event.name}
                    </ContentText>
                    <ContentText style={{ ...typography.body.small, margin: '0 0 4px 0' }}>
                      {event.description}
                    </ContentText>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <ContentText style={{ ...typography.body.small, color: colors.textMuted, margin: '0' }}>
                        {event.date}
                      </ContentText>
                      {event.location && (
                        <ContentText style={{ ...typography.body.small, color: colors.textMuted, margin: '0' }}>
                          {event.location}
                        </ContentText>
                      )}
                      {event.virtual && (
                        <ContentText style={{ ...typography.body.small, color: theme.primaryColor, margin: '0' }}>
                          Virtual Event
                        </ContentText>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </FeatureCard>
          )}

          {/* Social Challenges */}
          {socialChallenges.length > 0 && (
            <FeatureCard
              icon="Trophy"
              title="Social Media Challenges"
              description="Participate and win amazing prizes"
              highlight
            >
              <div style={{ marginTop: spacing.md }}>
                {socialChallenges.map((challenge, index) => (
                  <div key={index} style={{
                    padding: spacing.md,
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: '8px',
                    marginBottom: spacing.sm,
                  }}>
                    <ContentText style={{ ...typography.body.medium, fontWeight: '600', margin: '0 0 4px 0' }}>
                      {challenge.name}
                    </ContentText>
                    <ContentText style={{ ...typography.body.small, margin: '0 0 8px 0' }}>
                      {challenge.description}
                    </ContentText>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <ContentText style={{ ...typography.body.small, fontWeight: '600', color: theme.primaryColor, margin: '0' }}>
                        #{challenge.hashtag}
                      </ContentText>
                      <ContentText style={{ ...typography.body.xs, color: colors.textMuted, margin: '0' }}>
                        Ends: {new Date(challenge.endDate).toLocaleDateString()}
                      </ContentText>
                    </div>
                    <div style={{ marginTop: spacing.sm, textAlign: 'center' }}>
                      <ContentText style={{ ...typography.body.small, fontWeight: '600', color: colors.success, margin: '0' }}>
                        Prize: {challenge.prize}
                      </ContentText>
                    </div>
                  </div>
                ))}
              </div>
            </FeatureCard>
          )}

          {/* Social Proof */}
          <SocialProof
            stats={[
              { value: '10,000+', label: 'Happy Customers' },
              { value: '4.9/5', label: 'Average Rating' },
              { value: '50+', label: 'Food Creators' },
            ]}
            testimonials={[
              {
                quote: "The seasonal campaigns are amazing! I love discovering new flavors and trying seasonal recipes.",
                author: "Sarah M.",
                role: "Regular Customer",
              },
              {
                quote: "CribNosh makes every season special with their unique offerings and community events.",
                author: "Michael R.",
                role: "Food Enthusiast",
              },
            ]}
          />

          {/* Call to Action */}
          <CallToActionSection
            title="Ready to Experience This Season's Flavors?"
            description="Order now and enjoy exclusive seasonal offers and recipes"
            buttonText="Start Ordering"
            buttonUrl="emailUrls.order()"
            secondaryButtonText="View Recipes"
            secondaryButtonUrl="emailUrls.recipes()"
          />

          {/* Seasonal Tips */}
          <Alert variant="info" title={`${season.charAt(0).toUpperCase() + season.slice(1)} Tips`}>
            <div style={{ marginTop: spacing.sm }}>
              <ContentText style={{ ...typography.body.small, margin: '0 0 4px 0' }}>
                • Try seasonal ingredients for the best flavors
              </ContentText>
              <ContentText style={{ ...typography.body.small, margin: '0 0 4px 0' }}>
                • Follow us on social media for daily recipe inspiration
              </ContentText>
              <ContentText style={{ ...typography.body.small, margin: '0 0 4px 0' }}>
                • Join our community events to meet other food lovers
              </ContentText>
              <ContentText style={{ ...typography.body.small, margin: '0' }}>
                • Share your creations with #{season}Eats for a chance to be featured
              </ContentText>
            </div>
          </Alert>
        </Section>

        <SocialLinks links={socialLinks} />
        
        <FooterSection
          unsubscribeUrl={unsubscribeUrl}
          address={companyAddress}
          companyName="CribNosh"
          additionalLinks={footerLinks}
          showDivider
        />
      </EmailWrapper>
    </Html>
  );
};

export default SeasonalCampaignEmail;
