import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { useDeleteAccountMutation } from '@/store/customerApi';
import { useToast } from '../lib/ToastContext';

// Back arrow icon SVG
const backArrowSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 12H5M12 19L5 12L12 5" stroke="#333333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [deleteAccount, { isLoading: isDeleting }] = useDeleteAccountMutation();

  const handleBackPress = () => {
    router.back();
  };

  const handleDeleteAccount = () => {
    setShowConfirmationModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setShowConfirmationModal(false);
      await deleteAccount().unwrap();
      
      showToast({
        type: "success",
        title: "Account Deletion Requested",
        message: "Your account deletion request has been submitted.",
        duration: 3000,
      });
      
      // Navigate to the survey screen
      router.push('/delete-account-survey');
    } catch (error: any) {
      console.error("Error deleting account:", error);
      const errorMessage = 
        error?.data?.error?.message ||
        error?.data?.message ||
        error?.message ||
        "Failed to delete account. Please try again.";
      showToast({
        type: "error",
        title: "Deletion Failed",
        message: errorMessage,
        duration: 4000,
      });
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmationModal(false);
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false,
          title: 'Delete Account'
        }} 
      />
      <SafeAreaView style={styles.mainContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFFFA" />
        
        {/* Custom Header */}
        <View style={styles.customHeader}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <SvgXml xml={backArrowSVG} width={24} height={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Delete account</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <Text style={styles.mainQuestion}>
            Are you sure you want to delete your account?
          </Text>
          
          <Text style={styles.explanationText}>
            Once you delete your account, it cannot be undone. All your data will be permanently erased from this app includes your profile information, preferences, saved content, and any activity history.
          </Text>
          
          <Text style={styles.explanationText}>
            We're sad to see you go, but we understand that sometimes it's necessary. Please take a moment to consider the consequences before proceeding.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={handleDeleteAccount}
            activeOpacity={0.8}
          >
            <Text style={styles.deleteButtonText}>Delete account</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.goBackButton} 
            onPress={handleGoBack}
            activeOpacity={0.8}
          >
            <Text style={styles.goBackButtonText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelDelete}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              Are you sure you want to continue?
            </Text>
            
            <Text style={styles.modalWarningText}>
              This action cannot be undone. Are you sure you want to continue?
            </Text>
            
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={handleCancelDelete}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmButton} 
                onPress={handleConfirmDelete}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FAFFFA',
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#FAFFFA',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  headerTitle: {
    fontFamily: 'Archivo',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 28,
    color: '#333333',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  mainQuestion: {
    fontFamily: 'Archivo',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 32,
    color: '#333333',
    marginBottom: 24,
    textAlign: 'center',
  },
  explanationText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    color: '#333333',
    marginBottom: 16,
    textAlign: 'left',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
  },
  goBackButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  goBackButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
    color: '#333333',
  },
  // Modal styles
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontFamily: 'Archivo',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 28,
    color: '#333333',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalWarningText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    color: '#333333',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 26,
    color: '#333333',
    textAlign: 'center',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#E6FFE8',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
  },
  confirmButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 26,
    color: '#094327',
    textAlign: 'center',
  },
});
