import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import {
    Dimensions,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const { height: screenHeight } = Dimensions.get('window');

// Floating TopContent Component
interface TopContentProps {
  amount: string;
  setAmount: (value: string) => void;
  selectedAmount: string | null;
  handleAmountSelect: (value: string) => void;
  presetAmounts: string[];
}

const TopContent = ({ amount, setAmount, selectedAmount, handleAmountSelect, presetAmounts }: TopContentProps) => {
  return (
    <View style={styles.floatingTopContent}>
      <Text style={styles.title}>
        Let friends{'\n'}and family order on{'\n'}your account
      </Text>
      
      <Text style={styles.budgetLabel}>
        Choose Budget
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
  );
};

export default function SharedOrderingIndex() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<string | null>(null);

  const presetAmounts = ['10', '20', '50', 'Unlimited'];

  const handleBack = () => {
    router.back();
  };

  const handleStartSetup = () => {
    router.push('/shared-ordering/meal-options');
  };

  const handleAmountSelect = (value: string) => {
    setSelectedAmount(value);
    if (value === 'Unlimited') {
      setAmount('');
    } else {
      setAmount(value);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background image with proper sizing */}
      <View style={styles.imageContainer}>
        <Image
          source={require('../../assets/images/on-your-account-image-01.png')}
          style={styles.takeoutImage}
          resizeMode="contain"
        />
      </View>

      {/* Header with arrow and done */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleStartSetup} style={styles.doneButton}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </View>

      {/* Floating TopContent Component */}
      <TopContent
        amount={amount}
        setAmount={setAmount}
        selectedAmount={selectedAmount}
        handleAmountSelect={handleAmountSelect}
        presetAmounts={presetAmounts}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF3B30',
  },
  // imageContainer: {
  //   position: 'absolute',
  //   bottom: 0,
  //   left: 0,
  //   right: 0,
  //   top:120,
  //   height: '100%',
  //   justifyContent: 'flex-end',
  //   alignItems: 'center',
  // },
  // takeoutImage: {
  //   width: '100%',
  //   height: '100%',
  
  // },
  imageContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    height: '60%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: -10,
  },
  takeoutImage: {
  width: '90%',
    height: '90%',
  },
  header: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  doneButton: {
    padding: 8,
  },
  doneText: {
    color: '#fff',
    fontSize: 16,
  },
  floatingTopContent: {
    position: 'absolute',
    top: screenHeight * 0.1,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 28,
    boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.3)',
    elevation: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.01)',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'left',
    marginBottom: 20,
    lineHeight: 34,
    textShadowColor: '#094327',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  budgetLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#333',
    textAlign: 'left',
    lineHeight: 24,
    marginBottom: 30,
    paddingHorizontal: 0,
  },
  startButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    alignSelf: 'flex-start',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 20,
    width: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginLeft: 8,
  },
  presetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  presetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'flex-start',
    minWidth: 60,
    justifyContent: 'center',
  },
  presetButtonSelected: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  presetButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  presetButtonTextSelected: {
    fontWeight: '800',
    color: '#fff',
  },
});
