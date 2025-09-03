import { useRouter } from 'expo-router';
import { ChevronDown } from 'lucide-react-native';
import { useState } from 'react';
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

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
      {/* Close-up takeout box image as the main focus */}
      <View style={styles.imageContainer}>
        <Image
          source={require('../../assets/images/on-your-account-image-01.png')}
          style={styles.takeoutImage}
          resizeMode="cover"
        />
      </View>

      {/* Header with arrow and done */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ChevronDown size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleStartSetup} style={styles.doneButton}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </View>

      {/* Top content area */}
      <View style={styles.topContent}>
        <Text style={styles.title}>
          Let friends{'\n'}and family order on{'\n'}your account
        </Text>
        
        <Text style={{color:'#fff', fontSize: 16, fontWeight: '600'}}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF3B30',
  },
  imageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  takeoutImage: {
    width: '100%',
    height: '100%',
  },
  header: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
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
  topContent: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 24,
    marginTop: 16,
    width: '70%',
  
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#eee',
  },
  presetContainer: {
    flexDirection: 'row',
    gap: 12,
    
  },
  presetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 0,
    marginTop: 0,
    // Responsive width based on content
    alignSelf: 'flex-start',
  },
  presetButtonSelected: {
    backgroundColor: '#991b1b',
  },
  presetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
  },
  presetButtonTextSelected: {
    fontWeight: '700',
  },
});
