import { FoodStatesBarChart } from '@/components/ui/FoodStatesBarChart';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export default function FoodStatesBarChartDemo() {
  const [currentData, setCurrentData] = useState(0);

  // Different data sets for demonstration
  const dataSets = [
    {
      name: "Default Data",
      data: [],
      total: 133,
      totalLabel: "£133"
    },
    {
      name: "Custom Spending",
      data: [
        {
          id: 'dining',
          label: '£120',
          value: 120,
          color: '#FF6B6B',
          icon: <DiningIcon />
        },
        {
          id: 'groceries',
          label: '£85',
          value: 85,
          color: '#4ECDC4',
          icon: <GroceriesIcon />
        },
        {
          id: 'snacks',
          label: '£45',
          value: 45,
          color: '#45B7D1',
          icon: <SnacksIcon />
        }
      ],
      total: 250,
      totalLabel: "£250"
    },
    {
      name: "Monthly Budget",
      data: [
        {
          id: 'restaurants',
          label: '£200',
          value: 200,
          color: '#9B59B6',
          icon: <RestaurantIcon />
        },
        {
          id: 'takeout',
          label: '£150',
          value: 150,
          color: '#E67E22',
          icon: <TakeoutIcon />
        },
        {
          id: 'coffee',
          label: '£80',
          value: 80,
          color: '#8E44AD',
          icon: <CoffeeIcon />
        }
      ],
      total: 430,
      totalLabel: "£430"
    }
  ];

  const nextDataSet = () => {
    setCurrentData((prev) => (prev + 1) % dataSets.length);
  };

  const currentDataSet = dataSets[currentData];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Food States Bar Chart Demo</Text>
        <Text style={styles.subtitle}>
          Horizontal bar chart with icons and monetary values
        </Text>
      </View>

      <View style={styles.demoSection}>
        <Text style={styles.sectionTitle}>{currentDataSet.name}</Text>
        <View style={styles.chartContainer}>
          <FoodStatesBarChart 
            data={currentDataSet.data}
            totalValue={currentDataSet.total}
            totalLabel={currentDataSet.totalLabel}
          />
        </View>
        <TouchableOpacity style={styles.button} onPress={nextDataSet}>
          <Text style={styles.buttonText}>Next Data Set</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.demoSection}>
        <Text style={styles.sectionTitle}>Custom Size</Text>
        <View style={styles.chartContainer}>
          <FoodStatesBarChart 
            data={currentDataSet.data}
            totalValue={currentDataSet.total}
            totalLabel={currentDataSet.totalLabel}
            width={350}
            height={280}
          />
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Component Features:</Text>
        <Text style={styles.infoText}>• Horizontal bar chart with custom icons</Text>
        <Text style={styles.infoText}>• Total reference bar with bill icon</Text>
        <Text style={styles.infoText}>• Customizable colors for each bar</Text>
        <Text style={styles.infoText}>• Monetary value labels below each bar</Text>
        <Text style={styles.infoText}>• Horizontal scrolling for multiple bars</Text>
        <Text style={styles.infoText}>• SVG-based icons for crisp graphics</Text>
        <Text style={styles.infoText}>• Responsive sizing</Text>
        <Text style={styles.infoText}>• Absolute positioning as per design specs</Text>
      </View>

      <View style={styles.dataSection}>
        <Text style={styles.dataTitle}>Data Structure:</Text>
        <Text style={styles.dataText}>
          Each bar requires: id, label, value, color, and icon
        </Text>
        <Text style={styles.dataText}>
          Icons are SVG components for crisp rendering
        </Text>
        <Text style={styles.dataText}>
          Colors can be any valid CSS color value
        </Text>
      </View>
    </ScrollView>
  );
}

// Additional icon components for demo
const DiningIcon: React.FC = () => (
  <Svg width={20} height={20} viewBox="0 0 20 20">
    <Circle cx={10} cy={10} r={8} stroke="#FFFFFF" strokeWidth={2} fill="none" />
    <Path d="M 6 10 L 14 10 M 10 6 L 10 14" stroke="#FFFFFF" strokeWidth={2} />
  </Svg>
);

const GroceriesIcon: React.FC = () => (
  <Svg width={20} height={20} viewBox="0 0 20 20">
    <Rect x={4} y={6} width={12} height={8} stroke="#FFFFFF" strokeWidth={2} fill="none" />
    <Path d="M 6 6 L 6 4 C 6 2.5 7.5 1 9 1 C 10.5 1 12 2.5 12 4 L 12 6" stroke="#FFFFFF" strokeWidth={2} />
  </Svg>
);

const SnacksIcon: React.FC = () => (
  <Svg width={20} height={20} viewBox="0 0 20 20">
    <Circle cx={10} cy={10} r={6} stroke="#FFFFFF" strokeWidth={2} fill="none" />
    <Path d="M 7 10 L 13 10" stroke="#FFFFFF" strokeWidth={2} />
  </Svg>
);

const RestaurantIcon: React.FC = () => (
  <Svg width={20} height={20} viewBox="0 0 20 20">
    <Path d="M 2 18 L 18 18 L 18 8 L 2 8 Z" stroke="#FFFFFF" strokeWidth={2} fill="none" />
    <Path d="M 6 8 L 6 4 L 14 4 L 14 8" stroke="#FFFFFF" strokeWidth={2} />
  </Svg>
);

const TakeoutIcon: React.FC = () => (
  <Svg width={20} height={20} viewBox="0 0 20 20">
    <Path d="M 4 16 L 16 16 L 16 6 L 4 6 Z" stroke="#FFFFFF" strokeWidth={2} fill="none" />
    <Path d="M 8 6 L 8 2 L 12 2 L 12 6" stroke="#FFFFFF" strokeWidth={2} />
  </Svg>
);

const CoffeeIcon: React.FC = () => (
  <Svg width={20} height={20} viewBox="0 0 20 20">
    <Path d="M 6 16 L 14 16 L 14 8 L 6 8 Z" stroke="#FFFFFF" strokeWidth={2} fill="none" />
    <Path d="M 8 8 L 8 4 L 12 4 L 12 8" stroke="#FFFFFF" strokeWidth={2} />
    <Path d="M 16 12 L 18 12" stroke="#FFFFFF" strokeWidth={2} />
  </Svg>
);

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
  chartContainer: {
    height: 300,
    marginBottom: 15,
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 10,
  },
  button: {
    backgroundColor: '#EBA10F',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#000000',
    fontWeight: '600',
    fontSize: 16,
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
  dataSection: {
    backgroundColor: 'rgba(159, 67, 204, 0.2)',
    padding: 20,
    borderRadius: 12,
    marginBottom: 40,
  },
  dataTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E6FFE8',
    marginBottom: 10,
  },
  dataText: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 5,
    lineHeight: 20,
  },
}); 