import {
  Column,
  Head,
  Html,
  Preview,
  Row,
  Section
} from '@react-email/components';
import React from 'react';
import {
  Alert,
  CallToActionSection,
  ContentText,
  EmailWrapper,
  FeatureCard,
  FooterSection,
  InteractiveButton,
  ProfessionalHeader,
  ProgressBar,
  SocialLinks,
  SocialProof,
  StatsHighlight,
  colors,
  spacing,
  typography
} from './components';

interface LoyaltyRewardsEmailProps {
  customerName: string;
  currentTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  currentPoints: number;
  pointsToNextTier: number;
  totalPoints: number;
  recentEarnings: Array<{
    source: string;
    points: number;
    date: string;
    description: string;
  }>;
  availableRewards: Array<{
    id: string;
    name: string;
    description: string;
    pointsRequired: number;
    discount?: number;
    freeItem?: string;
    image?: string;
  }>;
  upcomingRewards: Array<{
    name: string;
    pointsNeeded: number;
    description: string;
  }>;
  specialOffers: Array<{
    title: string;
    description: string;
    discount: number;
    expiryDate: string;
    code?: string;
  }>;
  tierBenefits: Array<{
    benefit: string;
    description: string;
    available: boolean;
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
  { href: 'emailUrls.rewards()', text: 'Rewards' },
  { href: 'emailUrls.faq()', text: 'FAQ' },
];

export const LoyaltyRewardsEmail: React.FC<LoyaltyRewardsEmailProps> = ({
  customerName,
  currentTier,
  currentPoints,
  pointsToNextTier,
  totalPoints,
  recentEarnings,
  availableRewards,
  upcomingRewards,
  specialOffers,
  tierBenefits,
  unsubscribeUrl,
  companyAddress,
}) => {
  const getTierInfo = (tier: string) => {
    switch (tier) {
      case 'bronze':
        return { name: 'Bronze', color: colors.warning, icon: 'Bronze', nextTier: 'Silver', nextTierPoints: 500 };
      case 'silver':
        return { name: 'Silver', color: colors.textMuted, icon: 'Silver', nextTier: 'Gold', nextTierPoints: 1000 };
      case 'gold':
        return { name: 'Gold', color: colors.warning, icon: 'Gold', nextTier: 'Platinum', nextTierPoints: 2000 };
      case 'platinum':
        return { name: 'Platinum', color: colors.primary, icon: 'Gem', nextTier: null, nextTierPoints: 0 };
      default:
        return { name: 'Bronze', color: colors.warning, icon: 'Bronze', nextTier: 'Silver', nextTierPoints: 500 };
    }
  };

  const tierInfo = getTierInfo(currentTier);
  const progressPercentage = tierInfo.nextTier ? (currentPoints / tierInfo.nextTierPoints) * 100 : 100;

  return (
    <Html>
      <Head />
      <Preview>Your CribNosh Rewards Update - {tierInfo.name} Member Status</Preview>
      <EmailWrapper
        previewText={`Your CribNosh Rewards Update - ${tierInfo.name} Member Status`}
        title="Loyalty Rewards"
      >
        <ProfessionalHeader
          title={`${tierInfo.icon} ${tierInfo.name} Member Rewards`}
          subtitle="Your loyalty points and exclusive benefits"
          showLogo
          backgroundColor={tierInfo.color}
        />

        <Section style={{ padding: `${spacing['2xl']} ${spacing.xl}` }}>
          <ContentText variant="large" color="text">
            Hi {customerName}!
          </ContentText>

          <ContentText>
            Welcome to your personalized rewards dashboard! Here's everything you need to know about your
            <strong> {tierInfo.name} membership</strong> and how to maximize your benefits.
          </ContentText>

          {/* Points Summary */}
          <StatsHighlight
            value={currentPoints.toLocaleString()}
            label="Current Points"
            description={`Total earned: ${totalPoints.toLocaleString()} points`}
            color={tierInfo.color}
          />

          {/* Tier Progress */}
          {tierInfo.nextTier && (
            <FeatureCard
              icon="TrendingUp"
              title={`Progress to ${tierInfo.nextTier} Tier`}
              description={`${pointsToNextTier} points needed to reach ${tierInfo.nextTier}`}
              highlight
            >
              <ProgressBar
                progress={progressPercentage}
                label={`${currentPoints}/${tierInfo.nextTierPoints} points`}
                color={tierInfo.color}
              />
            </FeatureCard>
          )}

          {/* Recent Earnings */}
          <FeatureCard
            icon="PoundSterling"
            title="Recent Point Earnings"
            description="Your latest point activities"
          >
            <div style={{ marginTop: spacing.md }}>
              {recentEarnings.slice(0, 3).map((earning, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: spacing.sm,
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: '6px',
                  marginBottom: spacing.xs,
                }}>
                  <div>
                    <ContentText style={{ ...typography.body.small, fontWeight: '600', margin: '0 0 2px 0' }}>
                      {earning.source}
                    </ContentText>
                    <ContentText style={{ ...typography.body.xs, color: colors.textMuted, margin: '0' }}>
                      {earning.description}
                    </ContentText>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <ContentText style={{ ...typography.body.small, fontWeight: '600', color: colors.success, margin: '0' }}>
                      +{earning.points}
                    </ContentText>
                    <ContentText style={{ ...typography.body.xs, color: colors.textMuted, margin: '0' }}>
                      {earning.date}
                    </ContentText>
                  </div>
                </div>
              ))}
            </div>
          </FeatureCard>

