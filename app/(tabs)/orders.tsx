import { BurgerIcon } from '@/components/ui/BurgerIcon';
import { EmptyState } from '@/components/ui/EmptyState';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { OrderCard } from '@/components/ui/OrderCard';
import { PremiumHeader } from '@/components/ui/PremiumHeader';
import { PremiumTabs } from '@/components/ui/PremiumTabs';
import { SectionHeader } from '@/components/ui/SectionHeader';
import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

// Define order status types
export type OrderStatus = 'preparing' | 'ready' | 'on-the-way' | 'delivered' | 'cancelled';

// Define order types
export type OrderType = 'individual' | 'group';

// User interface for group orders
interface GroupUser {
  id: string;
  name: string;
  avatar?: string;
  initials?: string;
  color?: string;
}

// Group order interface
interface GroupOrder {
  id: string;
  users: GroupUser[];
  totalUsers: number;
  isActive: boolean;
}

interface Order {
  id: number;
  time: string;
  description: string;
  price: string;
  status?: OrderStatus;
  estimatedTime?: string;
  kitchenName?: string;
  orderNumber?: string;
  items?: string[];
  orderType?: OrderType;
  groupOrder?: GroupOrder;
}

export default function OrdersScreen() {
  const [activeTab, setActiveTab] = useState<'ongoing' | 'past'>('ongoing');

  const tabs = [
    { key: 'ongoing', label: 'Ongoing' },
    { key: 'past', label: 'Past' },
  ];

  // Enhanced mock data for ongoing orders with group order support
  const ongoingOrders: Order[] = [
    {
      id: 1,
      time: '19:18, 6th June',
      description: 'Keto Diet, Burger from Mr.s Burger',
      price: '£28',
      status: 'preparing',
      estimatedTime: '25-30 min',
      kitchenName: 'Mr.s Burger',
      orderNumber: '#ORD-2024-001',
      items: ['Keto Burger', 'Sweet Potato Fries', 'Diet Coke'],
      orderType: 'individual',
    },
    {
      id: 2,
      time: '19:15, 6th June',
      description: 'Team Lunch from Pizza Palace',
      price: '£45',
      status: 'on-the-way',
      estimatedTime: '10-15 min',
      kitchenName: 'Pizza Palace',
      orderNumber: '#ORD-2024-002',
      items: ['Margherita Pizza', 'Pepperoni Pizza', 'Garlic Bread', 'Fresh Juice'],
      orderType: 'group',
      groupOrder: {
        id: 'group-1',
        users: [
          { id: '1', name: 'Sarah', initials: 'S', color: '#FF6B6B' },
          { id: '2', name: 'Mike', initials: 'M', color: '#4ECDC4' },
          { id: '3', name: 'Emma', initials: 'E', color: '#45B7D1' },
          { id: '4', name: 'Alex', initials: 'A', color: '#96CEB4' },
        ],
        totalUsers: 4,
        isActive: true,
      },
    },
    {
      id: 3,
      time: '19:10, 6th June',
      description: 'Chicken Salad from Fresh Bites',
      price: '£18',
      status: 'ready',
      estimatedTime: 'Ready for pickup',
      kitchenName: 'Fresh Bites',
      orderNumber: '#ORD-2024-003',
      items: ['Grilled Chicken Salad', 'Balsamic Dressing', 'Iced Tea'],
      orderType: 'individual',
    },
    {
      id: 4,
      time: '19:05, 6th June',
      description: 'Office Dinner from Tokyo Dreams',
      price: '£78',
      status: 'preparing',
      estimatedTime: '35-40 min',
      kitchenName: 'Tokyo Dreams',
      orderNumber: '#ORD-2024-004',
      items: ['Salmon Nigiri Set', 'Tuna Rolls', 'Miso Soup', 'Green Tea'],
      orderType: 'group',
      groupOrder: {
        id: 'group-2',
        users: [
          { id: '5', name: 'David', initials: 'D', color: '#FFA07A' },
          { id: '6', name: 'Lisa', initials: 'L', color: '#98D8C8' },
          { id: '7', name: 'Tom', initials: 'T', color: '#F7DC6F' },
          { id: '8', name: 'Anna', initials: 'A', color: '#BB8FCE' },
          { id: '9', name: 'Chris', initials: 'C', color: '#85C1E9' },
          { id: '10', name: 'Maria', initials: 'M', color: '#F8C471' },
        ],
        totalUsers: 6,
        isActive: true,
      },
    },
    {
      id: 5,
      time: '18:55, 6th June',
      description: 'Indian Curry from Spice Garden',
      price: '£24',
      status: 'on-the-way',
      estimatedTime: '5-8 min',
      kitchenName: 'Spice Garden',
      orderNumber: '#ORD-2024-005',
      items: ['Butter Chicken', 'Basmati Rice', 'Naan Bread'],
      orderType: 'individual',
    },
  ];

  const pastOrders: Order[] = [
    {
      id: 6,
      time: '15:30, 5th June',
      description: 'Vegan Pizza from Pizza Palace',
      price: '£22',
      status: 'delivered',
    },
    {
      id: 7,
      time: '12:45, 4th June',
      description: 'Chicken Salad from Fresh Bites',
      price: '£18',
      status: 'delivered',
    },
  ];

  const currentOrders = activeTab === 'ongoing' ? ongoingOrders : pastOrders;

  const handleInfoPress = () => {
    // Handle info button press
    console.log('Info pressed');
  };

  const handleOrderPress = (orderId: number) => {
    // Handle order press
    console.log('Order pressed:', orderId);
  };

  const renderContent = () => {
    if (currentOrders.length === 0) {
      return (
        <EmptyState
          title={activeTab === 'ongoing' ? 'No Ongoing Orders' : 'No Past Orders'}
          subtitle={
            activeTab === 'ongoing' 
              ? 'Your active orders will appear here' 
              : 'Your order history will appear here'
          }
          icon={activeTab === 'ongoing' ? 'time-outline' : 'receipt-outline'}
        />
      );
    }

    return (
      <>
        <SectionHeader 
          title={activeTab === 'ongoing' ? 'Current Orders' : 'June 2025'} 
        />
        
        {currentOrders.map((order, index) => (
          <OrderCard
            key={order.id}
            time={order.time}
            description={order.description}
            price={order.price}
            status={order.status}
            estimatedTime={order.estimatedTime}
            orderNumber={order.orderNumber}
            items={order.items}
            orderType={order.orderType}
            groupOrder={order.groupOrder}
            icon={<BurgerIcon />}
            onPress={() => handleOrderPress(order.id)}
            showSeparator={index < currentOrders.length - 1}
            index={index}
          />
        ))}
      </>
    );
  };

  return (
    <GradientBackground>
      <PremiumHeader 
        title="Orders" 
        onInfoPress={handleInfoPress}
      />
      
      <PremiumTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabPress={(tabKey) => setActiveTab(tabKey as 'ongoing' | 'past')}
      />

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {renderContent()}
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Account for tab bar
  },
}); 