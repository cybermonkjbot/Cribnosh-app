import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import GroupOrderMember from '../components/GroupOrderMember';
import GroupTotalSpendCard from '../components/GroupTotalSpendCard';
import KitchenNameCard from '../components/KitchenNameCard';
import { AISparkles } from '../components/ui/AISparkles';
import { Alert } from '../components/ui/Alert';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import BigPackaging from '../components/ui/BigPackaging';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Checkbox } from '../components/ui/Checkbox';
import HearEmoteIcon from '../components/ui/HearEmoteIcon';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { OptionsChip } from '../components/ui/OptionsChip';
import { Separator } from '../components/ui/Separator';
import SvgHeading from '../components/ui/SvgHeading';

import SearchArea from '../components/SearchArea';
import SearchBar from '../components/searchbar';
import SwipeButton from '../components/SwipeButton';
import CartBar from '../components/ui/CartBar';
import { Textarea } from '../components/ui/Textarea';

import LoveThisButton from '../components/ui/LoveThisButton';

import { Link as LinkIcon } from 'lucide-react-native';
import ChipButton from '../components/ui/ChipButton';


import LiveViewersIndicator from '../components/LiveViewersIndicator';
import CancelButton from '../components/ui/CancelButton';

import { CribnoshLiveHeader } from '../components/ui/CribnoshLiveHeader';
import { CribnoshLiveIndicator } from '../components/ui/CribnoshLiveIndicator';
import { LiveIndicator } from '../components/ui/LiveIndicator';
import { ShareLiveRightIcon } from '../components/ui/ShareLiveRightIcon';

import IncrementalOrderAmount from '../components/IncrementalOrderAmount';
import OrderButton from '../components/OrderButton';
import OrderItemCounterButton from '../components/OrderItemCounterButton';

