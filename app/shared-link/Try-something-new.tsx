import { Apple, Flame, SearchIcon, Sparkles, Wheat } from 'lucide-react-native';
import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function TrySomethingNew() {
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
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Order !</Text>
          <Text style={styles.subTitle}>it&apos;s on Joshua</Text>
          <Text style={styles.description}>
            Search works like a magic wand, try it!
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
          <View style={styles.sparkleIcon}>
            <Sparkles color="#E6FFE8" size={24} />
          </View>
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

        {/* Main Content Area - Empty for now */}
        <View style={styles.mainContentArea}>
          {/* This area will be populated with search results or menu items */}
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
    backgroundColor: '#094327',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  titleSection: {
    marginBottom: 30,
  },
  mainTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#E6FFE8',
    lineHeight: 52,
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E6FFE8',
    lineHeight: 36,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#A0A0A0',
    lineHeight: 22,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
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
    borderColor: 'rgba(230, 255, 232, 0.2)',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
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
    marginBottom: 40,
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
  mainContentArea: {
    flex: 1,
    minHeight: 200,
    // This will be populated with search results
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
