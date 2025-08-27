import GroupTotalSpendCard from '@/components/GroupTotalSpendCard';
import { Mascot } from '@/components/Mascot';
import { SwipeButton } from '@/components/SwipeButton';
import { CartButton } from '@/components/ui/CartButton';
import { Input } from '@/components/ui/Input';
import ScatteredGroupMembers from '@/components/ui/ScatteredGroupMembers';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { ChevronLeft, SearchIcon } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const avatars = [
    { uri: require('@/assets/images/demo/avatar-1.png') },
    { uri: require('@/assets/images/demo/avatar-2.png') },
    { uri: require('@/assets/images/demo/avatar-3.png') },
    { uri: require('@/assets/images/demo/avatar-4.png') },
    { uri: require('@/assets/images/demo/avatar-5.png') },
]

const groupMembers = [
  { name: 'Fola', avatarUri: require('@/assets/images/demo/avatar-1.png'), top: 0, left: 0, status: 'Contributing £3', isDone: false },
  { name: 'Josh', avatarUri: require('@/assets/images/demo/avatar-2.png'), top: 50, left: 50, status: 'Selecting meal', isDone: true },
  { name: 'Sarah', avatarUri: require('@/assets/images/demo/avatar-3.png'), top: 100, left: 100, status: 'Browsing menu', isDone: false },
  { name: 'Mike', avatarUri: require('@/assets/images/demo/avatar-4.png'), top: 150, left: 150, status: 'Contributing £5', isDone: true },
  { name: 'Emma', avatarUri: require('@/assets/images/demo/avatar-5.png'), top: 200, left: 200, status: 'Adding sides', isDone: false },
  { name: 'Alex', avatarUri: require('@/assets/images/demo/avatar-5.png'), top: 250, left: 250, status: 'Ready to order', isDone: true },
];

