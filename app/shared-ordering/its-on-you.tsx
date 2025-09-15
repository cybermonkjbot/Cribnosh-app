import { Mascot } from '@/components/Mascot';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { Image, Modal, SafeAreaView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useToast } from '../../lib/ToastContext';

export default function ItsOnYou() {
  const [showShareModal, setShowShareModal] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const { showCopySuccess, showError, showInfo } = useToast();

  const handleBack = () => {
    router.back();
  };

  const handleShare = async () => {
    setShowShareModal(true);
    setIsGeneratingLink(true);
    const treatId = `treat_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    // Simulate generating the share link
    setTimeout(async () => {
      setIsGeneratingLink(false);
      
      try {
        // Generate a unique treat ID
        
        // Generate deep link URLs using custom scheme
        const deepLink = `cribnoshapp://treat/${treatId}`;
        const webLink = `https://cribnosh.com/treat/${treatId}`;
        
        // Create share message with both links (deep link for app users, web link as fallback)
        const shareMessage = `I'm treating you to a meal! 🍽️\n\nDownload Cribnosh and use this link: ${deepLink}\n\nOr visit: ${webLink}`;
        
        
        const result = await Share.share({
          message: shareMessage,
          title: 'Share your treat',
        });
        
        if (result.action === Share.sharedAction) {
          showInfo('Link Shared', 'Your treat link has been shared successfully!');
        } else if (result.action === Share.dismissedAction) {
          showInfo('Link Ready', 'Your treat link is ready to copy');
        }
      } catch (error) {
        console.error('Error sharing treat:', error);
        try {
          const deepLink = `cribnoshapp://treat/${treatId}`;
          const webLink = `https://cribnosh.com/treat/${treatId}`;
          
          const shareMessage = `I'm treating you to a meal! 🍽️\n\nDownload Cribnosh and use this link: ${deepLink}\n\nOr visit: ${webLink}`;
          
          await Clipboard.setStringAsync(shareMessage);
          showCopySuccess('The treat link has been copied to your clipboard');
        } catch (clipboardError) {
          console.error('Error copying to clipboard:', clipboardError);
          showError('Failed to share treat link', 'Please try again later');
        }
      }
      
      setShowShareModal(false);
    }, 2000);
  };

  const handleChange = () => {
    router.back();
  };



  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back, share and copy */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={20} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerButtons}>
         
        <TouchableOpacity 
          onPress={handleShare} 
          style={styles.shareButton}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.shareText}>Share</Text>
        </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>
          it&apos;s on you
        </Text>

        {/* Description */}
        <Text style={styles.description}>
          You are treating someone!{'\n'}
          They&apos;ll be able to order once using this link
        </Text>

        {/* Amount Display */}
        <Text style={styles.amount}>£10</Text>

        {/* Change Button */}
        <TouchableOpacity style={styles.changeButton} onPress={handleChange}>
          <Text style={styles.changeText}>Change</Text>
        </TouchableOpacity>
      </View>

      {/* Takeout box image */}
      <View style={styles.imageContainer}>
        <Image
          source={require('../../assets/images/on-your-account-image-01.png')}
          style={styles.takeoutImage}
          resizeMode="contain"
        />
      </View>

      {/* Full Screen Loading Modal */}
      <Modal
        visible={showShareModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setShowShareModal(false)}
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
                
                <Text style={styles.modalTitle}>Creating Your Treat Link</Text>
                <Text style={styles.modalSubtitle}>
                  We&apos;re generating a unique link that your friend can use to claim their treat
                </Text>
              </>
            ) : (
              <>
                {/* Success Mascot */}
                <View style={styles.successMascotContainer}>
                  <Mascot emotion="excited" size={200} />
                </View>
                
                <Text style={styles.modalSubtitle}>
                  Your treat link has been created successfully and is ready to share!
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
    backgroundColor: '#FF3B30',
  },
  header: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    zIndex: 10,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  shareButton: {
    padding: 12,
    minHeight: 44,
    minWidth: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareText: {
    color: '#fff',
    fontSize: 16,
  },
  copyButton: {
    padding: 12,
    minHeight: 44,
    minWidth: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    marginRight: 10,
  },
  copyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.5,
  },
  disabledText: {
    color: '#ccc',
  },
  content: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: 'flex-start',
    zIndex: 5,
  },
  title: {
    fontSize: 35,
    fontWeight: 'bold',
    color: '#fff',
    lineHeight: 52,
    marginBottom: 10    ,
    textShadowColor: '#22c55e',
    textShadowOffset: { width: 6, height: 6 },
    textShadowRadius: 4,
    textAlign: 'left',
    elevation: 4,
  },
  description: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
    marginBottom: 10,
    textAlign: 'left',
  },
  amount: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#E43636',
    lineHeight: 70,
    marginBottom: 24,
    textShadowColor: '#22c55e',
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 4,
    elevation: 4,
  },
  changeButton: {
    backgroundColor: '#B12C00',
    borderRadius: 25,
    paddingHorizontal: 30,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 40,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.4)',
    elevation: 4,
  },
  changeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
  },
  imageContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    height: '60%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: -10,
  },
  takeoutImage: {
    width: '90%',
    height: '90%',
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
  successMascotContainer: {
    alignItems: 'center',
    marginBottom: 24,
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
});
