import {
  Html as EmailHtml,
  Head,
  Preview,
  Container,
  Section,
  Row,
  Column,
  Img,
} from '@react-email/components';
import {
  HeaderSection,
  ContentText,
  PrimaryButton,
  FooterSection,
  CardSection,
  Divider,
  colors,
} from './components';

interface DishRecommendation {
  name: string;
  description: string;
  image: string;
  price: number;
  dietaryInfo: string[];
}

interface ChefProfile {
  name: string;
  image: string;
  kitchen: string;
  specialties: string[];
  rating: number;
  ordersCompleted: number;
}

interface ChefRecommendationsEmailProps {
  customerName: string;
  chefs: ChefProfile[];
  topDishes: DishRecommendation[];
  browseUrl: string;
  unsubscribeUrl: string;
  companyAddress: string;
}

export const ChefRecommendationsEmail = ({
  customerName,
  chefs,
  topDishes,
  browseUrl,
  unsubscribeUrl,
  companyAddress,
}: ChefRecommendationsEmailProps) => (
  <EmailHtml>
    <Head />
    <Preview>Discover new flavors from top-rated chefs in your area!</Preview>
    <Container style={{ padding: '40px 20px', background: colors.background }}>
      <HeaderSection title="Curated Just for You" />
      
      <Section style={{ padding: '0 20px' }}>
        <ContentText>
          Hi {customerName},
        </ContentText>
        
        <ContentText>
          Based on your taste preferences, we've handpicked some amazing chefs and dishes we think you'll love. Each chef brings their unique cultural heritage and expertise to create authentic, memorable meals.
        </ContentText>

        <Section style={{ padding: '24px 0' }}>
          <ContentText style={{ fontWeight: 'bold', fontSize: '20px', marginBottom: '16px' }}>
            Featured Chefs
          </ContentText>
          
          {chefs.map((chef, index) => (
            <CardSection key={index} style={{ marginBottom: '16px' }}>
              <Row>
                <Column style={{ width: '80px' }}>
                  <Img
                    src={chef.image}
                    width="70"
                    height="70"
                    alt={chef.name}
                    style={{ borderRadius: '35px' }}
                  />
                </Column>
                <Column>
                  <ContentText style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {chef.name}
                  </ContentText>
                  <ContentText style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px' }}>
                    {chef.kitchen}
                  </ContentText>
                  <ContentText style={{ fontSize: '14px' }}>
                    ★ {chef.rating} • {chef.ordersCompleted}+ orders
                  </ContentText>
                  <ContentText style={{ fontSize: '14px', color: colors.textLight }}>
                    Specialties: {chef.specialties.join(', ')}
                  </ContentText>
                </Column>
              </Row>
            </CardSection>
          ))}
        </Section>

        <Divider />

        <Section style={{ padding: '24px 0' }}>
          <ContentText style={{ fontWeight: 'bold', fontSize: '20px', marginBottom: '16px' }}>
            Trending Dishes
          </ContentText>
          
          {topDishes.map((dish, index) => (
            <CardSection 
              key={index} 
              style={{ 
                marginBottom: '16px',
                background: `linear-gradient(45deg, #ffffff, ${colors.primary}10)`,
              }}
            >
              <Row>
                <Column>
                  <Img
                    src={dish.image}
                    width="200"
                    height="150"
                    alt={dish.name}
                    style={{ borderRadius: '8px' }}
                  />
                </Column>
                <Column>
                  <ContentText style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {dish.name}
                  </ContentText>
                  <ContentText style={{ fontSize: '14px', marginBottom: '8px' }}>
                    ${dish.price.toFixed(2)}
                  </ContentText>
                  <ContentText style={{ fontSize: '14px', color: colors.textLight }}>
                    {dish.description}
                  </ContentText>
                  <ContentText style={{ fontSize: '12px', color: colors.primary }}>
                    {dish.dietaryInfo.join(' • ')}
                  </ContentText>
                </Column>
              </Row>
            </CardSection>
          ))}
        </Section>

        <Section style={{ padding: '32px 0', textAlign: 'center' }}>
          <PrimaryButton href={browseUrl}>
            Browse More Dishes
          </PrimaryButton>
        </Section>

        <ContentText style={{ textAlign: 'center', fontStyle: 'italic', color: colors.textLight }}>
          All our chefs are verified and their kitchens meet our strict hygiene standards.
        </ContentText>

        <FooterSection
          unsubscribeUrl={unsubscribeUrl}
          address={companyAddress}
        />
      </Section>
    </Container>
  </EmailHtml>
); 