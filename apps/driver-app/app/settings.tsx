import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDriverAuth } from '../contexts/EnhancedDriverAuthContext';
import { IconName } from '../utils/Logger';

export default function DriverSettingsScreen() {
  const router = useRouter();
  const { logout } = useDriverAuth();

  const handleBack = () => {
    router.back();
  };

  const handleSignOut = () => {
    logout();
    router.replace('/login');
  };

  const handleOptionPress = (option: string) => {
    switch (option) {
      case 'Personal Information':
        router.push('/profile/edit');
        break;
      case 'Vehicle Information':
        router.push('/vehicle');
        break;
      case 'Notifications':
        router.push('/notifications');
        break;
      case 'Privacy & Security':
        router.push('/privacy');
        break;
      case 'Help & Support':
        router.push('/help');
        break;
      case 'About':
        router.push('/about');
        break;
      case 'Sign Out':
        Alert.alert(
          'Sign Out',
          'Are you sure you want to sign out?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: handleSignOut }
          ]
        );
        break;
      default:
        // All settings now have proper implementations
        console.log(`Settings option ${option} handled`);
    }
  };

  const settingsOptions = [
    {
      id: 'Personal Information',
      title: 'Personal Information',
      icon: 'person-outline' as IconName,
      description: 'Update your personal details',
      showArrow: true,
    },
    {
      id: 'Vehicle Information',
      title: 'Vehicle Information',
      icon: 'car-outline' as IconName,
      description: 'Manage your vehicle details',
      showArrow: true,
    },
    {
      id: 'Notifications',
      title: 'Notifications',
      icon: 'notifications-outline' as IconName,
      description: 'Configure notification preferences',
      showArrow: true,
    },
    {
      id: 'Privacy & Security',
      title: 'Privacy & Security',
      icon: 'shield-outline' as IconName,
      description: 'Manage your privacy settings',
      showArrow: true,
    },
    {
      id: 'Help & Support',
      title: 'Help & Support',
      icon: 'help-circle-outline' as IconName,
      description: 'Get help and contact support',
      showArrow: true,
    },
    {
      id: 'About',
      title: 'About',
      icon: 'information-circle-outline' as IconName,
      description: 'App version and information',
      showArrow: true,
    },
    {
      id: 'Sign Out',
      title: 'Sign Out',
      icon: 'log-out-outline' as IconName,
      description: 'Sign out of your account',
      showArrow: false,
      destructive: true,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Settings Options */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.optionsContainer}>
            {settingsOptions.map((option, index) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionItem,
                  index === settingsOptions.length - 1 && styles.lastOptionItem,
                ]}
                onPress={() => handleOptionPress(option.id)}
              >
                <View style={styles.optionLeft}>
                  <View style={[
                    styles.optionIconContainer,
                    option.destructive && styles.destructiveIconContainer
                  ]}>
                    <Ionicons
                      name={option.icon}
                      size={24}
                      color={option.destructive ? Colors.light.error : Colors.light.primary}
                    />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={[
                      styles.optionTitle,
                      option.destructive && styles.destructiveText
                    ]}>
                      {option.title}
                    </Text>
                    <Text style={styles.optionDescription}>
                      {option.description}
                    </Text>
                  </View>
                </View>
                {option.showArrow && (
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={Colors.light.icon}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* App Version */}
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>
              Cribnosh Driver App v1.0.0
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  optionsContainer: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.secondary,
  },
  lastOptionItem: {
    borderBottomWidth: 0,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  destructiveIconContainer: {
    backgroundColor: Colors.light.error + '20',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  destructiveText: {
    color: Colors.light.error,
  },
  optionDescription: {
    fontSize: 14,
    color: Colors.light.icon,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 12,
    color: Colors.light.icon,
  },
});