          {/* Available Rewards */}
          <ContentText style={{ ...typography.heading.h3, textAlign: 'center', margin: `${spacing.xl} 0 ${spacing.lg} 0` }}>
            Available Rewards
          </ContentText>

          <Row style={{ marginBottom: spacing.lg }}>
            {availableRewards.slice(0, 2).map((reward, index) => (
              <Column key={index} style={{ width: '50%', padding: '0 8px' }}>
                <FeatureCard
                  icon={reward.image || 'Gift'}
                  title={reward.name}
                  description={reward.description}
                >
                  <div style={{ textAlign: 'center', marginTop: spacing.md }}>
                    <ContentText style={{ ...typography.body.medium, fontWeight: '600', color: tierInfo.color, margin: '0 0 8px 0' }}>
                      {reward.pointsRequired} points
                    </ContentText>
                    <InteractiveButton
                      href={`emailUrls.rewards()/redeem/${reward.id}`}
                      variant="primary"
                      size="small"
                      fullWidth
                      trackingId={`reward_${reward.id}`}
                    >
                      Redeem Now
                    </InteractiveButton>
                  </div>
                </FeatureCard>
              </Column>
            ))}
          </Row>

          {/* Special Offers */}
          {specialOffers.length > 0 && (
            <FeatureCard
              icon="PartyPopper"
              title="Exclusive Member Offers"
              description="Special deals just for you"
              highlight
            >
              <div style={{ marginTop: spacing.md }}>
                {specialOffers.map((offer, index) => (
                  <div key={index} style={{
                    padding: spacing.md,
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: '8px',
                    marginBottom: spacing.sm,
                    border: `2px solid ${tierInfo.color}`,
                  }}>
                    <ContentText style={{ ...typography.body.medium, fontWeight: '600', margin: '0 0 4px 0' }}>
                      {offer.title}
                    </ContentText>
                    <ContentText style={{ ...typography.body.small, margin: '0 0 4px 0' }}>
                      {offer.description}
                    </ContentText>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <ContentText style={{ ...typography.body.small, fontWeight: '600', color: tierInfo.color, margin: '0' }}>
                        {offer.discount}% OFF
                      </ContentText>
                      <ContentText style={{ ...typography.body.xs, color: colors.textMuted, margin: '0' }}>
                        Expires: {new Date(offer.expiryDate).toLocaleDateString()}
                      </ContentText>
                    </div>
                    {offer.code && (
                      <div style={{ marginTop: spacing.sm, textAlign: 'center' }}>
                        <ContentText style={{ ...typography.body.small, fontWeight: '600', margin: '0' }}>
                          Code: <span style={{
                            backgroundColor: tierInfo.color,
                            color: colors.background,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontFamily: 'monospace'
                          }}>
                            {offer.code}
                          </span>
                        </ContentText>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </FeatureCard>
          )}

          {/* Tier Benefits */}
          <FeatureCard
            icon="⭐"
            title={`${tierInfo.name} Tier Benefits`}
            description="Your exclusive member privileges"
          >
            <div style={{ marginTop: spacing.md }}>
              {tierBenefits.map((benefit, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  marginBottom: spacing.sm,
                }}>
                  <div style={{
                    backgroundColor: benefit.available ? colors.success : colors.textMuted,
                    color: colors.background,
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    marginRight: spacing.sm,
                    flexShrink: 0,
                    marginTop: '2px',
                  }}>
                    {benefit.available ? '✓' : '○'}
                  </div>
                  <div>
                    <ContentText style={{
                      ...typography.body.small,
                      fontWeight: '600',
                      margin: '0 0 2px 0',
                      color: benefit.available ? colors.text : colors.textMuted
                    }}>
                      {benefit.benefit}
                    </ContentText>
                    <ContentText style={{
                      ...typography.body.xs,
                      color: colors.textSecondary,
                      margin: '0'
                    }}>
                      {benefit.description}
                    </ContentText>
                  </div>
                </div>
              ))}
            </div>
          </FeatureCard>

          {/* Upcoming Rewards */}
          {upcomingRewards.length > 0 && (
            <FeatureCard
              icon="Target"
              title="Upcoming Rewards"
              description="Keep earning to unlock these rewards"
            >
              <div style={{ marginTop: spacing.md }}>
                {upcomingRewards.map((reward, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: spacing.sm,
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: '6px',
                    marginBottom: spacing.xs,
                  }}>
                    <div>
                      <ContentText style={{ ...typography.body.small, fontWeight: '600', margin: '0 0 2px 0' }}>
                        {reward.name}
                      </ContentText>
                      <ContentText style={{ ...typography.body.xs, color: colors.textMuted, margin: '0' }}>
                        {reward.description}
                      </ContentText>
                    </div>
                    <ContentText style={{ ...typography.body.small, fontWeight: '600', color: tierInfo.color, margin: '0' }}>
                      {reward.pointsNeeded} pts
                    </ContentText>
                  </div>
                ))}
              </div>
            </FeatureCard>
          )}

          {/* Social Proof */}
          <SocialProof
            stats={[
              { value: '50,000+', label: 'Active Members' },
              { value: '1M+', label: 'Points Redeemed' },
              { value: '95%', label: 'Member Satisfaction' },
            ]}
            testimonials={[
              {
                quote: "The loyalty program is amazing! I've saved so much money and discovered new food creators.",
                author: "Emma L.",
                role: "Gold Member",
              },
              {
                quote: "The exclusive offers and early access to new features make being a member totally worth it.",
                author: "David K.",
                role: "Platinum Member",
              },
            ]}
          />

          {/* Call to Action */}
          <CallToActionSection
            title="Ready to Earn More Points?"
            description="Order from your favorite food creators and earn points with every purchase"
            buttonText="Start Earning Points"
            buttonUrl="emailUrls.order()"
            secondaryButtonText="View All Rewards"
            secondaryButtonUrl="emailUrls.rewards()"
          />

          {/* Points Earning Tips */}
          <Alert variant="info" title="Pro Tips to Earn More Points">
            <div style={{ marginTop: spacing.sm }}>
              <ContentText style={{ ...typography.body.small, margin: '0 0 4px 0' }}>
                • Write reviews to earn bonus points
              </ContentText>
              <ContentText style={{ ...typography.body.small, margin: '0 0 4px 0' }}>
                • Refer friends for 100 points each
              </ContentText>
              <ContentText style={{ ...typography.body.small, margin: '0 0 4px 0' }}>
                • Order during happy hours for double points
              </ContentText>
              <ContentText style={{ ...typography.body.small, margin: '0' }}>
                • Follow us on social media for exclusive codes
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

export default LoyaltyRewardsEmail;
