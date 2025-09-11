import { router } from 'expo-router';
import { Apple, Flame, Link, SearchIcon, Sparkles, Users, Wheat } from 'lucide-react-native';
import { useState } from 'react';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LetsFixThat() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const toggleFilter = (filter: string) => {
    setSelectedFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const filterOptions = [
    { id: 'vegan', label: 'Vegan', icon: Apple },
    { id: 'gluten-free', label: 'Gluten Free', icon: Wheat },
    { id: 'spicy', label: 'Spicy', icon: Flame },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Main Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Hungry? Let&apos;s Fix That</Text>
          <Text style={styles.description}>
            Find something different from your usual
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <SearchIcon color="#E6FFE8" size={20} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="I want to eat Eba"
              placeholderTextColor="#A0A0A0"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={styles.sparkleIcon} onPress={() => router.navigate('/(tabs)')}>
            <Sparkles color="#E6FFE8" size={30} />
          </TouchableOpacity>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterContainer}>
          {filterOptions.map((filter) => {
            const IconComponent = filter.icon;
            const isSelected = selectedFilters.includes(filter.id);
            return (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.filterChip,
                  isSelected && styles.filterChipSelected
                ]}
                onPress={() => toggleFilter(filter.id)}
              >
                <IconComponent 
                  color={isSelected ? "#094327" : "#E6FFE8"} 
                  size={16} 
                  style={styles.filterIcon}
                />
                <Text style={[
                  styles.filterText,
                  isSelected && styles.filterTextSelected
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Try It's on me Section */}
        <View style={styles.tryItsOnMeSection}>
          <Text style={styles.sectionTitle}>Try It&apos;s on me</Text>
          <Text style={styles.sectionDescription}>
            Send a link to a friend so they can order food on you.
          </Text>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton}>
              <Link color="#E6FFE8" size={16} style={styles.actionIcon} />
              <Text style={styles.actionText}>Invite Friend</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Users color="#E6FFE8" size={16} style={styles.actionIcon} />
              <Text style={styles.actionText}>Setup Family</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Content Area - Takeout Boxes Image */}
        <View style={styles.mainContentArea}>
          <Image 
            source={require('../../assets/images/on-your-account-image-03.png')}
            style={styles.takeoutImage}
            resizeMode="contain"
          />
        </View>
      </ScrollView>

      {/* Footer Text */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Search is smart, Search gets you
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#02120A',
  },
  content: {
    flex: 1,
    marginTop: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  titleSection: {
    marginBottom: 10,
  },
  mainTitle: {
    fontSize: 30,
    fontWeight: '300',
    color: '#E6FFE8',
    lineHeight: 40,
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    color: '#C4C4C4',
    lineHeight: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(230, 255, 232, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(230, 255, 232, 0.1)',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#E6FFE8',
  },
  sparkleIcon: {
    marginLeft: 12,
    padding: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(230, 255, 232, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(230, 255, 232, 0.3)',
  },
  filterChipSelected: {
    backgroundColor: '#E6FFE8',
    borderColor: '#E6FFE8',
  },
  filterIcon: {
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    color: '#E6FFE8',
    fontWeight: '500',
  },
  filterTextSelected: {
    color: '#094327',
  },
  tryItsOnMeSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '300',
    color: '#E6FFE8',
    marginBottom: 6,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#C4C4C4',
    lineHeight: 20,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(230, 255, 232, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(230, 255, 232, 0.3)',
    flex: 1,
  },
  actionIcon: {
    marginRight: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#E6FFE8',
    fontWeight: '500',
  },
  mainContentArea: {
    flex: 1,
    minHeight: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  takeoutImage: {
    width: '100%',
    height: 250,
    maxWidth: 350,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#A0A0A0',
    textAlign: 'center',
  },
});
