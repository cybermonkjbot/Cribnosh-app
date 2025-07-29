import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

interface BarData {
  id: string;
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode | string;
}

interface FoodStatesBarChartProps {
  data: BarData[];
  totalValue?: number;
  totalLabel?: string;
  width?: number;
  height?: number;
}

export const FoodStatesBarChart: React.FC<FoodStatesBarChartProps> = ({
  data = [],
  totalValue = 133,
  totalLabel = "£133",
  width = 280,
  height = 224
}) => {
  // Default data if none provided
  const defaultData: BarData[] = [
    {
      id: 'guilty',
      label: '£98',
      value: 98,
      color: '#9F43CC',
      icon: <GuiltyIcon />
    },
    {
      id: 'transport',
      label: '£75',
      value: 75,
      color: '#EBA10F',
      icon: <TransportIcon />
    },
    {
      id: 'food',
      label: '£33',
      value: 33,
      color: '#2B87E3',
      icon: <FoodIcon />
    }
  ];

  const chartData = data.length > 0 ? data : defaultData;
  const maxValue = Math.max(...chartData.map(item => item.value));

  const renderBar = (item: BarData, index: number) => {
    const barHeight = (item.value / maxValue) * 183; // Max height from design
    const barWidth = 70;
    const gap = 10;
    const leftOffset = index * (barWidth + gap);
    
    return (
      <View key={item.id} style={[styles.barContainer, { left: leftOffset }]}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          {typeof item.icon === 'string' ? (
            <Text style={{ fontSize: 20 }}>{item.icon}</Text>
          ) : (
            item.icon
          )}
        </View>
        
        {/* Bar */}
        <View style={[styles.bar, { 
          backgroundColor: item.color,
          height: barHeight,
          width: barWidth
        }]} />
        
        {/* Value Label */}
        <Text style={styles.valueText}>
          {item.label}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { width, height }]}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Total Reference */}
        <View style={styles.totalContainer}>
          <View style={styles.totalIconContainer}>
            <BillIcon />
          </View>
          <View style={styles.totalBar} />
          <Text style={styles.totalValue}>{totalLabel}</Text>
        </View>

        {/* Chart Bars */}
        {chartData.map((item, index) => renderBar(item, index))}
      </ScrollView>
    </View>
  );
};

// Icon Components
const BillIcon: React.FC = () => (
  <Svg width={20} height={20} viewBox="0 0 20 20">
    <Rect
      x={3.23}
      y={1.01}
      width={13.53}
      height={17.97}
      stroke="#FFFFFF"
      strokeWidth={2}
      fill="none"
      rx={1}
    />
  </Svg>
);

const GuiltyIcon: React.FC = () => (
  <Svg width={20} height={20} viewBox="0 0 20 20">
    {/* Main face shape */}
    <Rect
      x={1.13}
      y={1.87}
      width={18.11}
      height={15.8}
      fill="#FFFFFF"
    />
    {/* Eyes */}
    <Circle
      cx={6.54}
      cy={9.59}
      r={0.96}
      stroke="#000000"
      strokeWidth={2}
      fill="none"
    />
    <Circle
      cx={11.54}
      cy={9.59}
      r={0.96}
      stroke="#000000"
      strokeWidth={2}
      fill="none"
    />
    {/* Horns */}
    <Path
      d="M 2.13 6.64 L 5.41 6.64"
      stroke="#000000"
      strokeWidth={2}
      transform="rotate(90 3.77 6.64)"
    />
    <Path
      d="M 14.55 6.64 L 17.83 6.64"
      stroke="#000000"
      strokeWidth={2}
      transform="rotate(90 16.19 6.64)"
    />
  </Svg>
);

const TransportIcon: React.FC = () => (
  <Svg width={20} height={20} viewBox="0 0 20 20">
    {/* Bus body */}
    <Rect
      x={1}
      y={4.65}
      width={17.98}
      height={11.58}
      stroke="#000000"
      strokeWidth={2}
      fill="#FFFFFF"
    />
    {/* Windows */}
    <Rect
      x={1.01}
      y={6.78}
      width={17.98}
      height={4.46}
      stroke="#000000"
      strokeWidth={2}
      fill="none"
    />
    {/* Wheels */}
    <Circle
      cx={4.53}
      cy={16.78}
      r={2.12}
      stroke="#000000"
      strokeWidth={2}
      fill="none"
    />
    <Circle
      cx={13.53}
      cy={16.78}
      r={2.12}
      stroke="#000000"
      strokeWidth={2}
      fill="none"
    />
  </Svg>
);

const FoodIcon: React.FC = () => (
  <Svg width={20} height={20} viewBox="0 0 20 20">
    {/* Carrot shape */}
    <Path
      d="M 10 2.24 L 15.54 7.78 L 10 13.32 L 4.46 7.78 Z"
      fill="#FFFFFF"
      transform="rotate(-45 10 7.78)"
    />
    {/* Carrot outline */}
    <Path
      d="M 10 2.24 L 15.54 7.78 L 10 13.32 L 4.46 7.78 Z"
      stroke="#000000"
      strokeWidth={2}
      fill="none"
      transform="rotate(-45 10 7.78)"
    />
    {/* Carrot lines */}
    <Path
      d="M 8.79 9.16 L 15.24 9.16"
      stroke="#000000"
      strokeWidth={2}
      transform="rotate(45 12.015 9.16)"
    />
    <Path
      d="M 6.15 14.68 L 8.78 14.68"
      stroke="#000000"
      strokeWidth={2}
      transform="rotate(45 7.465 14.68)"
    />
  </Svg>
);

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
  },
  
  // Total Reference
  totalContainer: {
    width: 70,
    height: 246,
    alignItems: 'center',
    marginRight: 10,
  },
  totalIconContainer: {
    width: 20,
    height: 20,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalBar: {
    width: 70,
    height: 183,
    backgroundColor: '#000000',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    marginBottom: 10,
  },
  totalValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    lineHeight: 22,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  
  // Chart Bars
  barContainer: {
    width: 70,
    alignItems: 'center',
    marginRight: 10,
  },
  iconContainer: {
    width: 20,
    height: 20,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    marginBottom: 10,
  },
  valueText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    lineHeight: 22,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default FoodStatesBarChart; 