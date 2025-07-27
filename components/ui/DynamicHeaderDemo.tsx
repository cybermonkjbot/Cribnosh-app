import {
    getCompleteDynamicHeader,
    getCurrentTimeContext,
    getDynamicHeaderMessage,
    getRandomFoodMessage,
    TimeContext
} from '@/utils/dynamicHeaderMessages';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function DynamicHeaderDemo() {
  const [currentTime, setCurrentTime] = useState(getCurrentTimeContext());
  const [userName, setUserName] = useState('Joshua');
  const [showSubtitle, setShowSubtitle] = useState(false);

  const demoTimes: Array<{ label: string; context: Partial<TimeContext> }> = [
    { label: 'Early Morning (6 AM)', context: { hour: 6, minute: 0, isWeekend: false } },
    { label: 'Breakfast (8 AM)', context: { hour: 8, minute: 0, isWeekend: false } },
    { label: 'Brunch (10 AM)', context: { hour: 10, minute: 0, isWeekend: true } },
    { label: 'Lunch (12 PM)', context: { hour: 12, minute: 0, isWeekend: false } },
    { label: 'Afternoon (3 PM)', context: { hour: 15, minute: 0, isWeekend: false } },
    { label: 'Dinner (7 PM)', context: { hour: 19, minute: 0, isWeekend: false } },
    { label: 'Evening (9 PM)', context: { hour: 21, minute: 0, isWeekend: false } },
    { label: 'Late Night (11 PM)', context: { hour: 23, minute: 0, isWeekend: false } },
    { label: 'Valentine\'s Day', context: { hour: 19, minute: 0, isWeekend: false, specialOccasion: 'valentines' } },
    { label: 'Christmas', context: { hour: 12, minute: 0, isWeekend: true, specialOccasion: 'christmas' } },
    { label: 'Birthday', context: { hour: 18, minute: 0, isWeekend: false, specialOccasion: 'birthday' } },
  ];

  const updateTime = (context: Partial<TimeContext>) => {
    setCurrentTime({ ...getCurrentTimeContext(), ...context });
  };

  const currentMessage = getDynamicHeaderMessage(userName, currentTime, showSubtitle);
  const completeMessage = getCompleteDynamicHeader(userName, showSubtitle);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Dynamic Message</Text>
        <View style={styles.messageCard}>
          <Text style={styles.greeting}>{currentMessage.greeting}</Text>
          <Text style={styles.mainMessage}>{currentMessage.mainMessage}</Text>
          {currentMessage.subMessage && (
            <Text style={styles.subMessage}>{currentMessage.subMessage}</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Complete Dynamic Header</Text>
        <View style={styles.messageCard}>
          <Text style={styles.greeting}>{completeMessage.greeting}</Text>
          <Text style={styles.mainMessage}>{completeMessage.mainMessage}</Text>
          {completeMessage.subMessage && (
            <Text style={styles.subMessage}>{completeMessage.subMessage}</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Random Food Messages</Text>
        <View style={styles.messageCard}>
          <Text style={styles.mainMessage}>{getRandomFoodMessage()}</Text>
        </View>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => setCurrentTime(getCurrentTimeContext())}
        >
          <Text style={styles.buttonText}>Refresh Random Message</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Different Times</Text>
        {demoTimes.map((demo, index) => (
          <TouchableOpacity
            key={index}
            style={styles.demoButton}
            onPress={() => updateTime(demo.context)}
          >
            <Text style={styles.demoButtonText}>{demo.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Toggle Subtitle</Text>
        <TouchableOpacity 
          style={[styles.button, showSubtitle && styles.buttonActive]}
          onPress={() => setShowSubtitle(!showSubtitle)}
        >
          <Text style={[styles.buttonText, showSubtitle && styles.buttonTextActive]}>
            {showSubtitle ? 'Hide Subtitle' : 'Show Subtitle'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Change User Name</Text>
        <View style={styles.nameButtons}>
          {['Joshua', 'Sarah', 'Alex', 'Maria', 'David'].map((name) => (
            <TouchableOpacity
              key={name}
              style={[styles.nameButton, userName === name && styles.nameButtonActive]}
              onPress={() => setUserName(name)}
            >
              <Text style={[styles.nameButtonText, userName === name && styles.nameButtonTextActive]}>
                {name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  messageCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  greeting: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  mainMessage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    lineHeight: 28,
    marginBottom: 4,
  },
  subMessage: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#16a34a',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonActive: {
    backgroundColor: '#dc2626',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  buttonTextActive: {
    color: '#fff',
  },
  demoButton: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  demoButtonText: {
    color: '#374151',
    fontWeight: '500',
  },
  nameButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  nameButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  nameButtonActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  nameButtonText: {
    color: '#374151',
    fontWeight: '500',
  },
  nameButtonTextActive: {
    color: '#fff',
  },
}); 