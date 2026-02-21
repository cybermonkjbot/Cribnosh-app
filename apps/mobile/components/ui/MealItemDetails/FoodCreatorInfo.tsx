import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';

interface FoodCreatorInfoProps {
  foodCreatorName: string;
  foodCreatorAvatar?: string;
  onPress?: () => void;
}

export function FoodCreatorInfo({ foodCreatorName, foodCreatorAvatar, onPress }: FoodCreatorInfoProps) {
  // Split foodCreator name to separate "Stans FoodCreator's" and "Burgers"
  const nameParts = foodCreatorName.split("'s ");
  const foodCreatorNamePart = nameParts[0] + "'s";
  const categoryPart = nameParts[1] || "";

  const content = (
    <>
      {/* FoodCreator Avatar */}
      <View style={styles.avatarContainer}>
        {foodCreatorAvatar ? (
          <Image 
            source={{ uri: foodCreatorAvatar }} 
            style={styles.avatarImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.avatarPlaceholder} />
        )}
        {/* Confetti elements around avatar */}
        <View style={styles.confetti1} />
        <View style={styles.confetti2} />
        <View style={styles.confetti3} />
      </View>
      
      {/* FoodCreator Name */}
      <View style={styles.nameContainer}>
        <Text style={styles.foodCreatorName}>{foodCreatorNamePart}</Text>
        <Text style={styles.categoryName}>{categoryPart}</Text>
      </View>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity 
        style={styles.container}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 15,
  },
  
  // Avatar container with confetti
  avatarContainer: {
    position: 'relative',
    width: 50,
    height: 50,
    marginRight: 15,
  },
  
  // Avatar image
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  
  // Avatar placeholder
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#C4C4C4',
  },
  
  // Confetti elements
  confetti1: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B6B',
    top: -2,
    right: -2,
  },
  
  confetti2: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ECDC4',
    bottom: -1,
    left: -1,
  },
  
  confetti3: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFE66D',
    top: 5,
    right: -3,
  },
  
  // Name container
  nameContainer: {
    flex: 1,
  },
  
  // FoodCreator name (red text)
  foodCreatorName: {
    fontFamily: 'SF Pro',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 20,
    color: '#FF3B30',
    marginBottom: 2,
  },
  
  // Category name (dark green, larger)
  categoryName: {
    fontFamily: 'SF Pro',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 28,
    color: '#094327',
  },
}); 