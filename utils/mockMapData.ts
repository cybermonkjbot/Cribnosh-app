// Mock chef location data for development and testing
import { ChefMarker } from '../app/types/maps';

// Base location (San Francisco area for testing)
const BASE_LOCATION = {
  latitude: 37.7749,
  longitude: -122.4194,
};

// Generate random coordinates within a radius
function generateRandomLocation(baseLat: number, baseLng: number, radiusKm: number = 5): { latitude: number; longitude: number } {
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * radiusKm;
  
  // Convert km to degrees (approximate)
  const latOffset = (distance * Math.cos(angle)) / 111;
  const lngOffset = (distance * Math.sin(angle)) / (111 * Math.cos(baseLat * Math.PI / 180));
  
  return {
    latitude: baseLat + latOffset,
    longitude: baseLng + lngOffset,
  };
}

// Mock chef data with realistic variety
const mockChefs: ChefMarker[] = [
  {
    id: 'chef-001',
    name: 'Chef Maria',
    kitchen_name: "Maria's Authentic Mexican",
    cuisine: 'Mexican',
    rating: 4.8,
    review_count: 127,
    delivery_time: '25-35 mins',
    distance: '0.8km away',
    image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    is_live: true,
    live_viewers: 23,
    sentiment: 'fire',
    location: generateRandomLocation(BASE_LOCATION.latitude, BASE_LOCATION.longitude, 3),
    address: '123 Mission St, San Francisco, CA',
    created_at: '2024-01-15T10:30:00Z',
  },
  {
    id: 'chef-002',
    name: 'Chef James',
    kitchen_name: "James' Italian Kitchen",
    cuisine: 'Italian',
    rating: 4.6,
    review_count: 89,
    delivery_time: '30-45 mins',
    distance: '1.2km away',
    image_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    is_live: false,
    sentiment: 'bussing',
    location: generateRandomLocation(BASE_LOCATION.latitude, BASE_LOCATION.longitude, 4),
    address: '456 Castro St, San Francisco, CA',
    created_at: '2024-01-10T14:20:00Z',
  },
  {
    id: 'chef-003',
    name: 'Chef Priya',
    kitchen_name: 'Spice Garden',
    cuisine: 'Indian',
    rating: 4.9,
    review_count: 203,
    delivery_time: '20-30 mins',
    distance: '0.5km away',
    image_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
    is_live: true,
    live_viewers: 45,
    sentiment: 'elite',
    location: generateRandomLocation(BASE_LOCATION.latitude, BASE_LOCATION.longitude, 2),
    address: '789 Valencia St, San Francisco, CA',
    created_at: '2024-01-20T09:15:00Z',
  },
  {
    id: 'chef-004',
    name: 'Chef David',
    kitchen_name: 'Fresh Catch Seafood',
    cuisine: 'Seafood',
    rating: 4.4,
    review_count: 67,
    delivery_time: '35-50 mins',
    distance: '2.1km away',
    image_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    is_live: false,
    sentiment: 'solid',
    location: generateRandomLocation(BASE_LOCATION.latitude, BASE_LOCATION.longitude, 5),
    address: '321 Fisherman\'s Wharf, San Francisco, CA',
    created_at: '2024-01-05T16:45:00Z',
  },
  {
    id: 'chef-005',
    name: 'Chef Sarah',
    kitchen_name: 'Green Bowl',
    cuisine: 'Healthy',
    rating: 4.7,
    review_count: 156,
    delivery_time: '15-25 mins',
    distance: '0.3km away',
    image_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    is_live: true,
    live_viewers: 12,
    sentiment: 'slaps',
    location: generateRandomLocation(BASE_LOCATION.latitude, BASE_LOCATION.longitude, 1),
    address: '654 Market St, San Francisco, CA',
    created_at: '2024-01-18T11:30:00Z',
  },
  {
    id: 'chef-006',
    name: 'Chef Tony',
    kitchen_name: 'Tony\'s BBQ Pit',
    cuisine: 'BBQ',
    rating: 4.5,
    review_count: 94,
    delivery_time: '40-55 mins',
    distance: '3.2km away',
    image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    is_live: false,
    sentiment: 'decent',
    location: generateRandomLocation(BASE_LOCATION.latitude, BASE_LOCATION.longitude, 6),
    address: '987 Sutter St, San Francisco, CA',
    created_at: '2024-01-12T13:20:00Z',
  },
  {
    id: 'chef-007',
    name: 'Chef Lisa',
    kitchen_name: 'Lisa\'s Thai Kitchen',
    cuisine: 'Thai',
    rating: 4.8,
    review_count: 178,
    delivery_time: '25-40 mins',
    distance: '1.8km away',
    image_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
    is_live: true,
    live_viewers: 34,
    sentiment: 'fire',
    location: generateRandomLocation(BASE_LOCATION.latitude, BASE_LOCATION.longitude, 4),
    address: '147 Geary St, San Francisco, CA',
    created_at: '2024-01-22T08:45:00Z',
  },
  {
    id: 'chef-008',
    name: 'Chef Michael',
    kitchen_name: 'Michael\'s Steakhouse',
    cuisine: 'Steakhouse',
    rating: 4.3,
    review_count: 112,
    delivery_time: '45-60 mins',
    distance: '2.5km away',
    image_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    is_live: false,
    sentiment: 'solid',
    location: generateRandomLocation(BASE_LOCATION.latitude, BASE_LOCATION.longitude, 5),
    address: '258 California St, San Francisco, CA',
    created_at: '2024-01-08T19:30:00Z',
  },
  {
    id: 'chef-009',
    name: 'Chef Ana',
    kitchen_name: 'Ana\'s Vegan Delights',
    cuisine: 'Vegan',
    rating: 4.6,
    review_count: 145,
    delivery_time: '20-35 mins',
    distance: '1.0km away',
    image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
    is_live: true,
    live_viewers: 18,
    sentiment: 'bussing',
    location: generateRandomLocation(BASE_LOCATION.latitude, BASE_LOCATION.longitude, 3),
    address: '369 Hayes St, San Francisco, CA',
    created_at: '2024-01-25T12:15:00Z',
  },
  {
    id: 'chef-010',
    name: 'Chef Roberto',
    kitchen_name: 'Roberto\'s Pizza Corner',
    cuisine: 'Pizza',
    rating: 4.4,
    review_count: 98,
    delivery_time: '30-45 mins',
    distance: '1.5km away',
    image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    is_live: false,
    sentiment: 'decent',
    location: generateRandomLocation(BASE_LOCATION.latitude, BASE_LOCATION.longitude, 4),
    address: '741 Divisadero St, San Francisco, CA',
    created_at: '2024-01-14T15:40:00Z',
  },
  {
    id: 'chef-011',
    name: 'Chef Yuki',
    kitchen_name: 'Yuki\'s Sushi Bar',
    cuisine: 'Japanese',
    rating: 4.9,
    review_count: 267,
    delivery_time: '35-50 mins',
    distance: '2.8km away',
    image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    is_live: true,
    live_viewers: 56,
    sentiment: 'elite',
    location: generateRandomLocation(BASE_LOCATION.latitude, BASE_LOCATION.longitude, 6),
    address: '852 Fillmore St, San Francisco, CA',
    created_at: '2024-01-28T17:20:00Z',
  },
  {
    id: 'chef-012',
    name: 'Chef Ahmed',
    kitchen_name: 'Ahmed\'s Middle Eastern',
    cuisine: 'Middle Eastern',
    rating: 4.7,
    review_count: 134,
    delivery_time: '25-40 mins',
    distance: '1.3km away',
    image_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    is_live: false,
    sentiment: 'slaps',
    location: generateRandomLocation(BASE_LOCATION.latitude, BASE_LOCATION.longitude, 3),
    address: '963 Polk St, San Francisco, CA',
    created_at: '2024-01-16T10:50:00Z',
  },
  {
    id: 'chef-013',
    name: 'Chef Emma',
    kitchen_name: 'Emma\'s Farm Fresh',
    cuisine: 'Farm-to-Table',
    rating: 4.5,
    review_count: 89,
    delivery_time: '40-55 mins',
    distance: '3.5km away',
    image_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
    is_live: true,
    live_viewers: 7,
    sentiment: 'solid',
    location: generateRandomLocation(BASE_LOCATION.latitude, BASE_LOCATION.longitude, 7),
    address: '159 Union St, San Francisco, CA',
    created_at: '2024-01-11T14:25:00Z',
  },
  {
    id: 'chef-014',
    name: 'Chef Carlos',
    kitchen_name: 'Carlos\' Cuban Kitchen',
    cuisine: 'Cuban',
    rating: 4.6,
    review_count: 167,
    delivery_time: '30-45 mins',
    distance: '2.0km away',
    image_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    is_live: false,
    sentiment: 'bussing',
    location: generateRandomLocation(BASE_LOCATION.latitude, BASE_LOCATION.longitude, 4),
    address: '357 24th St, San Francisco, CA',
    created_at: '2024-01-19T16:10:00Z',
  },
  {
    id: 'chef-015',
    name: 'Chef Jennifer',
    kitchen_name: 'Jennifer\'s Dessert Bar',
    cuisine: 'Desserts',
    rating: 4.8,
    review_count: 201,
    delivery_time: '20-30 mins',
    distance: '0.7km away',
    image_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    is_live: true,
    live_viewers: 29,
    sentiment: 'fire',
    location: generateRandomLocation(BASE_LOCATION.latitude, BASE_LOCATION.longitude, 2),
    address: '468 Folsom St, San Francisco, CA',
    created_at: '2024-01-26T13:35:00Z',
  },
];

