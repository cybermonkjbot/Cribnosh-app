import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { LiveChatDrawer } from '../components/ui/LiveChatDrawer';

// Back arrow SVG
const backArrowSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 12H5M12 19L5 12L12 5" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Chat icon SVG
const chatIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Message icon SVG
const messageIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 4H2C1.45 4 1 4.45 1 5V15C1 15.55 1.45 16 2 16H6L10 20L14 16H18C18.55 16 19 15.55 19 15V5C19 4.45 18.55 4 18 4Z" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Chevron right icon SVG
const chevronRightIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M7 4L13 10L7 16" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Burger icon SVG
const burgerIconSVG = `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="40" height="40" rx="20" fill="#F3F4F6"/>
  <path d="M12 16H28M12 20H28M12 24H28" stroke="#6B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export default function HelpSupportScreen() {
  const router = useRouter();
  const [isLiveChatVisible, setIsLiveChatVisible] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleOpenLiveChat = () => {
    setIsLiveChatVisible(true);
  };

  const handleCloseLiveChat = () => {
    setIsLiveChatVisible(false);
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false,
          title: 'Help & Support'
        }} 
      />
      <SafeAreaView style={styles.mainContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFFFA" />
        
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <SvgXml xml={backArrowSVG} width={24} height={24} />
          </TouchableOpacity>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Main Title */}
          <Text style={styles.mainTitle}>How can we help?</Text>
          
          {/* Support Cases Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support cases</Text>
            <TouchableOpacity style={styles.supportCaseItem}>
              <View style={styles.supportCaseLeft}>
                <View style={styles.messageIcon}>
                  <SvgXml xml={messageIconSVG} width={20} height={20} />
                </View>
                <View style={styles.supportCaseText}>
                  <Text style={styles.supportCaseTitle}>Inbox</Text>
                  <Text style={styles.supportCaseSubtitle}>View open supports</Text>
                </View>
              </View>
              <SvgXml xml={chevronRightIconSVG} width={20} height={20} />
            </TouchableOpacity>
          </View>

          {/* Recent Order Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Get help with a recent order</Text>
            <View style={styles.orderCard}>
              <View style={styles.orderImageContainer}>
                <View style={styles.orderImage}>
                  <SvgXml xml={burgerIconSVG} width={40} height={40} />
                </View>
              </View>
              <View style={styles.orderDetails}>
                <Text style={styles.orderTitle}>Keto Diet, Burger from Mr.s Burger</Text>
                <Text style={styles.orderTime}>6 Jun, 7:18 PM</Text>
              </View>
              <Text style={styles.orderPrice}>£28</Text>
            </View>
            <View style={styles.separator} />
            <TouchableOpacity style={styles.olderOrderLink}>
              <Text style={styles.olderOrderText}>Select a much older order</Text>
            </TouchableOpacity>
          </View>

          {/* Other Help Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Get help with something else</Text>
            <TouchableOpacity style={styles.helpCategoryItem}>
              <Text style={styles.helpCategoryText}>Food safety on Cribnosh</Text>
              <SvgXml xml={chevronRightIconSVG} width={20} height={20} />
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity style={styles.helpCategoryItem}>
              <Text style={styles.helpCategoryText}>App and features</Text>
              <SvgXml xml={chevronRightIconSVG} width={20} height={20} />
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity style={styles.helpCategoryItem}>
              <Text style={styles.helpCategoryText}>Account and data</Text>
              <SvgXml xml={chevronRightIconSVG} width={20} height={20} />
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity style={styles.helpCategoryItem}>
              <Text style={styles.helpCategoryText}>Payments and pricing</Text>
              <SvgXml xml={chevronRightIconSVG} width={20} height={20} />
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity style={styles.helpCategoryItem}>
              <Text style={styles.helpCategoryText}>Using Cribnosh</Text>
              <SvgXml xml={chevronRightIconSVG} width={20} height={20} />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Floating Live Chat Icon */}
        <TouchableOpacity 
          style={styles.floatingChatButton}
          onPress={handleOpenLiveChat}
          activeOpacity={0.8}
        >
          <SvgXml xml={chatIconSVG} width={24} height={24} />
        </TouchableOpacity>

        {/* Live Chat Drawer */}
        <LiveChatDrawer 
          isVisible={isLiveChatVisible}
          onClose={handleCloseLiveChat}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FAFFFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  mainTitle: {
    fontFamily: 'Archivo',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 32,
    color: '#094327',
    textAlign: 'left',
    marginTop: 16,
    marginBottom: 20,
  },
  section: {
    marginTop: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Archivo',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 24,
    color: '#094327',
    marginBottom: 12,
  },
  // Support Cases Styles
  supportCaseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  supportCaseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  messageIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  supportCaseText: {
    flex: 1,
  },
  supportCaseTitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#111827',
    marginBottom: 4,
  },
  supportCaseSubtitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  // Order Card Styles
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  orderImageContainer: {
    marginRight: 16,
  },
  orderImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderDetails: {
    flex: 1,
  },
  orderTitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#111827',
    marginBottom: 4,
  },
  orderTime: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  orderPrice: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#111827',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  olderOrderLink: {
    paddingVertical: 8,
  },
  olderOrderText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    color: '#FF3B30',
    textAlign: 'left',
  },
  // Help Category Styles
  helpCategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 8,
  },
  helpCategoryText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
    color: '#111827',
  },
  floatingChatButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 1000,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
