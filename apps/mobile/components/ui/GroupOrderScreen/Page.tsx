import GroupOrderMember from '@/components/GroupOrderMember';
import GroupTotalSpendCard from '@/components/GroupTotalSpendCard';
import { SwipeButton } from '@/components/SwipeButton';
import BottomSheet from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { ChevronDown, SearchIcon } from 'lucide-react-native';
import React, { useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthContext } from '@/contexts/AuthContext';
import { CartButton } from '../CartButton';
import { getConvexClient, getSessionToken } from '@/lib/convexClient';
import { api } from '@/convex/_generated/api';
import { useEffect, useCallback } from 'react';
import { Input } from '../Input';

type GroupOrderBottomSheetProps = {
  isOpen?: boolean;
  onClose?: () => void;
  setIsOpen?: (isOpen: boolean) => void;
  groupMembers?: Array<{
    name: string;
    avatarUri: any;
    top?: number;
    left?: number;
  }>;
  avatars?: Array<{ uri: any }>;
  totalAmount?: string;
}
export default function GroupOrderBottomSheet({
  isOpen, 
  setIsOpen, 
  onClose,
  groupMembers: propGroupMembers,
  avatars: propAvatars,
  totalAmount = "0"
}: GroupOrderBottomSheetProps) {
  const { isAuthenticated } = useAuthContext();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['25%', '95%', '100%'], []);
  const router = useRouter();
  const [isSheetOpen, setIsSheetOpen] = React.useState(isOpen);
  const [connectionsData, setConnectionsData] = React.useState<any>(null);
  const [isLoadingConnections, setIsLoadingConnections] = React.useState(false);

  // Fetch real connections/friends from Convex if no props provided
  const fetchConnections = useCallback(async () => {
    if (!isAuthenticated || propGroupMembers) return;
    
    try {
      setIsLoadingConnections(true);
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        return;
      }

      const result = await convex.action(api.actions.users.customerGetConnections, {
        sessionToken,
      });

      if (result.success === false) {
        console.error('Error fetching connections:', result.error);
        return;
      }

      // Transform to match expected format
      setConnectionsData({
        success: true,
        data: result.connections || [],
      });
    } catch (error: any) {
      console.error('Error fetching connections:', error);
    } finally {
      setIsLoadingConnections(false);
    }
  }, [isAuthenticated, propGroupMembers]);

  useEffect(() => {
    if (isAuthenticated && !propGroupMembers) {
      fetchConnections();
    }
  }, [isAuthenticated, propGroupMembers, fetchConnections]);

  // Use provided group members or fetch from API, or empty array
  const groupMembers = useMemo(() => {
    if (propGroupMembers && propGroupMembers.length > 0) {
      return propGroupMembers;
    }
    // If no props, try to use connections data
    if (connectionsData?.success && connectionsData.data && Array.isArray(connectionsData.data)) {
      return connectionsData.data.slice(0, 6).map((connection: any, index: number) => ({
        name: connection.user_name || connection.name || 'Unknown User',
        avatarUri: connection.avatar_url || connection.picture || undefined, // No fallback - use default avatar component
        top: (index % 3) * 50,
        left: (index % 2) * 50,
      }));
    }
    return []; // Return empty array if no data
  }, [propGroupMembers, connectionsData]);

  // Use provided avatars or generate from group members
  const avatars = useMemo(() => {
    if (propAvatars && propAvatars.length > 0) {
      return propAvatars;
    }
    // Generate avatars from group members
    return groupMembers.slice(0, 5).map(member => ({
      uri: member.avatarUri,
    }));
  }, [propAvatars, groupMembers]);


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
                <View style={styles.header}>
                    <ChevronDown color="#E6FFE8" />
                    <Text style={{color:'#E6FFE8'}}>Share</Text>
                </View>
                <View>
                    <Text 
                    style={[
                      styles.title,
                      {
                    textShadowColor: '#FF3B30',
                    textShadowOffset: { width: 4, height: 1.5 },
                    textShadowRadius: 0.2,
                      }
                    ]}
                    >
                        Josh and friend's party order
                    </Text>
                    <Text style={{color:'#EAEAEA', paddingTop: 10, paddingBottom: 20}}>
                        You can share the link to add participants or add them here yourself
                    </Text>
                    <View >
                        
                        <Input
                         placeholder="Find people to join your order..."
                           leftIcon={<SearchIcon color="#E6FFE8"  />}
                          />
                    </View>
                </View>

                <View
                style={[
                  styles.membersContainer,
                  {
                    width: '100%',
                    height: 200,
                    marginTop: 24,
                  }
                ]}>
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
                <GroupTotalSpendCard amount={totalAmount} avatars={avatars} />
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

        // alignItems: 'center',
        // padding: 20,
        paddingHorizontal: 16,
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
  paddingHorizontal: 16,
  gap: 12,
  
},
coverEverything:{
  color:'#fff',
  fontWeight:400,
  fontSize:14,
  backgroundColor:"#5E685F",
  textAlign:'center',
  marginHorizontal:'auto',
  paddingHorizontal:16,
  paddingVertical:5,
  borderRadius:10
},
handle: { backgroundColor: "#ccc", width: 48 },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  header: { 
    flexDirection: 'row', // flex flex-row
    alignItems: 'center', // items-center
    justifyContent: 'space-between', // justify-between
    width: '100%', // w-full
    marginBottom: 16, // mb-4
  },
  title: {
    color: '#FFFFFF', // text-white
    fontSize: 48, // text-5xl
    fontWeight: '700', // font-bold
  },
  membersContainer: {
    gap: 16, // gap-4
    flexDirection: 'row', // flex-row (from inline style)
    flexWrap: 'wrap', // flex-wrap (from inline style)
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