export default function GroupOrdersScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showStickySearch, setShowStickySearch] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

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

  const handleScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    // Show sticky search when user scrolls past the title area (approximately 200px)
    setShowStickySearch(scrollY > 200);
  };

  const handleInvitePress = async () => {
    setShowShareModal(true);
    setIsGeneratingLink(true);
    
    // Simulate generating the share link
    setTimeout(async () => {
      setIsGeneratingLink(false);
      
      // Generate a unique group order link
      const groupOrderLink = `https://cribnosh.app/group-order/${Date.now()}`;
      
      try {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(groupOrderLink, {
            mimeType: 'text/plain',
            dialogTitle: 'Invite friends to join your group order',
          });
        }
      } catch (error) {
        console.error('Error sharing:', error);
      }
      
      setShowShareModal(false);
    }, 2000); // 2 second delay to show the loading state
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Sticky Header */}
      <View style={styles.stickyHeader}>
        {showStickySearch ? (
          <View style={styles.stickySearchContainer}>
            <Input
              placeholder="Search for friends & family to invite..."
              leftIcon={<SearchIcon color="#E6FFE8" />}
            />
          </View>
        ) : (
          <View className='flex flex-row items-center justify-between w-full'>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeft color="#E6FFE8" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleInvitePress} style={styles.inviteButton}>
              <Text style={{color:'#E6FFE8'}}>Invite</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#E6FFE8"
            colors={["#E6FFE8"]}
          />
        }
      >
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
                 placeholder="Search for friends & family to invite..."
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

      {/* Full Screen Loading Modal */}
      <Modal
        visible={showShareModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {isGeneratingLink ? (
              <>
                {/* Skeleton Loading */}
                <View style={styles.skeletonContainer}>
                  {/* Title Skeleton */}
                  <View style={styles.skeletonTitle} />
                  
                  {/* Subtitle Skeleton */}
                  <View style={styles.skeletonSubtitle} />
                  
                  {/* Progress Steps Skeleton */}
                  <View style={styles.skeletonSteps}>
                    <View style={styles.skeletonStep}>
                      <View style={styles.skeletonStepIcon} />
                      <View style={styles.skeletonStepText} />
                    </View>
                    <View style={styles.skeletonStep}>
                      <View style={styles.skeletonStepIcon} />
                      <View style={styles.skeletonStepText} />
                    </View>
                    <View style={styles.skeletonStep}>
                      <View style={styles.skeletonStepIcon} />
                      <View style={styles.skeletonStepText} />
                    </View>
                  </View>
                </View>
                
                <Text style={styles.modalTitle}>Creating Your Invite Link</Text>
                <Text style={styles.modalSubtitle}>
                  We're generating a unique link that your friends can use to join this group order
                </Text>
              </>
            ) : (
              <>
                {/* Success Mascot */}
                <View style={styles.successMascotContainer}>
                  <Mascot emotion="excited" size={200} />
                </View>
                
                <Text style={styles.modalSubtitle}>
                  Your unique group order link has been created successfully
                </Text>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    stickyHeader: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 16,
        backgroundColor: '#02120A',
        zIndex: 1000,
    },
    stickySearchContainer: {
        width: '100%',
    },
    backButton: {
        padding: 8,
        borderRadius: 8,
    },
    inviteButton: {
        padding: 8,
        borderRadius: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: '#02120A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        flex: 1,
        width: '100%',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 120,
    },
    spinner: {
        marginBottom: 24,
    },
    modalTitle: {
        color: '#E6FFE8',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
    },
    modalSubtitle: {
        color: '#EAEAEA',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 22,
    },
    modalInfo: {
        color: '#E6FFE8',
        fontSize: 14,
        textAlign: 'center',
        fontStyle: 'italic',
        opacity: 0.8,
    },
    loadingIconContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    loadingIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(230, 255, 232, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: 'rgba(230, 255, 232, 0.3)',
    },
    loadingIconInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(230, 255, 232, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(230, 255, 232, 0.2)',
    },
    loadingIconText: {
        fontSize: 40,
    },
    loadingDots: {
        flexDirection: 'row',
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E6FFE8',
        opacity: 0.6,
    },
    dot1: {
        opacity: 1,
    },
    dot2: {
        opacity: 0.8,
    },
    dot3: {
        opacity: 0.6,
    },
    progressSteps: {
        marginTop: 24,
        gap: 16,
    },
    step: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    stepIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepCompleted: {
        backgroundColor: '#10B981',
    },
    stepActive: {
        backgroundColor: '#E6FFE8',
    },
    stepPending: {
        backgroundColor: 'rgba(230, 255, 232, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(230, 255, 232, 0.4)',
    },
    stepCheck: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    stepNumber: {
        color: '#E6FFE8',
        fontSize: 12,
        fontWeight: 'bold',
    },
    stepText: {
        color: '#EAEAEA',
        fontSize: 14,
        flex: 1,
    },
    successMascotContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    successIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    successIconInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.4)',
    },
    successCheckmark: {
        width: 24,
        height: 24,
        borderLeftWidth: 3,
        borderBottomWidth: 3,
        borderColor: '#10B981',
        transform: [{ rotate: '-45deg' }],
        marginTop: -2,
        marginLeft: 2,
    },
    linkPreview: {
        backgroundColor: 'rgba(230, 255, 232, 0.1)',
        borderRadius: 12,
        padding: 16,
        marginTop: 20,
        borderWidth: 1,
        borderColor: 'rgba(230, 255, 232, 0.2)',
        width: '100%',
    },
    linkPreviewText: {
        color: '#E6FFE8',
        fontSize: 14,
        textAlign: 'center',
        fontFamily: 'monospace',
    },
    skeletonContainer: {
        marginBottom: 60,
        gap: 24,
        width: '100%',
        maxWidth: 400,
    },
    skeletonTitle: {
        height: 32,
        backgroundColor: 'rgba(230, 255, 232, 0.1)',
        borderRadius: 16,
        width: '70%',
        alignSelf: 'center',
    },
    skeletonSubtitle: {
        height: 20,
        backgroundColor: 'rgba(230, 255, 232, 0.08)',
        borderRadius: 10,
        width: '85%',
        alignSelf: 'center',
    },
    skeletonSteps: {
        gap: 16,
        marginTop: 8,
    },
    skeletonStep: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    skeletonStepIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(230, 255, 232, 0.1)',
    },
    skeletonStepText: {
        height: 14,
        backgroundColor: 'rgba(230, 255, 232, 0.08)',
        borderRadius: 7,
        flex: 1,
    },
    customSpinner: {
        width: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    spinnerDot: {
        position: 'absolute',
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#02120A',
    },
    spinnerDot1: {
        top: 2,
        left: 2,
        opacity: 0.8,
    },
    spinnerDot2: {
        top: 2,
        right: 2,
        opacity: 0.6,
    },
    spinnerDot3: {
        bottom: 2,
        left: 6,
        opacity: 0.4,
    },
    scrollContent: {
        paddingBottom: 300, // Large bottom padding to ensure content is fully scrollable above floating buttons
    },
    floatingButtons: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#02120A',
        paddingVertical: 16,
        paddingHorizontal: 20,
        gap: 12,
    },
});
