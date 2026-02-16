import { StyleSheet, Text, View } from 'react-native';

interface TopUpBalanceSheetProps {
    isVisible: boolean;
    onClose: () => void;
}

export function TopUpBalanceSheet({ isVisible, onClose }: TopUpBalanceSheetProps) {
    if (!isVisible) return null;

    return (
        <View style={styles.container}>
            <Text style={styles.text}>Top up is only supported in the mobile app.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        alignItems: 'center',
    },
    text: {
        fontSize: 16,
        color: '#374151',
        textAlign: 'center',
    },
});
