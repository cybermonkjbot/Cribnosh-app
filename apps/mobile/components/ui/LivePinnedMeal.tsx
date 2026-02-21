import { Image } from 'expo-image';
import { Pin } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface LivePinnedMealProps {
    mealData: {
        title: string;
        price: string;
        imageSource: any;
        description?: string;
    } | null;
    onPress: () => void;
}

export const LivePinnedMeal: React.FC<LivePinnedMealProps> = ({ mealData, onPress }) => {
    if (!mealData || !mealData.title) return null;

    return (
        <TouchableOpacity style={styles.container} activeOpacity={0.8} onPress={onPress}>
            <View style={styles.pinHeader}>
                <Pin color="#E6FFE8" size={12} />
                <Text style={styles.pinText}>Pinned</Text>
            </View>
            <View style={styles.contentRow}>
                <Image
                    source={typeof mealData.imageSource === 'string' ? { uri: mealData.imageSource } : mealData.imageSource}
                    style={styles.image}
                    contentFit="cover"
                />
                <View style={styles.info}>
                    <Text style={styles.title} numberOfLines={1}>{mealData.title}</Text>
                    <Text style={styles.price}>{mealData.price}</Text>
                </View>
                <View style={styles.buyButton}>
                    <Text style={styles.buyText}>Buy</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 12,
        padding: 8,
        marginBottom: 12,
        marginHorizontal: 10,
        borderWidth: 1,
        borderColor: 'rgba(230, 255, 232, 0.2)',
    },
    pinHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 6,
        paddingHorizontal: 4,
    },
    pinText: {
        color: '#E6FFE8',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    image: {
        width: 40,
        height: 40,
        borderRadius: 8,
    },
    info: {
        flex: 1,
    },
    title: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    price: {
        color: '#E6FFE8',
        fontSize: 13,
        fontWeight: '700',
        marginTop: 2,
    },
    buyButton: {
        backgroundColor: '#FF3B30',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    buyText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    }
});
