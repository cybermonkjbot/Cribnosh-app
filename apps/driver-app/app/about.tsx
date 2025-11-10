import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';

export default function AboutScreen() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const appInfo = {
    version: '1.0.0',
    build: '2024.01.001',
    releaseDate: 'January 2024',
  };

  const features = [
    'Real-time order tracking',
    'Secure payment processing',
    'Document management',
    'Earnings tracking',
    '24/7 customer support',
    'Location-based matching',
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle} lightColor={Colors.light.text} darkColor={Colors.dark.text}>About</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* App Info */}
        <ThemedView style={styles.section} lightColor={Colors.light.background} darkColor={Colors.dark.background}>
          <View style={styles.appHeader}>
            <View style={styles.appIcon}>
              <Image 
                source={require('../assets/images/white-greenlogo.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.appInfo}>
              <ThemedText style={styles.appVersion} lightColor={Colors.light.text} darkColor={Colors.dark.text}>Version {appInfo.version}</ThemedText>
              <ThemedText style={styles.appBuild} lightColor={Colors.light.text} darkColor={Colors.dark.text}>Build {appInfo.build}</ThemedText>
              <ThemedText style={styles.appRelease} lightColor={Colors.light.text} darkColor={Colors.dark.text}>Released {appInfo.releaseDate}</ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* App Description */}
        <ThemedView style={styles.section} lightColor={Colors.light.background} darkColor={Colors.dark.background}>
          <ThemedText type="subtitle" style={styles.sectionTitle} lightColor={Colors.light.text} darkColor={Colors.dark.text}>About Cribnosh</ThemedText>
          <ThemedText style={styles.description} lightColor={Colors.light.text} darkColor={Colors.dark.text}>
            Cribnosh is a revolutionary meal delivery platform that connects drivers with customers 
            who need meals delivered to their location. Our driver app provides a seamless experience 
            for managing deliveries, tracking earnings, and growing your business.
          </ThemedText>
        </ThemedView>

        {/* Features */}
        <ThemedView style={styles.section} lightColor={Colors.light.background} darkColor={Colors.dark.background}>
          <ThemedText type="subtitle" style={styles.sectionTitle} lightColor={Colors.light.text} darkColor={Colors.dark.text}>Key Features</ThemedText>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.light.accent} />
              <ThemedText style={styles.featureText} lightColor={Colors.light.text} darkColor={Colors.dark.text}>{feature}</ThemedText>
            </View>
          ))}
        </ThemedView>

        {/* Copyright */}
        <View style={styles.copyrightSection}>
          <ThemedText style={styles.copyrightText} lightColor={Colors.light.icon} darkColor={Colors.dark.icon}>
            © 2024 Cribnosh. All rights reserved.
          </ThemedText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
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
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.light.icon,
    lineHeight: 20,
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  appInfo: {
    flex: 1,
  },
  appVersion: {
    fontSize: 16,
    color: Colors.light.primary,
    fontWeight: '500',
    marginBottom: 2,
  },
  appBuild: {
    fontSize: 14,
    color: Colors.light.icon,
    marginBottom: 2,
  },
  appRelease: {
    fontSize: 14,
    color: Colors.light.icon,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    marginLeft: 8,
  },
  copyrightSection: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 8,
  },
  copyrightText: {
    fontSize: 12,
    color: Colors.light.icon,
    textAlign: 'center',
    marginBottom: 4,
  },
});
