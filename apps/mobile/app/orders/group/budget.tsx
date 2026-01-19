import { useAuthContext } from '@/contexts/AuthContext';
import { api } from '@/convex/_generated/api';
import { useMutation } from 'convex/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Wallet } from 'lucide-react-native';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GroupOrderBudget() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuthContext();

    const chipIn = useMutation(api.mutations.groupOrders.chipInToBudget);
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChipIn = async () => {
        if (!id || !user) return;

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            Alert.alert("Invalid Amount", "Please enter a valid amount to contribute.");
            return;
        }

        try {
            setIsLoading(true);
            await chipIn({
                group_order_id: id as any,
                user_id: user.id as any,
                amount: parsedAmount
            });

            Alert.alert("Success", "Contribution added!", [
                { text: "OK", onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to contribute.");
        } finally {
            setIsLoading(false);
        }
    };

    const presetAmounts = [5, 10, 15, 20];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft color="#094327" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chip In</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Wallet size={48} color="#094327" />
                </View>

                <Text style={styles.title}>Add to Budget</Text>
                <Text style={styles.subtitle}>
                    How much would you like to contribute to the group order budget?
                </Text>

                <View style={styles.inputContainer}>
                    <Text style={styles.currencySymbol}>£</Text>
                    <TextInput
                        style={styles.amountInput}
                        value={amount}
                        onChangeText={setAmount}
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                        autoFocus
                    />
                </View>

                <View style={styles.presetsContainer}>
                    {presetAmounts.map((val) => (
                        <TouchableOpacity
                            key={val}
                            style={styles.presetButton}
                            onPress={() => setAmount(val.toString())}
                        >
                            <Text style={styles.presetText}>£{val}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleChipIn}
                    disabled={isLoading || !amount}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.confirmButtonText}>Confirm Contribution</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFFFA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontFamily: 'Archivo',
        fontWeight: '600',
        fontSize: 18,
        color: '#094327',
    },
    content: {
        flex: 1,
        padding: 24,
        alignItems: 'center',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E6F4EA',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontFamily: 'Archivo',
        fontWeight: '700',
        fontSize: 24,
        color: '#094327',
        marginBottom: 12,
    },
    subtitle: {
        fontFamily: 'Inter',
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 32,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: '#094327',
        paddingBottom: 8,
        marginBottom: 32,
        width: '60%',
        justifyContent: 'center',
    },
    currencySymbol: {
        fontFamily: 'Archivo',
        fontWeight: '600',
        fontSize: 32,
        color: '#094327',
        marginRight: 4,
    },
    amountInput: {
        fontFamily: 'Archivo',
        fontWeight: '600',
        fontSize: 48,
        color: '#094327',
        minWidth: 100,
        textAlign: 'center',
    },
    presetsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 40,
    },
    presetButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    presetText: {
        fontFamily: 'Inter',
        fontWeight: '600',
        color: '#1F2937',
    },
    confirmButton: {
        backgroundColor: '#094327',
        width: '100%',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#094327',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    confirmButtonText: {
        color: '#FFFFFF',
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 18,
    },
});
