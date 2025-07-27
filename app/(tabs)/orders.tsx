import { BurgerIcon } from '@/components/ui/BurgerIcon';
import { EmptyState } from '@/components/ui/EmptyState';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { OrderCard } from '@/components/ui/OrderCard';
import { PremiumHeader } from '@/components/ui/PremiumHeader';
import { PremiumTabs } from '@/components/ui/PremiumTabs';
import { SectionHeader } from '@/components/ui/SectionHeader';
import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

export default function OrdersScreen() {
  const [activeTab, setActiveTab] = useState<'ongoing' | 'past'>('ongoing');

  const tabs = [
    { key: 'ongoing', label: 'Ongoing' },
    { key: 'past', label: 'Past' },
  ];

  // Mock data - in real app this would come from your backend
  const ongoingOrders = [
    {
      id: 1,
      time: '19:18, 6th June',
      description: 'Keto Diet, Burger from Mr.s Burger',
      price: '£28',
    },
  ];

  const pastOrders = [
    {
      id: 2,
      time: '15:30, 5th June',
      description: 'Vegan Pizza from Pizza Palace',
      price: '£22',
    },
    {
      id: 3,
      time: '12:45, 4th June',
      description: 'Chicken Salad from Fresh Bites',
      price: '£18',
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