import { useRouter } from 'expo-router';
import { Apple, ChevronLeft, Flame, SearchIcon, Sparkles, Wheat } from 'lucide-react-native';
import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TrySomethingNew() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);


  const handleBack = () => {
    router.back();
  };

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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={20} color="#E6FFE8" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>Order</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
          <TouchableOpacity 
            style={styles.sparkleIcon}
            onPress={() => router.push('/shared-link/lets-fix-that')}
          >
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: 'transparent',
    zIndex: 1000,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  backText: {
    color: '#E6FFE8',
    fontSize: 16,
    marginLeft: 8,
  },
  actionButton: {
    padding: 12,
    borderRadius: 8,
    minHeight: 44,
    minWidth: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    color: '#E6FFE8',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    marginTop: 0,
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
    fontWeight: '300',
    color: '#E6FFE8',
    lineHeight: 52,
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 32,
    fontWeight: '300',
    color: '#E6FFE8',
    lineHeight: 36,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#C4C4C4',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  takeoutImage: {
    width: '100%',
    height: 300,
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
