import GroupTotalSpendCard from '@/components/GroupTotalSpendCard';
import { SwipeButton } from '@/components/SwipeButton';
import { CartButton } from '@/components/ui/CartButton';
import { Input } from '@/components/ui/Input';
import ScatteredGroupMembers from '@/components/ui/ScatteredGroupMembers';
import { useRouter } from 'expo-router';
import { ChevronDown, SearchIcon } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const avatars = [
    { uri: 'https://avatar.iran.liara.run/public/44' },
    { uri: 'https://avatar.iran.liara.run/public/47' },
    { uri: 'https://avatar.iran.liara.run/public/27' },
    { uri: 'https://avatar.iran.liara.run/public/12' },
    { uri: 'https://avatar.iran.liara.run/public/16' },
]

const groupMembers = [
  { name: 'Fola', avatarUri: 'https://avatar.iran.liara.run/public/44', top: 0, left: 0, status: 'Contributing £3', isDone: false },
  { name: 'Josh', avatarUri: 'https://avatar.iran.liara.run/public/47', top: 50, left: 50, status: 'Selecting meal', isDone: true },
  { name: 'Sarah', avatarUri: 'https://avatar.iran.liara.run/public/27', top: 100, left: 100, status: 'Browsing menu', isDone: false },
  { name: 'Mike', avatarUri: 'https://avatar.iran.liara.run/public/12', top: 150, left: 150, status: 'Contributing £5', isDone: true },
  { name: 'Emma', avatarUri: 'https://avatar.iran.liara.run/public/16', top: 200, left: 200, status: 'Adding sides', isDone: false },
  { name: 'Alex', avatarUri: 'https://avatar.iran.liara.run/public/16', top: 250, left: 250, status: 'Ready to order', isDone: true },
];

export default function GroupOrdersScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleNavigate = () => {
    router.push('/orders/group/details');
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate a brief loading state
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
      setRefreshing(false);
    }, 500);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#E6FFE8"
            colors={["#E6FFE8"]}
          />
        }
      >
        <View className='flex flex-row items-center justify-between w-full mb-4'>
            <ChevronDown color="#E6FFE8" />
            <Text style={{color:'#E6FFE8'}}>Invite</Text>
        </View>
        <View>
            <Text 
            className="text-white text-5xl font-bold"
            style={{
            textShadowColor: '#FF3B30',
            textShadowOffset: { width: 4, height: 1.5 },
            textShadowRadius: 0.2,
            }}
            >
                Josh and friend's party order
            </Text>
            <View style={{ marginTop: 20 }}>
                <Input
                 placeholder="Add your friends / family from contacts"
                   leftIcon={<SearchIcon color="#E6FFE8"  />}
                  />
            </View>
        </View>

        <ScatteredGroupMembers 
          members={groupMembers} 
          refreshKey={refreshKey}
        />

      </ScrollView>
      
      <View style={styles.floatingButtons}>
        <GroupTotalSpendCard amount="3000" avatars={avatars} />
        <SwipeButton onSwipeSuccess={() => console.log('yes')} />
        <CartButton quantity={4} onPress={handleNavigate} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#02120A',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    floatingButtons: {
        position: 'absolute',
        bottom: '-1%',
        left: 0,
        right: 0,
        backgroundColor: '#02120A',
        paddingVertical: 16,
        paddingHorizontal: 20,
        gap: 12,
    },
});
