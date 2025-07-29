import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface KPICardsProps {
  timeSaved?: string;
  costSaved?: string;
}

export const KPICards: React.FC<KPICardsProps> = ({
  timeSaved = "15.7 hours",
  costSaved = "£ 29.3",
}) => {
  return (
    <View style={styles.container}>
      {/* Time Saved KPI */}
      <View style={styles.kpiCard}>
        <Text style={styles.kpiTitle}>Time Saved</Text>
        <Text style={styles.kpiValue}>{timeSaved}</Text>
      </View>

      {/* Cost Saved KPI */}
      <View style={styles.kpiCard}>
        <Text style={styles.kpiTitle}>Cost saved</Text>
        <Text style={styles.kpiValue}>{costSaved}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  kpiTitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  kpiValue: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 32,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default KPICards; 