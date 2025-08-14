import GroupOrderBottomSheet from '@/components/ui/GroupOrderScreen/Page';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { View } from 'react-native';

export default function GroupOrdersScreen() {
  const { openSheet } = useLocalSearchParams<{ openSheet?: string }>();
  const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

  useEffect(() => {
    if (openSheet === 'true') {
      setIsOpen(true);
    }
  }, [openSheet]);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <GroupOrderBottomSheet 
      isOpen={isOpen} 
      setIsOpen={setIsOpen}
      onClose={() => router.back()}
       />
      <StatusBar style="auto" />
  
    </View>
  );
}
