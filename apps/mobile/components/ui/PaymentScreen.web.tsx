import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

interface PaymentScreenProps {
    onPaymentSuccess?: (orderId?: string) => void;
    // ... other props
}

export default function PaymentScreen(props: PaymentScreenProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Payment Required</Text>
            <Text style={styles.text}>
                Please use the CribNosh mobile app to initiate payments.
            </Text>
            <Pressable
                style={styles.button}
                onPress={() => Linking.openURL('https://cribnosh.co.uk/download')}
            >
                <Text style={styles.buttonText}>Download App</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#094327',
    },
    text: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
        color: '#374151',
    },
    button: {
        backgroundColor: '#094327',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
});
