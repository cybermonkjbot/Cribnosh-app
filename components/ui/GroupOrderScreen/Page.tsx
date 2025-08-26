import React, { useRef, useMemo } from 'react';
import { View, Text, StyleSheet,  ScrollView } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {  ChevronDown, SearchIcon } from 'lucide-react-native';
import { Input } from '../Input';
import GroupOrderMember from '@/components/GroupOrderMember';
import { CartButton } from '../CartButton';
import GroupTotalSpendCard from '@/components/GroupTotalSpendCard';
import {SwipeButton} from '@/components/SwipeButton';
import { useRouter } from 'expo-router';
const avatars = [
    { uri: 'https://avatar.iran.liara.run/public/44' },
    { uri: 'https://avatar.iran.liara.run/public/47' },
    { uri: 'https://avatar.iran.liara.run/public/27' },
    { uri: 'https://avatar.iran.liara.run/public/12' },
    { uri: 'https://avatar.iran.liara.run/public/16' },
]

const groupMembers = [
  { name: 'Fola', avatarUri: 'https://avatar.iran.liara.run/public/44', top: 0, left: 0 },
  { name: 'Josh', avatarUri: 'https://avatar.iran.liara.run/public/47', top: 50, left: 50 },
  { name: 'Sarah', avatarUri: 'https://avatar.iran.liara.run/public/27', top: 100, left: 100 },
  { name: 'Mike', avatarUri: 'https://avatar.iran.liara.run/public/12', top: 150, left: 150 },
  { name: 'Emma', avatarUri: 'https://avatar.iran.liara.run/public/16', top: 200, left: 200 },
  { name: 'Alex', avatarUri: 'https://avatar.iran.liara.run/public/16', top: 250, left: 250 },
];

type GroupOrderBottomSheetProps = {
  isOpen?: boolean;
  onClose?: () => void;
  setIsOpen?: (isOpen: boolean) => void;
}
export default function GroupOrderBottomSheet({isOpen, setIsOpen, onClose}: GroupOrderBottomSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['25%', '95%', '100%'], []);
  const router = useRouter();
  const [isSheetOpen, setIsSheetOpen] = React.useState(isOpen);


React.useEffect(() => {
    // sync imperative open/close (optional)
    if (isOpen) {
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      bottomSheetRef.current?.close?.();
    }
  }, [isOpen]);
 

 const handleSheetChange = (index: number) => {
    // user dragged sheet down to dismiss (gorhom uses -1 when closed)
    if (index === -1) {
      setIsOpen!(false);
      // small delay so animation finishes; then navigate back
      setTimeout(() => {
        if (onClose) onClose();
        router.replace('/orders/group?openSheet=true');        // setIsOpen!(false);
      }, 0);
    }
  };

  const handleNavigate = () => {
    setIsSheetOpen(true);
    router.push({
      pathname: '/orders/group/details',
      params: { openSheetGroupCheckout: 'true' },
    });
  };
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={styles.container}>
          {isOpen && (
            <BottomSheet
              ref={bottomSheetRef}
              index={1}
              snapPoints={snapPoints}
              enablePanDownToClose
              onChange={handleSheetChange}
              backgroundStyle={styles.container}
              handleIndicatorStyle={styles.handle}
            >
              <ScrollView style={styles.sheetContent}>
                <View className='flex flex-row items-center justify-between w-full mb-4'>
                    <ChevronDown color="#E6FFE8" />
                    <Text style={{color:'#E6FFE8'}}>Share</Text>
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
                        Josh and friend’s party order
                    </Text>
                    <Text style={{color:'#EAEAEA', paddingTop: 10, paddingBottom: 20}}>
                        You can share the link to add participants or add them here yourself
                    </Text>
                    <View >
                        
                        <Input
                         placeholder="Search friends and family"
                           leftIcon={<SearchIcon color="#E6FFE8"  />}
                          />
                    </View>
                </View>

                <View
                className='gap-4'
                style={{
                    width: '100%',
                    height: 200,
                    marginTop: 24,
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    
                }}>
                   {groupMembers.slice(0,5).map((member, idx) => {
                  return (
                    <View key={idx}>
                      <GroupOrderMember
                        name={member.name}
                        avatarUri={member.avatarUri}
                        showMessageIcon={true}
                        />
                      </View>
                    );
                  })}
                   {groupMembers.length > 5 && (
                  <View
                    style={{
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 62,
                      height: 62,
                      borderRadius: 31,
                      backgroundColor: '#134E3A',
                      marginHorizontal: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: 'white',
                        fontWeight: '600',
                        fontSize: 16,
                      }}
                    >
                      +{groupMembers.length - 5}
                    </Text>
                  </View>
                )}
                </View>
               </ScrollView>
               <View style={styles.floatingButtons}>
                <GroupTotalSpendCard amount="3000" avatars={avatars} />
                <SwipeButton onSwipeSuccess={() => console.log('yes')} />
                <CartButton quantity={4} onPress={handleNavigate} />
              </View>
            </BottomSheet>
          )}
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sheetContent: {
        flex: 1,
        paddingHorizontal: 20,
        backgroundColor: '#02120A',
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 25,
        backgroundColor: '#007bff',
        borderRadius: 6,
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
    },
      avatarWrapper: {
    position: 'absolute',
  },
  floatingButtons: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  paddingVertical: 16,
  paddingHorizontal: 20,
  gap: 12,
  
},
coverEverything:{
  color:'#fff',
  fontWeight:400,
  fontSize:14,
  backgroundColor:"#5E685F",
  textAlign:'center',
  marginHorizontal:'auto',
  paddingHorizontal:20,
  paddingVertical:5,
  borderRadius:10
},
handle: { backgroundColor: "#ccc", width: 48 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginVertical: 12 
  },
  headerLabel: { 
    color: "#666", 
    fontWeight: "600" 
  },
  title: { 
    fontSize: 20, 
    fontWeight: "700", 
    marginBottom: 8 
  },
  subtitle: { 
    color: "#666", 
    marginBottom: 16 
  },
  members: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    gap: 12, 
    marginTop: 12 
  },
  extra: { 
    width: 62, 
    height: 62, 
    borderRadius: 31, 
    backgroundColor: "#134E3A", 
    alignItems: "center", 
    justifyContent: "center", 
    marginLeft: 8 
  },
  extraText: { 
    color: "#fff", 
    fontWeight: "700" 
  },
  actions: { 
    marginTop: 18, 
    gap: 12 
  },    
});
