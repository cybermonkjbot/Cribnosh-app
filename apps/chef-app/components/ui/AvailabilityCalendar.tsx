import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AvailabilityCalendarProps {
  unavailableDates: number[]; // Array of timestamps
  onDatesChange: (dates: number[]) => void;
  visible: boolean;
  onClose: () => void;
}

export function AvailabilityCalendar({
  unavailableDates,
  onDatesChange,
  visible,
  onClose,
}: AvailabilityCalendarProps) {
  const [selectedDates, setSelectedDates] = useState<Record<string, any>>(() => {
    // Convert timestamps to marked dates format
    const marked: Record<string, any> = {};
    unavailableDates.forEach((timestamp) => {
      const date = new Date(timestamp);
      const dateStr = date.toISOString().split('T')[0];
      marked[dateStr] = {
        selected: true,
        selectedColor: '#EF4444',
        marked: true,
      };
    });
    return marked;
  });

  const handleDayPress = (day: any) => {
    const dateStr = day.dateString;
    const timestamp = new Date(dateStr).getTime();
    
    const newSelectedDates = { ...selectedDates };
    if (newSelectedDates[dateStr]) {
      // Remove date
      delete newSelectedDates[dateStr];
    } else {
      // Add date
      newSelectedDates[dateStr] = {
        selected: true,
        selectedColor: '#EF4444',
        marked: true,
      };
    }
    
    setSelectedDates(newSelectedDates);
    
    // Convert back to timestamps
    const timestamps = Object.keys(newSelectedDates).map((dateStr) => {
      return new Date(dateStr).getTime();
    });
    onDatesChange(timestamps);
  };

  const handleClearAll = () => {
    setSelectedDates({});
    onDatesChange([]);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Mark Unavailable Dates</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <Text style={styles.description}>
            Tap on dates to mark them as unavailable (holidays, personal days, etc.)
          </Text>

          <Calendar
            onDayPress={handleDayPress}
            markedDates={selectedDates}
            markingType="simple"
            theme={{
              backgroundColor: '#FFFFFF',
              calendarBackground: '#FFFFFF',
              textSectionTitleColor: '#6B7280',
              selectedDayBackgroundColor: '#EF4444',
              selectedDayTextColor: '#FFFFFF',
              todayTextColor: '#094327',
              dayTextColor: '#111827',
              textDisabledColor: '#D1D5DB',
              dotColor: '#EF4444',
              selectedDotColor: '#FFFFFF',
              arrowColor: '#094327',
              monthTextColor: '#111827',
              indicatorColor: '#094327',
              textDayFontFamily: 'Inter',
              textMonthFontFamily: 'Inter',
              textDayHeaderFontFamily: 'Inter',
              textDayFontWeight: '400',
              textMonthFontWeight: '700',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14,
            }}
            style={styles.calendar}
          />

          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearAll}
            activeOpacity={0.7}
          >
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>

          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              {Object.keys(selectedDates).length} date{Object.keys(selectedDates).length !== 1 ? 's' : ''} marked as unavailable
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    fontFamily: 'Inter',
    lineHeight: 20,
  },
  calendar: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: 20,
  },
  clearButton: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    fontFamily: 'Inter',
  },
  infoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
});

