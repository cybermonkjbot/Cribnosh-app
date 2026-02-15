import { useRouter } from 'expo-router';
import { Users } from 'lucide-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SharedOrderingButtonProps {
  style?: any;
}

export function SharedOrderingButton({ style }: SharedOrderingButtonProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push('/shared-ordering' as any);
    // router.push('/shared-link');
  };

  return (
    <TouchableOpacity style={[styles.container, style]} onPress={handlePress}>
      <View style={styles.iconContainer}>
        <Users size={24} color="#fff" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>Shared Ordering</Text>
        <Text style={styles.subtitle}>Let friends order on your account</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
