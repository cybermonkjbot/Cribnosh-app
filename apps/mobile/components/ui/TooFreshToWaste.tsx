import { useMeals } from '@/hooks/useMeals';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAuthContext } from '../../contexts/AuthContext';
import { showError } from '../../lib/GlobalToastManager';
import { TooFreshToWasteEmpty } from './TooFreshToWasteEmpty';
import { TooFreshToWasteSkeleton } from './TooFreshToWasteSkeleton';
import { SkeletonWithTimeout } from './SkeletonWithTimeout';

interface FreshItem {
  id: string;
  name: string;
  cuisine: string;  
  image: string;
}

interface TooFreshToWasteProps {
  onOpenDrawer?: () => void;
  onOpenSustainability?: () => void;
  useBackend?: boolean;
  onItemPress?: (item: FreshItem) => void;
}

export function TooFreshToWaste({ 
  onOpenDrawer, 
  onOpenSustainability,
  useBackend = true,
  onItemPress,
}: TooFreshToWasteProps) {
  const { isAuthenticated } = useAuthContext();

  const { getTooFreshItems } = useMeals();
  const [tooFreshData, setTooFreshData] = useState<any>(null);
  const [backendLoading, setBackendLoading] = useState(false);
  const [backendError, setBackendError] = useState<any>(null);

  // Load too fresh items
  useEffect(() => {
    if (useBackend && isAuthenticated) {
      const loadTooFreshItems = async () => {
        setBackendLoading(true);
        setBackendError(null);
        try {
          const result = await getTooFreshItems(20, 1);
          if (result?.success) {
            setTooFreshData({ success: true, data: result.data });
          }
        } catch (error) {
          setBackendError(error);
        } finally {
          setBackendLoading(false);
        }
      };
      loadTooFreshItems();
    }
  }, [useBackend, isAuthenticated, getTooFreshItems]);

  // Transform API data to component format
  const transformFreshItem = useCallback((apiItem: any): FreshItem | null => {
    if (!apiItem) return null;

    // Handle different response structures
    const item = apiItem.dish || apiItem.meal || apiItem;
    
    return {
      id: item._id || item.id || '',
      name: item.name || 'Unknown Item',
      cuisine: item.cuisine?.[0] || item.cuisine || 'Various',
      image: item.image_url || item.image || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=120&h=160&fit=crop',
    };
  }, []);

  // Process fresh items data
  const freshItems: FreshItem[] = useMemo(() => {
    if (!useBackend || !tooFreshData?.success || !tooFreshData.data) {
      return [];
    }

    // SearchResponse.data is an array of SearchResult
    const items = Array.isArray(tooFreshData.data) ? tooFreshData.data : [];
    
    const transformedItems = items
      .map((item: any) => transformFreshItem(item))
      .filter((item): item is FreshItem => item !== null);
    
    return transformedItems;
  }, [tooFreshData, useBackend, transformFreshItem]);

  // Error state is shown in UI - no toast needed

  // Show skeleton while loading
  if (useBackend && backendLoading) {
    return (
      <SkeletonWithTimeout isLoading={backendLoading}>
        <TooFreshToWasteSkeleton itemCount={3} />
      </SkeletonWithTimeout>
    );
  }

  // Hide section if no items (don't show empty state)
  if (freshItems.length === 0) {
    return null;
  }
  return (
    <View style={{ paddingVertical: 20 }}>
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 16, 
        paddingHorizontal: 16 
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000' }}>
            Eco Nosh
          </Text>
          <TouchableOpacity onPress={onOpenSustainability}>
            <Ionicons name="information-circle" size={20} color="#10B981" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={onOpenDrawer}>
          <Text style={{ fontSize: 16, color: '#666' }}>→</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 20 }} // Changed from paddingHorizontal to paddingLeft only
      >
        {freshItems.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={{ 
              width: 120,
              backgroundColor: '#fff',
              borderRadius: 16,
              overflow: 'hidden',
              marginRight: index < freshItems.length - 1 ? 12 : 0,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3
            }}
            onPress={() => onItemPress?.(item)}
            activeOpacity={0.8}
          >
            <View style={{ position: 'relative' }}>
              <Image
                source={{ uri: item.image }}
                style={{ width: 120, height: 140 }}
                contentFit="cover"
              />
              
              {/* Exp. in 30 Min Badge */}
              <View style={{ 
                position: 'absolute', 
                top: 8, 
                left: 8, 
                right: 8 
              }}>
                <View style={{ 
                  backgroundColor: '#fff',
                  borderRadius: 8,
                  padding: 6,
                  alignItems: 'center'
                }}>
                  {/* <Image
                    source={require('../../assets/images/cribnoshpackaging.png')}
                    style={{ width: 16, height: 12, marginBottom: 2 }}
                    contentFit="contain"
                  /> */}
                  <Text style={{ 
                    fontSize: 8, 
                    fontWeight: '600', 
                    color: '#000',
                    textAlign: 'center',
                    lineHeight: 10
                  }}>
                     in 30 Min
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={{ padding: 8 }}>
              <Text style={{ 
                fontSize: 14, 
                fontWeight: 'bold', 
                color: '#000',
                marginBottom: 2
              }}>
                {item.name}
              </Text>
              <Text style={{ 
                fontSize: 12, 
                color: '#6b7280' 
              }}>
                {item.cuisine}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
} 