import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronDown } from 'lucide-react-native';
import { useState } from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';



export default function SharedOrderingSetup() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<string | null>(null);

  const presetAmounts = ['10', '20', '50', 'Unlimited'];

  const handleAmountSelect = (value: string) => {
    setSelectedAmount(value);
    if (value === 'Unlimited') {
      setAmount('');
    } else {
      setAmount(value);
    }
  };

  const handleDone = () => {
    // Navigate to meal options screen
    router.push('/shared-ordering/meal-options');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#FF3B30', '#FF6B6B', '#FF3B30']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ChevronDown size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDone} style={styles.doneButton}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>
            Let friends{'\n'}and family order on{'\n'}your account
          </Text>

          {/* Amount Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.amountInput}
              placeholder="Enter amount"
              placeholderTextColor="#999"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              editable={selectedAmount !== 'Unlimited'}
            />
            <Text style={styles.currencySymbol}>£</Text>
          </View>

          {/* Preset Amount Buttons */}
          <View style={styles.presetContainer}>
            {presetAmounts.map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[
                  styles.presetButton,
                  selectedAmount === preset && styles.presetButtonSelected,
                ]}
                onPress={() => handleAmountSelect(preset)}
              >
                <Text
                  style={[
                    styles.presetButtonText,
                    selectedAmount === preset && styles.presetButtonTextSelected,
                  ]}
                >
                  {preset}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 3D Illustration */}
        <View style={styles.illustrationContainer}>
          <View style={styles.takeoutBox}>
            {/* Takeout Box */}
            <View style={styles.boxContainer}>
              <View style={styles.boxFront}>
                <Text style={styles.japaneseChar}>あ</Text>
              </View>
              <View style={styles.boxTop} />
              <View style={styles.boxLeft} />
              <View style={styles.boxRight} />
              <View style={styles.boxBack} />
            </View>

            {/* Noodles and Food */}
            <View style={styles.foodContainer}>
              <View style={styles.noodles} />
              <View style={styles.protein1} />
              <View style={styles.protein2} />
              <View style={styles.vegetable1} />
              <View style={styles.vegetable2} />
            </View>

            {/* Chopsticks */}
            <View style={styles.chopstick1} />
            <View style={styles.chopstick2} />
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
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
    padding: 8,
  },
  doneButton: {
    padding: 8,
  },
  doneText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#16a34a',
    lineHeight: 38,
    marginBottom: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 24,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    color: '#333',
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  presetContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  presetButton: {
    flex: 1,
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  presetButtonSelected: {
    backgroundColor: '#991b1b',
  },
  presetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  presetButtonTextSelected: {
    fontWeight: '700',
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  takeoutBox: {
    position: 'relative',
    width: 200,
    height: 200,
  },
  boxContainer: {
    position: 'relative',
    width: 120,
    height: 80,
    left: 40,
    top: 60,
  },
  boxFront: {
    position: 'absolute',
    width: 120,
    height: 80,
    backgroundColor: '#f97316',
    borderWidth: 2,
    borderColor: '#ea580c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  boxTop: {
    position: 'absolute',
    width: 120,
    height: 20,
    backgroundColor: '#fb923c',
    borderWidth: 2,
    borderColor: '#ea580c',
    top: -10,
  },
  boxLeft: {
    position: 'absolute',
    width: 20,
    height: 80,
    backgroundColor: '#ea580c',
    borderWidth: 2,
    borderColor: '#dc2626',
    left: -10,
  },
  boxRight: {
    position: 'absolute',
    width: 20,
    height: 80,
    backgroundColor: '#ea580c',
    borderWidth: 2,
    borderColor: '#dc2626',
    right: -10,
  },
  boxBack: {
    position: 'absolute',
    width: 120,
    height: 80,
    backgroundColor: '#f97316',
    borderWidth: 2,
    borderColor: '#ea580c',
  },
  japaneseChar: {
    fontSize: 48,
    color: '#fef3c7',
    fontWeight: 'bold',
  },
  foodContainer: {
    position: 'absolute',
    width: 100,
    height: 60,
    left: 50,
    top: 70,
  },
  noodles: {
    position: 'absolute',
    width: 80,
    height: 40,
    backgroundColor: '#fbbf24',
    borderRadius: 20,
    top: 10,
    left: 10,
  },
  protein1: {
    position: 'absolute',
    width: 12,
    height: 12,
    backgroundColor: '#dc2626',
    borderRadius: 6,
    top: 15,
    left: 20,
  },
  protein2: {
    position: 'absolute',
    width: 10,
    height: 10,
    backgroundColor: '#dc2626',
    borderRadius: 5,
    top: 25,
    left: 60,
  },
  vegetable1: {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: '#16a34a',
    borderRadius: 4,
    top: 20,
    left: 40,
  },
  vegetable2: {
    position: 'absolute',
    width: 6,
    height: 6,
    backgroundColor: '#16a34a',
    borderRadius: 3,
    top: 30,
    left: 70,
  },
  chopstick1: {
    position: 'absolute',
    width: 60,
    height: 4,
    backgroundColor: '#fbbf24',
    borderRadius: 2,
    top: 50,
    left: 20,
  },
  chopstick2: {
    position: 'absolute',
    width: 60,
    height: 4,
    backgroundColor: '#fbbf24',
    borderRadius: 2,
    top: 55,
    left: 25,
  },
});
