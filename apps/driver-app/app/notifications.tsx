import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDriverAuth } from '../contexts/EnhancedDriverAuthContext';
import { IconName } from '../utils/Logger';

export default function NotificationsSettingsScreen() {
  const router = useRouter();
  const { driver, user } = useDriverAuth();
  
  const [notifications, setNotifications] = useState({
    orderAssignments: true,
    orderUpdates: true,
    earningsUpdates: true,
    systemAlerts: true,
    marketingPromotions: false,
    maintenanceReminders: true,
    emergencyAlerts: true,
    soundEnabled: true,
    vibrationEnabled: true,
  });

  const handleBack = () => {
    router.back();
  };

  const handleSaveSettings = () => {
    // In a real implementation, this would save to backend
    Alert.alert('Settings Saved', 'Your notification preferences have been updated.');
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const notificationSettings = [
    {
      key: 'orderAssignments' as keyof typeof notifications,
      title: 'Order Assignments',
      description: 'Get notified when new orders are assigned to you',
      icon: 'car-outline' as IconName,
      critical: true,
    },
    {
      key: 'orderUpdates' as keyof typeof notifications,
      title: 'Order Updates',
      description: 'Receive updates about order status changes',
      icon: 'refresh-outline' as IconName,
      critical: true,
    },
    {
      key: 'earningsUpdates' as keyof typeof notifications,
      title: 'Earnings Updates',
      description: 'Notifications about your earnings and payouts',
      icon: 'cash-outline' as IconName,
      critical: false,
    },
    {
      key: 'systemAlerts' as keyof typeof notifications,
      title: 'System Alerts',
      description: 'Important system notifications and updates',
      icon: 'warning-outline' as IconName,
      critical: true,
    },
    {
      key: 'marketingPromotions' as keyof typeof notifications,
      title: 'Promotions & Offers',
      description: 'Special offers and promotional notifications',
      icon: 'gift-outline' as IconName,
      critical: false,
    },
    {
      key: 'maintenanceReminders' as keyof typeof notifications,
      title: 'Maintenance Reminders',
      description: 'Reminders for vehicle maintenance and inspections',
      icon: 'construct-outline' as IconName,
      critical: false,
    },
    {
      key: 'emergencyAlerts' as keyof typeof notifications,
      title: 'Emergency Alerts',
      description: 'Critical safety and emergency notifications',
      icon: 'alert-circle-outline' as IconName,
      critical: true,
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
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveSettings}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Notification Sound & Vibration */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notification Settings</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="volume-high" size={24} color={Colors.light.primary} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Sound</Text>
                  <Text style={styles.settingDescription}>
                    Play sound for notifications
                  </Text>
                </View>
              </View>
              <Switch
                value={notifications.soundEnabled}
                onValueChange={() => toggleNotification('soundEnabled')}
                trackColor={{ false: Colors.light.secondary, true: Colors.light.primary }}
                thumbColor={notifications.soundEnabled ? Colors.light.background : Colors.light.icon}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="phone-portrait" size={24} color={Colors.light.primary} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Vibration</Text>
                  <Text style={styles.settingDescription}>
                    Vibrate for notifications
                  </Text>
                </View>
              </View>
              <Switch
                value={notifications.vibrationEnabled}
                onValueChange={() => toggleNotification('vibrationEnabled')}
                trackColor={{ false: Colors.light.secondary, true: Colors.light.primary }}
                thumbColor={notifications.vibrationEnabled ? Colors.light.background : Colors.light.icon}
              />
            </View>
          </View>

          {/* Notification Types */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notification Types</Text>
            
            {notificationSettings.map((setting, index) => (
              <View key={setting.key} style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Ionicons 
                    name={setting.icon} 
                    size={24} 
                    color={setting.critical ? Colors.light.error : Colors.light.primary} 
                  />
                  <View style={styles.settingText}>
                    <View style={styles.settingTitleRow}>
                      <Text style={styles.settingTitle}>{setting.title}</Text>
                      {setting.critical && (
                        <View style={styles.criticalBadge}>
                          <Text style={styles.criticalBadgeText}>Critical</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.settingDescription}>
                      {setting.description}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={notifications[setting.key]}
                  onValueChange={() => toggleNotification(setting.key)}
                  trackColor={{ false: Colors.light.secondary, true: Colors.light.primary }}
                  thumbColor={notifications[setting.key] ? Colors.light.background : Colors.light.icon}
                />
              </View>
            ))}
          </View>

          {/* Quiet Hours */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quiet Hours</Text>
            
            <View style={styles.infoCard}>
              <Ionicons name="moon-outline" size={24} color={Colors.light.icon} />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Do Not Disturb</Text>
                <Text style={styles.infoDescription}>
                  Configure quiet hours to reduce notifications during your rest time. 
                  Critical alerts will still be delivered.
                </Text>
              </View>
            </View>
            
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Configure Quiet Hours</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.light.primary} />
            </TouchableOpacity>
          </View>

          {/* Notification History */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notification History</Text>
            
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>View Notification History</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.light.primary} />
            </TouchableOpacity>
          </View>

          {/* Privacy Information */}
          <View style={styles.section}>
            <View style={styles.infoCard}>
              <Ionicons name="shield-checkmark" size={24} color={Colors.light.accent} />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Privacy & Control</Text>
                <Text style={styles.infoDescription}>
                  You have full control over your notifications. Critical alerts 
                  for safety and orders will always be delivered.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.secondary,
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
    color: Colors.light.text,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
  },
  saveButtonText: {
    color: Colors.light.background,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.secondary,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
  },
  settingDescription: {
    fontSize: 14,
    color: Colors.light.icon,
    lineHeight: 20,
  },
  criticalBadge: {
    backgroundColor: Colors.light.error + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  criticalBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.error,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    marginBottom: 12,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: Colors.light.icon,
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
  },
});