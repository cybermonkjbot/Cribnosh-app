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
    {/* Credit card shape */}
    <Rect
      x={2}
      y={4}
      width={16}
      height={12}
      rx={2}
      fill="#FFFFFF"
      stroke="#000000"
      strokeWidth={1.5}
    />
    {/* Card chip */}
    <Rect
      x={4}
      y={6.5}
      width={3}
      height={2.5}
      fill="#000000"
    />
    {/* Card lines */}
    <Rect
      x={8}
      y={6.5}
      width={8}
      height={1.5}
      fill="#000000"
    />
    <Rect
      x={8}
      y={8.5}
      width={6}
      height={1.5}
      fill="#000000"
    />
    <Rect
      x={8}
      y={10.5}
      width={4}
      height={1.5}
      fill="#000000"
    />
  </Svg>
);

const TransportIcon: React.FC = () => (
  <Svg width={20} height={20} viewBox="0 0 20 20">
    {/* Car body */}
    <Rect
      x={2}
      y={6}
      width={16}
      height={8}
      rx={2}
      fill="#FFFFFF"
      stroke="#000000"
      strokeWidth={1.5}
    />
    {/* Car roof */}
    <Path
      d="M 4 6 L 8 2 L 12 2 L 16 6"
      fill="#FFFFFF"
      stroke="#000000"
      strokeWidth={1.5}
    />
    {/* Windows */}
    <Rect
      x={4.5}
      y={3}
      width={3}
      height={2.5}
      fill="#87CEEB"
      stroke="#000000"
      strokeWidth={0.5}
    />
    <Rect
      x={12.5}
      y={3}
      width={3}
      height={2.5}
      fill="#87CEEB"
      stroke="#000000"
      strokeWidth={0.5}
    />
    {/* Wheels */}
    <Circle
      cx={6}
      cy={16}
      r={2}
      fill="#000000"
    />
    <Circle
      cx={14}
      cy={16}
      r={2}
      fill="#000000"
    />
  </Svg>
);

const FoodIcon: React.FC = () => (
  <Svg width={20} height={20} viewBox="0 0 20 20">
    {/* Plate */}
    <Circle
      cx={10}
      cy={12}
      r={6}
      fill="#FFFFFF"
      stroke="#000000"
      strokeWidth={1.5}
    />
    {/* Fork */}
    <Rect
      x={6}
      y={4}
      width={1.5}
      height={8}
      fill="#000000"
    />
    <Rect
      x={5.5}
      y={4}
      width={2.5}
      height={1.5}
      fill="#000000"
    />
    {/* Knife */}
    <Rect
      x={12.5}
      y={4}
      width={1.5}
      height={8}
      fill="#000000"
    />
    <Path
      d="M 12.5 4 L 15 6 L 12.5 8"
      fill="#000000"
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