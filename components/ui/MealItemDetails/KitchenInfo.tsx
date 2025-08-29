import { Image, StyleSheet, Text, View } from 'react-native';

interface KitchenInfoProps {
  kitchenName: string;
  kitchenAvatar?: string;
}

export function KitchenInfo({ kitchenName, kitchenAvatar }: KitchenInfoProps) {
  // Split kitchen name to separate "Stans Kitchen's" and "Burgers"
  const nameParts = kitchenName.split("'s ");
  const kitchenNamePart = nameParts[0] + "'s";
  const categoryPart = nameParts[1] || "";

  return (
    <View style={styles.container}>
      {/* Kitchen Avatar */}
      <View style={styles.avatarContainer}>
        {kitchenAvatar ? (
          <Image 
            source={{ uri: kitchenAvatar }} 
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
      
      {/* Kitchen Name */}
      <View style={styles.nameContainer}>
        <Text style={styles.kitchenName}>{kitchenNamePart}</Text>
        <Text style={styles.categoryName}>{categoryPart}</Text>
      </View>
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
  
  // Kitchen name (red text)
  kitchenName: {
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