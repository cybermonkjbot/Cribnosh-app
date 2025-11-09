// DEPRECATED: This is a demo component for testing tab and filter functionality.
// It uses mock data and should not be used in production.
// For production, use real API data from MainScreen components.

import { useAppContext } from '@/utils/AppContext';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export function TabFilterDemo() {
  const { activeHeaderTab, activeCategoryFilter } = useAppContext();

  // Mock content for demo purposes only
  const mockContent = [
    { id: 1, title: 'Nigerian Jollof', category: 'nigerian', type: 'for-you' },
    { id: 2, title: 'Live Sushi Making', category: 'sushi', type: 'live' },
    { id: 3, title: 'Pizza Margherita', category: 'pizza', type: 'for-you' },
    { id: 4, title: 'Live Burger Grilling', category: 'burgers', type: 'live' },
    { id: 5, title: 'Chinese Dumplings', category: 'chinese', type: 'for-you' },
    { id: 6, title: 'Live Italian Pasta', category: 'italian', type: 'live' },
    { id: 7, title: 'Indian Curry', category: 'indian', type: 'for-you' },
    { id: 8, title: 'Mexican Tacos', category: 'mexican', type: 'live' },
    { id: 9, title: 'Thai Pad Thai', category: 'thai', type: 'for-you' },
    { id: 10, title: 'Japanese Ramen', category: 'japanese', type: 'live' },
  ];

  const filteredContent = mockContent.filter(item => {
    // Filter by header tab
    if (item.type !== activeHeaderTab) {
      return false;
    }
    
    // Filter by category
    if (activeCategoryFilter !== 'all' && item.category !== activeCategoryFilter) {
      return false;
    }
    
    return true;
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tab & Filter Demo</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Active Tab: <Text style={styles.highlight}>{activeHeaderTab}</Text>
        </Text>
        <Text style={styles.statusText}>
          Active Filter: <Text style={styles.highlight}>{activeCategoryFilter}</Text>
        </Text>
      </View>

      <Text style={styles.subtitle}>
        Filtered Content ({filteredContent.length} items):
      </Text>

      <ScrollView style={styles.contentList}>
        {filteredContent.length > 0 ? (
          filteredContent.map((item) => (
            <View key={item.id} style={styles.contentItem}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <View style={styles.itemMeta}>
                <Text style={styles.itemCategory}>{item.category}</Text>
                <Text style={styles.itemType}>{item.type}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noContent}>No content matches the current filters</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statusContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  highlight: {
    color: '#16a34a',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  contentList: {
    flex: 1,
  },
  contentItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  itemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemCategory: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itemType: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '500',
  },
  noContent: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 32,
  },
}); 