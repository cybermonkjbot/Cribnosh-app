import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { GeneratingSuggestionsLoader } from './GeneratingSuggestionsLoader';
import { AIChatDrawer } from './AIChatDrawer';

export const GeneratingSuggestionsDemo: React.FC = () => {
  const [showLoader, setShowLoader] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const handleStartGenerating = () => {
    setShowLoader(true);
    setShowChat(false);
  };

  const handleLoaderComplete = () => {
    setShowLoader(false);
    setShowChat(true);
  };

  const handleCloseChat = () => {
    setShowChat(false);
  };

  return (
    <View style={styles.container}>
      {/* Demo Button */}
      <TouchableOpacity 
        style={styles.demoButton} 
        onPress={handleStartGenerating}
        activeOpacity={0.8}
      >
        <Text style={styles.demoButtonText}>
          Start AI Suggestions Generation
        </Text>
      </TouchableOpacity>

      {/* Instructions */}
      <Text style={styles.instructions}>
        Tap the button above to see the generating suggestions loader, 
        which will automatically transition to the AI chat when complete.
      </Text>

      {/* Generating Suggestions Loader */}
      <GeneratingSuggestionsLoader
        isVisible={showLoader}
        onComplete={handleLoaderComplete}
      />

      {/* AI Chat Drawer */}
      <AIChatDrawer
        isVisible={showChat}
        onClose={handleCloseChat}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8e6f0',
  },
  demoButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  demoButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  instructions: {
    marginTop: 20,
    fontSize: 16,
    color: '#4A5568',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
});
