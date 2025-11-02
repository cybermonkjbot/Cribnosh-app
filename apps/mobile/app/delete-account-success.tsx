import { Stack, useRouter } from 'expo-router';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import BigPackaging from '../components/ui/BigPackaging';
import CribNoshLogo from '../components/ui/CribNoshLogo';

// X icon SVG
const xIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 6L6 18M6 6L18 18" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export default function DeleteAccountSuccessScreen() {
  const router = useRouter();

  const handleClose = () => {
    // Navigate back to main app or logout
    router.push('/(tabs)');
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false,
          title: 'Account Deleted'
        }} 
      />
      <SafeAreaView style={styles.mainContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#094327" />
        
        {/* Header with X button */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <SvgXml xml={xIconSVG} width={24} height={24} />
          </TouchableOpacity>
        </View>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <CribNoshLogo size={153} />
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <Text style={styles.title}>Account Deleted</Text>
          
          <Text style={styles.message}>
            We're sorry to see you go, but we respect your decision to delete your account. Your account deletion request has been successfully processed, and your account is now permanently deactivated.
          </Text>
          
          <Text style={styles.message}>
            If you ever decide to return, we'll be here with new updates and features to make your experience even better.
          </Text>
        </View>

        {/* Food Packaging Decoration */}
        <View style={styles.packagingContainer}>
          <BigPackaging />
        </View>

        {/* Done Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.doneButton} 
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#094327',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
  },
  logoContainer: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontFamily: 'Archivo',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 28,
    lineHeight: 36,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
  },
  message: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
    textAlign: 'left',
    marginBottom: 16,
  },
  packagingContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 80,
    zIndex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
    zIndex: 2,
  },
  doneButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
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
  doneButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
  },
});
