import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Circle, Path, Rect, Svg } from 'react-native-svg';

export const KitchenBottomSheetContent: React.FC = () => {
  const categories = [
    {
      id: 'candy',
      name: 'Candy',
      icon: (
        <Svg width={35} height={35} viewBox="0 0 35 35" fill="none">
          <Rect x="2" y="2" width="31" height="31" rx="4" fill="#EAEAEA" stroke="#EAEAEA" strokeWidth="1" />
          <Circle cx="17.5" cy="17.5" r="8" fill="#FFD700" />
          <Circle cx="17.5" cy="17.5" r="4" fill="#FF6B6B" />
        </Svg>
      ),
      backgroundColor: '#AEEDB4',
    },
    {
      id: 'sushi',
      name: 'Sushi',
      icon: (
        <Svg width={35} height={35} viewBox="0 0 35 35" fill="none">
          <Rect x="2" y="2" width="31" height="31" rx="4" fill="#EAEAEA" stroke="#EAEAEA" strokeWidth="1" />
          <Circle cx="12" cy="12" r="3" fill="#4CAF50" />
          <Circle cx="23" cy="12" r="3" fill="#4CAF50" />
          <Circle cx="17.5" cy="17.5" r="3" fill="#4CAF50" />
          <Circle cx="12" cy="23" r="3" fill="#4CAF50" />
          <Circle cx="23" cy="23" r="3" fill="#4CAF50" />
        </Svg>
      ),
      backgroundColor: '#D6C8F1',
    },
    {
      id: 'bao',
      name: 'Bao',
      icon: (
        <Svg width={35} height={35} viewBox="0 0 35 35" fill="none">
          <Rect x="2" y="2" width="31" height="31" rx="4" fill="#EAEAEA" stroke="#EAEAEA" strokeWidth="1" />
          <Path d="M8 15 Q17.5 8 27 15 Q17.5 22 8 15" fill="#FFD700" />
          <Path d="M8 20 Q17.5 13 27 20 Q17.5 27 8 20" fill="#FFD700" />
        </Svg>
      ),
      backgroundColor: '#F2C8BA',
    },
    {
      id: 'pastry',
      name: 'Pastry',
      icon: (
        <Svg width={35} height={35} viewBox="0 0 35 35" fill="none">
          <Rect x="2" y="2" width="31" height="31" rx="4" fill="#EAEAEA" stroke="#EAEAEA" strokeWidth="1" />
          <Path d="M8 12 Q17.5 8 27 12 Q17.5 16 8 12" fill="#8D6E63" />
          <Path d="M8 16 Q17.5 12 27 16 Q17.5 20 8 16" fill="#8D6E63" />
          <Path d="M8 20 Q17.5 16 27 20 Q17.5 24 8 20" fill="#8D6E63" />
        </Svg>
      ),
      backgroundColor: '#DDC6CF',
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Menu's</Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        {categories.map((category) => (
          <View key={category.id} style={styles.categoryItem}>
            <View style={[styles.categoryIcon, { backgroundColor: category.backgroundColor }]}>
              {category.icon}
            </View>
            <Text style={styles.categoryName}>{category.name}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 25,
    paddingBottom: 120, // Add space for cart button
  },
  sectionTitle: {
    fontFamily: 'Lato',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0.03,
    color: '#F3F4F6',
    marginBottom: 20,
  },
  categoriesContainer: {
    paddingRight: 25,
  },
  categoryItem: {
    width: 75,
    height: 102,
    marginRight: 30,
    alignItems: 'center',
  },
  categoryIcon: {
    width: 75,
    height: 75,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#EAEAEA',
    opacity: 0.25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  categoryName: {
    fontFamily: 'Lato',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    letterSpacing: 0.03,
    color: '#FAFAFA',
  },
}); 