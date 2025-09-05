import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function MealOptions() {
  const handleBack = () => {
    router.back();
  };

  const handleConfirm = () => {
    // Navigate to "it's on you" screen
    router.push('/shared-ordering/its-on-you');
  };

  const handleSelectDiet = () => {
    // Navigate to diet selection screen
    console.log('Navigate to diet selection');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back and confirm */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={20} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton}>
          <Text style={styles.confirmText}>Confirm</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>
          Meal{'\n'}Options
        </Text>

        {/* Description */}
        <Text style={styles.description}>
          You can limit this On me to diet or let them choose, remember it&apos;s one time only
        </Text>

        {/* Select Diet Button */}
        <TouchableOpacity style={styles.selectDietButton} onPress={handleSelectDiet}>
          <Text style={styles.selectDietText}>Select Diet</Text>
        </TouchableOpacity>

        {/* Takeout box image */}
        <View style={styles.imageContainer}>
          <Image
            source={require('../../assets/images/on-your-account-image-01.png')}
            style={styles.takeoutImage}
            resizeMode="contain"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#02120A',
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
  },
  takeoutImage: {
    width: 200,
    height: 200,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  confirmButton: {
    padding: 8,
  },
  confirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    lineHeight: 52,
    marginBottom: 24,
    textShadowColor: '#FF3B30',
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 12,
  },
  description: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
    marginBottom: 32,
  },
  selectDietButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 50,
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: 'center',
    width: '50%',
    alignSelf: 'flex-start',
  },
  selectDietText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
  },
});