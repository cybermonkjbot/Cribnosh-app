import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import GroupOrderMember from '../components/GroupOrderMember';
import GroupTotalSpendCard from '../components/GroupTotalSpendCard';
import { AISparkles } from '../components/ui/AISparkles';
import { Alert } from '../components/ui/Alert';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Checkbox } from '../components/ui/Checkbox';
import HearEmoteIcon from '../components/ui/HearEmoteIcon';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { OptionsChip } from '../components/ui/OptionsChip';
import { Separator } from '../components/ui/Separator';

import SearchArea from '../components/SearchArea';
import SearchBar from '../components/searchbar';
import SwipeButton from '../components/SwipeButton';
import CartBar from '../components/ui/CartBar';
import { Textarea } from '../components/ui/Textarea';

export default function UiTestPage() {
  const [checked, setChecked] = useState(false);
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
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
