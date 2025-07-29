import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ProfileScreenBackground } from '../components/ui/ProfileScreenBackground';

export default function ProfileScreenBackgroundDemo() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile Screen Background Demo</Text>
        <Text style={styles.subtitle}>
          Red background with rounded top corners and blurred light sources
        </Text>
      </View>

      <View style={styles.demoSection}>
        <Text style={styles.sectionTitle}>Default Configuration</Text>
        <View style={styles.backgroundContainer}>
          <ProfileScreenBackground>
            <View style={styles.contentExample}>
              <Text style={styles.contentTitle}>Profile Content</Text>
              <Text style={styles.contentText}>
                This is example content that would go on top of the background.
              </Text>
            </View>
          </ProfileScreenBackground>
        </View>
      </View>

      <View style={styles.demoSection}>
        <Text style={styles.sectionTitle}>Custom Size</Text>
        <View style={styles.backgroundContainer}>
          <ProfileScreenBackground width={300} height={600}>
            <View style={styles.contentExample}>
              <Text style={styles.contentTitle}>Smaller Background</Text>
              <Text style={styles.contentText}>
                This background has custom dimensions.
              </Text>
            </View>
          </ProfileScreenBackground>
        </View>
      </View>

      <View style={styles.demoSection}>
        <Text style={styles.sectionTitle}>With Sample Profile Content</Text>
        <View style={styles.backgroundContainer}>
          <ProfileScreenBackground>
            <View style={styles.profileContent}>
              <View style={styles.profileHeader}>
                <View style={styles.avatar} />
                <Text style={styles.profileName}>John Doe</Text>
                <Text style={styles.profileSubtitle}>Premium Member</Text>
              </View>
              
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>1,234</Text>
                  <Text style={styles.statLabel}>Points</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>56</Text>
                  <Text style={styles.statLabel}>Orders</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>89%</Text>
                  <Text style={styles.statLabel}>Satisfaction</Text>
                </View>
              </View>
              
              <View style={styles.savingsSection}>
                <Text style={styles.savingsTitle}>Savings Gained</Text>
                <Text style={styles.savingsAmount}>£245.67</Text>
                <Text style={styles.savingsSubtitle}>
                  This month's total savings from your orders
                </Text>
              </View>
            </View>
          </ProfileScreenBackground>
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Component Features:</Text>
        <Text style={styles.infoText}>• Red background (#FF3B30) with 97% opacity</Text>
        <Text style={styles.infoText}>• Rounded top corners (40px radius)</Text>
        <Text style={styles.infoText}>• Two blurred circular light sources</Text>
        <Text style={styles.infoText}>• Orange blur on top-right (#FF9900)</Text>
        <Text style={styles.infoText}>• Orange blur on top-left (#FF5E00)</Text>
        <Text style={styles.infoText}>• Box shadow with blur effect</Text>
        <Text style={styles.infoText}>• Customizable width and height</Text>
        <Text style={styles.infoText}>• Content overlay support</Text>
        <Text style={styles.infoText}>• Responsive design</Text>
      </View>

      <View style={styles.usageSection}>
        <Text style={styles.usageTitle}>Usage Example:</Text>
        <Text style={styles.usageCode}>
          {`<ProfileScreenBackground>
  <YourContent />
</ProfileScreenBackground>`}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  header: {
    marginBottom: 30,
    marginTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E6FFE8',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#cccccc',
    lineHeight: 22,
  },
  demoSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E6FFE8',
    marginBottom: 15,
  },
  backgroundContainer: {
    height: 400,
    marginBottom: 15,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  contentExample: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  contentText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 22,
  },
  profileContent: {
    padding: 20,
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 15,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  profileSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  savingsSection: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  savingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  savingsAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  savingsSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  infoSection: {
    backgroundColor: 'rgba(9, 67, 39, 0.2)',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E6FFE8',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 5,
    lineHeight: 20,
  },
  usageSection: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    padding: 20,
    borderRadius: 12,
    marginBottom: 40,
  },
  usageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E6FFE8',
    marginBottom: 10,
  },
  usageCode: {
    fontSize: 14,
    color: '#cccccc',
    fontFamily: 'monospace',
    lineHeight: 20,
  },
}); 