import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import CompactMealSelection from '../../components/CompactMealSelection';
import GroupOrderMember from '../../components/GroupOrderMember';
import GroupTotalSpendCard from '../../components/GroupTotalSpendCard';
import { KitchenNameCard } from '../../components/KitchenNameCard';
import LiveComments from '../../components/LiveComments';
import { AISparkles } from '../../components/ui/AISparkles';
import { Alert } from '../../components/ui/Alert';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import BigPackaging from '../../components/ui/BigPackaging';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Checkbox } from '../../components/ui/Checkbox';
import HearEmoteIcon from '../../components/ui/HearEmoteIcon';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { OptionsChip } from '../../components/ui/OptionsChip';
import { Separator } from '../../components/ui/Separator';
import SvgHeading from '../../components/ui/SvgHeading';

export default function UiTestPage() {
  const [checked, setChecked] = useState(false);
  const sampleComments = [
    { name: 'Azeez', comment: 'This is awesome! Loving the live.' },
    { name: 'Mina', comment: 'Can you show the menu again please?' },
    { name: 'Josh', comment: 'Order placed! Can’t wait.' },
    { name: 'Lola', comment: 'The packaging looks so cool 😍' },
    { name: 'Sam', comment: 'How long for delivery?' },
    { name: 'Tina', comment: 'Great job team!' },
  ];
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      {/* CompactMealSelection Component Preview */}
      <Text style={{ fontWeight: 'bold', marginTop: 16 }}>CompactMealSelection Component Preview:</Text>
      <View style={{ marginBottom: 24, alignSelf: 'stretch', width: '100%' }}>
        <CompactMealSelection />
      </View>
      {/* LiveComments Component Preview */}
      <View style={{ width: '100%', marginBottom: 24 }}>
        <Text style={{ fontWeight: 'bold', marginTop: 16 }}>LiveComments Component Preview (TikTok Live Style):</Text>
        <View style={{ alignItems: 'flex-start', width: '100%' }}>
          <LiveComments comments={sampleComments} />
        </View>

      </View>
      {/* ChipButton Component Preview (commented out to isolate LiveComments) */}
      {/**
      <Text style={{ fontWeight: 'bold', marginTop: 16 }}>ChipButton Component Preview:</Text>
      <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
        <ChipButton
          text="Share live"
          icon={<ShareLiveRightIcon color="#E6FFE8" size={24} />}
          backgroundColor="#094327"
          textColor="#E6FFE8"
          style={{ width: 137, height: 29 }}
          textStyle={{ fontFamily: 'Lato', fontWeight: '700', fontSize: 15, lineHeight: 22, letterSpacing: 0.03 }}
        />
        <ChipButton
          text="Treat Someone"
          icon={<LinkIcon color="#094327" size={16} strokeWidth={1.33} />}
          backgroundColor="rgba(0,0,0,0.3)"
          textColor="#094327"
          style={{ width: 157, height: 29 }}
          textStyle={{ fontFamily: 'Lato', fontWeight: '700', fontSize: 15, lineHeight: 22, letterSpacing: 0.03 }}
        />
      </View>
      */}
      {/* LoveThisButton preview */}
      <Text style={{ fontWeight: 'bold', marginTop: 16 }}>LoveThisButton Component Preview:</Text>
      {/**
      <LoveThisButton liked={loved} onLikeChange={setLoved} style={{ position: 'relative', left: 0, top: 0, marginBottom: 16 }} />
      */}
      {/* Heading matching the provided image */}
      <SvgHeading
        title={"Josh and friend's\nparty order"}
        color="#E6FFE8"
        strokeColor="#FF3B30"
        strokeWidth={4}
        fontFamily="Inter"
        fontSize={30}
        style={{ lineHeight: 34 }}
        containerStyle={{ marginBottom: 24, alignSelf: 'flex-start', width: 330 }}
      />
      {/* KitchenNameCard preview */}
      <Text style={{ fontWeight: 'bold', marginTop: 16 }}>KitchenNameCard Component Preview:</Text>
      <KitchenNameCard />

      {/* BigPackaging component preview */}
      <Text style={{ fontWeight: 'bold', marginTop: 16 }}>BigPackaging Component Preview:</Text>
      <BigPackaging />
      <Text style={{ fontWeight: 'bold', marginTop: 16 }}>GroupOrderMember Component Variants:</Text>
      <Card style={{ padding: 24, backgroundColor: '#fff', borderRadius: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 32 }}>
          <GroupOrderMember
            name="Sandy Wilder Cheng"
            avatarUri={require('@/assets/images/demo/avatar-1.png')}
            textColor="#134E3A"
          />
          <GroupOrderMember
            name="Kevin Leong"
            avatarUri={require('@/assets/images/demo/avatar-2.png')}
            showMessageIcon={true}
            isPaying={true}
            payingAmount={50}
            textColor="#134E3A"
          />
          <GroupOrderMember
            name="Alex Kim"
            avatarUri={require('@/assets/images/demo/avatar-3.png')}
            isCurrentUser={true}
            isPaying={true}
            payingAmount={25}
            textColor="#134E3A"
          />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          <GroupOrderMember
            name="Greg Apodaca"
            avatarUri={require('@/assets/images/demo/avatar-4.png')}
            showMessageIcon={true}
            isChoosingMeal={true}
            textColor="#134E3A"
          />
          <GroupOrderMember
            name="Juliana Mejia"
            avatarUri={require('@/assets/images/demo/avatar-5.png')}
            showMessageIcon={true}
            isContributing={true}
            contributingAmount={10}
            textColor="#134E3A"
          />
        </View>
      </Card>
      <GroupTotalSpendCard
        amount="£50"
        avatars={[
          { uri: require('@/assets/images/demo/avatar-1.png') },
          { uri: require('@/assets/images/demo/avatar-2.png') },
          { uri: require('@/assets/images/demo/avatar-3.png') },
        ]}
        glow
      />
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>UI Components Test</Text>
      <SvgHeading title="Payment" fontSize={24} color="#E6FFE8" strokeColor="#FF3B30" strokeWidth={2} fontFamily="Inter" style={{ lineHeight: 28 }} containerStyle={{ marginBottom: 12, alignSelf: 'flex-start' }} />
      {/* Example with custom colors and dark variant removed as requested */}
      <Alert title="Alert Title" variant="success">This is an alert message.</Alert>
      <Text style={{ fontWeight: 'bold', marginTop: 16 }}>SearchArea Component:</Text>
      {/** <SearchArea /> */}
      <Text style={{ fontWeight: 'bold', marginTop: 16 }}>SearchBar Component:</Text>
      {/** <SearchBar /> */}
      <AISparkles style={{ alignSelf: 'center' }} size={48} />
      <HearEmoteIcon style={{ alignSelf: 'center', marginVertical: 8 }} width={48} height={48} />
      <OptionsChip icon={<AISparkles size={20} />}> 
        Default Chip
      </OptionsChip>
      <OptionsChip
        icon={<AISparkles size={20} />}
        backgroundColor="#F87171"
        textColor="#fff"
        iconColor="#fff"
      >
        Red Chip
      </OptionsChip>
      <OptionsChip
        icon={<AISparkles size={20} />}
        backgroundColor="#E5E7EB"
        textColor="#134E3A"
        iconColor="#134E3A"
      >
        Gray Chip
      </OptionsChip>
      <OptionsChip
        icon={<AISparkles size={20} />}
        backgroundColor="#fff"
        textColor="#134E3A"
        iconColor="#134E3A"
        style={{ borderWidth: 1, borderColor: '#E5E7EB' }}
      >
        Outlined Chip
      </OptionsChip>
      <Avatar source={require('@/assets/images/demo/avatar-1.png')} size="md" />
      <Badge>Default Badge</Badge>
      <Badge variant="secondary">Secondary Badge</Badge>
      {/** <CartBar count={2} label="Items in cart" /> */}
      <Button
        onPress={() => {}}
        backgroundColor="#FF3B30"
        textColor="#FAFFFA"
        borderRadius={20}
        paddingVertical={15}
        fontFamily="Poppins"
        fontWeight={"600"}
        style={{ alignSelf: 'stretch', justifyContent: 'center', alignItems: 'center', marginHorizontal: 0 }}
      >
        Confirm
      </Button>

      <Text style={{ fontWeight: 'bold', marginTop: 16 }}>SwipeButton Component (Swipe Up):</Text>
      {/** <SwipeButton onSwipeSuccess={() => alert('Swiped up!')} /> */}
      <Button onPress={() => {}}>Default Button</Button>
      <Button variant="outline" onPress={() => {}}>Outline Button</Button>
      <Button variant="ghost" onPress={() => {}}>Ghost Button</Button>
      <Card>
        <Text>This is a card component.</Text>
      </Card>
      <Checkbox checked={checked} onChange={setChecked} label="Check me!" />
      <Label>Label Example</Label>
      <Input placeholder="Input field" />
      {/** <Textarea placeholder="Textarea field" /> */}
      <Separator />
    </ScrollView>
  );
}