export default function UiTestPage() {
  const [checked, setChecked] = useState(false);
  const [loved, setLoved] = useState(false);
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      {/* CribnoshLiveHeader Component Preview */}
      <Text style={{ fontWeight: 'bold', marginTop: 16 }}>CribnoshLiveHeader Component Preview:</Text>
      <View style={{ marginBottom: 32, alignItems: 'center', width: '100%', backgroundColor: '#18181b', paddingVertical: 24, borderRadius: 16 }}>
        <CribnoshLiveHeader
          avatarSource={require('../assets/images/cribnoshpackaging.png')}
          kitchenTitle="Minnies Kitchen"
          viewers={301}
          onCancel={() => alert('Cancel pressed!')}
        />
      </View>
      {/* LiveIndicator Component Preview */}
      <Text style={{ fontWeight: 'bold', marginTop: 16 }}>LiveIndicator Component Preview:</Text>
      <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16, alignItems: 'center', position: 'relative', height: 40 }}>
        <LiveIndicator />
      </View>
      {/* CribnoshLiveIndicator Component Preview */}
      <Text style={{ fontWeight: 'bold', marginTop: 16 }}>CribnoshLiveIndicator Component Preview:</Text>
      <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16, alignItems: 'center', position: 'relative', height: 40 }}>
        <CribnoshLiveIndicator />
      </View>
      {/* LiveViewersIndicator Component Preview */}
      <Text style={{ fontWeight: 'bold', marginTop: 16 }}>LiveViewersIndicator Component Preview:</Text>
      <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16, alignItems: 'center', position: 'relative', height: 40 }}>
        {/* With eye icon */}
        <LiveViewersIndicator viewers={301} showEye style={{ position: 'relative', left: 0, top: 0 }} />
        {/* Without eye icon */}
        <LiveViewersIndicator viewers={301} style={{ position: 'relative', left: 0, top: 0 }} />
      </View>
      {/* Order Buttons & Counters Preview */}
      <Text style={{ fontWeight: 'bold', marginTop: 16 }}>Order Buttons & Counters Preview:</Text>
      <View style={{ flexDirection: 'row', gap: 24, alignItems: 'center', marginBottom: 16 }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 12, marginBottom: 4 }}>OrderButton</Text>
          <OrderButton onPress={() => alert('Order button pressed!')} />
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 12, marginBottom: 4 }}>IncrementalOrderAmount</Text>
          <IncrementalOrderAmount onChange={val => {}} />
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 12, marginBottom: 4 }}>OrderItemCounterButton</Text>
          <OrderItemCounterButton onChange={val => {}} />
        </View>
      </View>
      {/* CancelButton Component Preview */}
      <Text style={{ fontWeight: 'bold', marginTop: 16 }}>CancelButton Component Preview:</Text>
      <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16, alignItems: 'center', justifyContent: 'flex-start' }}>
        {/* Default dark green X */}
        <CancelButton color="#094327" onPress={() => alert('Dark green X pressed!')} style={{ position: 'relative' }} />
        {/* Subtle background variant */}
        <CancelButton color="#094327" size={36} background="rgba(9,67,39,0.08)" onPress={() => alert('Subtle background pressed!')} style={{ position: 'relative' }} />
      </View>
      {/* ChipButton Component Preview */}
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
      {/* LoveThisButton preview */}
      <Text style={{ fontWeight: 'bold', marginTop: 16 }}>LoveThisButton Component Preview:</Text>
      <LoveThisButton liked={loved} onLikeChange={setLoved} style={{ position: 'relative', left: 0, top: 0, marginBottom: 16 }} />
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
            avatarUri={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }}
            textColor="#134E3A"
          />
          <GroupOrderMember
            name="Kevin Leong"
            avatarUri={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }}
            showMessageIcon={true}
            isPaying={true}
            payingAmount={50}
            textColor="#134E3A"
          />
          <GroupOrderMember
            name="Alex Kim"
            avatarUri={{ uri: 'https://randomuser.me/api/portraits/men/45.jpg' }}
            isCurrentUser={true}
            isPaying={true}
            payingAmount={25}
            textColor="#134E3A"
          />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          <GroupOrderMember
            name="Greg Apodaca"
            avatarUri={{ uri: 'https://randomuser.me/api/portraits/men/46.jpg' }}
            showMessageIcon={true}
            isChoosingMeal={true}
            textColor="#134E3A"
          />
          <GroupOrderMember
            name="Juliana Mejia"
            avatarUri={{ uri: 'https://randomuser.me/api/portraits/women/47.jpg' }}
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
          { uri: 'https://randomuser.me/api/portraits/men/32.jpg' },
          { uri: 'https://randomuser.me/api/portraits/women/44.jpg' },
          { uri: 'https://randomuser.me/api/portraits/men/45.jpg' },
        ]}
        glow
      />
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>UI Components Test</Text>
      <SvgHeading title="Payment" fontSize={24} color="#E6FFE8" strokeColor="#FF3B30" strokeWidth={2} fontFamily="Inter" style={{ lineHeight: 28 }} containerStyle={{ marginBottom: 12, alignSelf: 'flex-start' }} />
      {/* Example with custom colors and dark variant removed as requested */}
      <Alert title="Alert Title" variant="success">This is an alert message.</Alert>
      <Text style={{ fontWeight: 'bold', marginTop: 16 }}>SearchArea Component:</Text>
      <SearchArea />
      <Text style={{ fontWeight: 'bold', marginTop: 16 }}>SearchBar Component:</Text>
      <SearchBar />
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
      <Avatar source={{ uri: 'https://placehold.co/64x64' }} size="md" />
      <Badge>Default Badge</Badge>
      <Badge variant="secondary">Secondary Badge</Badge>
      <CartBar count={2} label="Items in cart" />
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
      <SwipeButton onSwipeSuccess={() => alert('Swiped up!')} />
      <Button onPress={() => {}}>Default Button</Button>
      <Button variant="outline" onPress={() => {}}>Outline Button</Button>
      <Button variant="ghost" onPress={() => {}}>Ghost Button</Button>
      <Card>
        <Text>This is a card component.</Text>
      </Card>
      <Checkbox checked={checked} onChange={setChecked} label="Check me!" />
      <Label>Label Example</Label>
      <Input placeholder="Input field" />
      <Textarea placeholder="Textarea field" />
      <Separator />
    </ScrollView>
  );
}
