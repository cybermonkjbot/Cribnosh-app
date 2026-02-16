import { StyleSheet, Text, View } from 'react-native';

interface AddCardSheetProps {
    isVisible: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function AddCardSheet({ isVisible, onClose }: AddCardSheetProps) {
    if (!isVisible) return null;

    return (
        <View style={styles.container}>
            <Text style={styles.text}>Adding cards is only supported in the mobile app.</Text>
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
