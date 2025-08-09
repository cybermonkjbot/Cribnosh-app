import GroupOrderCheckout from "@/components/ui/GroupOrderScreen/components/GroupOrderCheckout";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View } from "react-native";

export default function GroupOrderDetails() {
   const { openSheetGroupCheckout } = useLocalSearchParams<{ openSheetGroupCheckout?: string }>();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
      const router = useRouter();
  
    useEffect(() => {
      console.log('openSheet:', openSheetGroupCheckout);
      if (openSheetGroupCheckout === 'true') {
        
        setIsSheetOpen(true);
      }
    }, [openSheetGroupCheckout]);
  
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
          <GroupOrderCheckout 
          isSheetOpen={isSheetOpen} 
            setIsSheetOpen={setIsSheetOpen}
          onClose={() => router.back()}
           />
          <StatusBar style="auto" />
      
        </View>
  );
}
