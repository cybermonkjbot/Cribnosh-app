import React, { useEffect, useState } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';

const { height, width } = Dimensions.get('window');

interface Reaction {
    id: string;
    type: 'heart' | 'fire' | 'clap' | 'star';
    xOffset: number;
}

interface LiveReactionsOverlayProps {
    reactionCount: number; // Increment this to trigger a new reaction visually
}

const getRandomOffset = () => (Math.random() * 60) - 30; // Random offset between -30 and 30
const getRandomType = (): 'heart' | 'fire' | 'clap' | 'star' => {
    const types: ('heart' | 'fire' | 'clap' | 'star')[] = ['heart', 'heart', 'heart', 'fire', 'clap', 'star'];
    return types[Math.floor(Math.random() * types.length)];
};

const getEmojiForType = (type: string) => {
    switch (type) {
        case 'heart': return '❤️';
        case 'fire': return '🔥';
        case 'clap': return '👏';
        case 'star': return '⭐';
        default: return '❤️';
    }
};

const FloatingReaction = ({ reaction, onComplete }: { reaction: Reaction; onComplete: (id: string) => void }) => {
    const translateY = new Animated.Value(0);
    const opacity = new Animated.Value(1);
    const scale = new Animated.Value(0);

    useEffect(() => {
        // Pop in
        Animated.spring(scale, {
            toValue: 1 + Math.random() * 0.5,
            tension: 50,
            friction: 3,
            useNativeDriver: true,
        }).start();

        // Float up and fade out
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -height * 0.4, // Float up 40% of the screen
                duration: 3000 + Math.random() * 1000,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 3000 + Math.random() * 1000,
                delay: 500,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onComplete(reaction.id);
        });
    }, []);

    return (
        <Animated.Text
            style={[
                styles.reaction,
                {
                    transform: [
                        { translateY },
                        { scale },
                        { translateX: reaction.xOffset }
                    ],
                    opacity,
                }
            ]}
        >
            {getEmojiForType(reaction.type)}
        </Animated.Text>
    );
};

export const LiveReactionsOverlay: React.FC<LiveReactionsOverlayProps> = ({ reactionCount }) => {
    const [reactions, setReactions] = useState<Reaction[]>([]);

    useEffect(() => {
        if (reactionCount > 0) {
            const newReaction: Reaction = {
                id: Math.random().toString(),
                type: getRandomType(),
                xOffset: getRandomOffset(),
            };
            setReactions(prev => [...prev, newReaction]);
        }
    }, [reactionCount]);

    const handleComplete = (id: string) => {
        setReactions(prev => prev.filter(r => r.id !== id));
    };

    return (
        <View style={styles.container} pointerEvents="none">
            {reactions.map(reaction => (
                <FloatingReaction
                    key={reaction.id}
                    reaction={reaction}
                    onComplete={handleComplete}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        paddingBottom: 150, // Start above the comments
        paddingRight: 40,
        zIndex: 10,
    },
    reaction: {
        position: 'absolute',
        bottom: 0,
        fontSize: 32,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    }
});
