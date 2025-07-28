import { SustainabilityDrawer } from '@/components/ui/SustainabilityDrawer';
import { TooFreshToWaste } from '@/components/ui/TooFreshToWaste';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SustainabilityTestScreen() {
  const [showSustainabilityDrawer, setShowSustainabilityDrawer] = useState(false);

  const handleOpenSustainability = () => {
    setShowSustainabilityDrawer(true);
  };

  const handleCloseSustainability = () => {
    setShowSustainabilityDrawer(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Sustainability Integration Test</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Eco Nosh Section</Text>
          <Text style={styles.description}>
            This section shows the TooFreshToWaste component with an info icon that opens the sustainability drawer
          </Text>
          
          <TooFreshToWaste 
            onOpenDrawer={() => console.log('Open drawer')}
            onOpenSustainability={handleOpenSustainability}
          />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manual Test</Text>
          <Text style={styles.description}>
            You can also manually open the sustainability drawer using this button
          </Text>
          
          <TouchableOpacity 
            style={styles.button}
            onPress={handleOpenSustainability}
          >
            <Text style={styles.buttonText}>Open Sustainability Drawer</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>• Info icon in Eco Nosh section</Text>
            <Text style={styles.featureItem}>• Full sustainability information</Text>
            <Text style={styles.featureItem}>• Why it matters section</Text>
            <Text style={styles.featureItem}>• How we do it section</Text>
            <Text style={styles.featureItem}>• Too Fresh to Waste graphic</Text>
            <Text style={styles.featureItem}>• Environmental impact details</Text>
          </View>
        </View>
      </View>

      {/* Sustainability Drawer */}
      {showSustainabilityDrawer && (
        <SustainabilityDrawer onBack={handleCloseSustainability} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFFFA',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#094327',
    marginBottom: 30,
    textAlign: 'center',
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#094327',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  featureList: {
    marginTop: 8,
  },
  featureItem: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
    lineHeight: 20,
  },
}); 