// Utility functions for mock data
export function getMockChefs(): ChefMarker[] {
  return [...mockChefs];
}

export function getMockChefsByCuisine(cuisine: string): ChefMarker[] {
  return mockChefs.filter(chef => chef.cuisine.toLowerCase() === cuisine.toLowerCase());
}

export function getMockChefsNearby(
  userLocation: { latitude: number; longitude: number },
  radiusKm: number = 5
): ChefMarker[] {
  return mockChefs.filter(chef => {
    if (!chef.location) return false;
    
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      chef.location.latitude,
      chef.location.longitude
    );
    
    return distance <= radiusKm;
  });
}

export function getMockChefsBySentiment(sentiment: string): ChefMarker[] {
  return mockChefs.filter(chef => chef.sentiment === sentiment);
}

export function getMockLiveChefs(): ChefMarker[] {
  return mockChefs.filter(chef => chef.is_live);
}

export function getMockChefById(id: string): ChefMarker | undefined {
  return mockChefs.find(chef => chef.id === id);
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}

// Generate additional mock chefs dynamically
export function generateAdditionalMockChefs(count: number = 5): ChefMarker[] {
  const cuisines = ['Chinese', 'Korean', 'French', 'Mediterranean', 'Ethiopian', 'Peruvian', 'Vietnamese', 'Lebanese'];
  const sentiments: ChefMarker['sentiment'][] = ['fire', 'bussing', 'elite', 'slaps', 'solid', 'decent', 'mid', 'meh'];
  
  const additionalChefs: ChefMarker[] = [];
  
  for (let i = 0; i < count; i++) {
    const cuisine = cuisines[Math.floor(Math.random() * cuisines.length)];
    const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
    const location = generateRandomLocation(BASE_LOCATION.latitude, BASE_LOCATION.longitude, 8);
    
    additionalChefs.push({
      id: `chef-${String(mockChefs.length + i + 1).padStart(3, '0')}`,
      name: `Chef ${String.fromCharCode(65 + i)}`,
      kitchen_name: `Chef ${String.fromCharCode(65 + i)}'s ${cuisine} Kitchen`,
      cuisine,
      rating: 4.0 + Math.random() * 1.0, // 4.0 to 5.0
      review_count: Math.floor(Math.random() * 200) + 20,
      delivery_time: `${Math.floor(Math.random() * 30) + 20}-${Math.floor(Math.random() * 30) + 40} mins`,
      distance: `${(Math.random() * 5).toFixed(1)}km away`,
      image_url: `https://images.unsplash.com/photo-${1507003211169 + i}?w=100&h=100&fit=crop&crop=face`,
      is_live: Math.random() > 0.7,
      live_viewers: Math.random() > 0.7 ? Math.floor(Math.random() * 50) + 5 : undefined,
      sentiment,
      location,
      address: `${Math.floor(Math.random() * 999) + 100} ${['Main', 'Oak', 'Pine', 'Cedar', 'Elm'][Math.floor(Math.random() * 5)]} St, San Francisco, CA`,
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }
  
  return additionalChefs;
}

export default mockChefs;
