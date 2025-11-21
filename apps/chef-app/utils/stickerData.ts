export type StickerCategory = 'reactions' | 'ratings' | 'food';

export interface Sticker {
  id: string;
  category: StickerCategory;
  text: string;
  emoji?: string;
  color?: string;
  backgroundColor?: string;
}

export const STICKERS: Record<StickerCategory, Sticker[]> = {
  reactions: [
    { id: 'omg', category: 'reactions', text: 'OMG', emoji: '😱', backgroundColor: '#FF3B30', color: '#FFFFFF' },
    { id: 'this-slaps', category: 'reactions', text: 'This slaps', emoji: '🔥', backgroundColor: '#FF9500', color: '#FFFFFF' },
    { id: 'this-bussing', category: 'reactions', text: 'This is bussing', emoji: '💯', backgroundColor: '#34C759', color: '#FFFFFF' },
    { id: 'was-mid', category: 'reactions', text: 'Shit was mid', emoji: '😐', backgroundColor: '#8E8E93', color: '#FFFFFF' },
    { id: 'was-gas', category: 'reactions', text: 'Was Gas', emoji: '⚡', backgroundColor: '#FFD60A', color: '#000000' },
    { id: 'fire', category: 'reactions', text: 'Fire', emoji: '🔥', backgroundColor: '#FF3B30', color: '#FFFFFF' },
    { id: 'no-cap', category: 'reactions', text: 'No cap', emoji: '🎩', backgroundColor: '#007AFF', color: '#FFFFFF' },
  ],
  ratings: [
    { id: '10-10-bite', category: 'ratings', text: '10/10 Bite', emoji: '⭐', backgroundColor: '#FFD60A', color: '#000000' },
    { id: 'dangerously-spicy', category: 'ratings', text: 'Dangerously spicy', emoji: '🌶️', backgroundColor: '#FF3B30', color: '#FFFFFF' },
    { id: 'cheese-illegal', category: 'ratings', text: 'Cheese level: Illegal', emoji: '🧀', backgroundColor: '#FFD60A', color: '#000000' },
    { id: 'needs-flavour', category: 'ratings', text: 'Could use more flavour', emoji: '🧂', backgroundColor: '#8E8E93', color: '#FFFFFF' },
    { id: 'perfectly-seasoned', category: 'ratings', text: 'Perfectly seasoned', emoji: '✨', backgroundColor: '#34C759', color: '#FFFFFF' },
    { id: 'melt-mouth', category: 'ratings', text: 'Melt in your mouth', emoji: '😋', backgroundColor: '#FF9500', color: '#FFFFFF' },
    { id: 'too-good', category: 'ratings', text: 'Too good to be true', emoji: '🤯', backgroundColor: '#AF52DE', color: '#FFFFFF' },
  ],
  food: [
    { id: 'pizza', category: 'food', text: '🍕', emoji: '🍕', backgroundColor: '#FF9500', color: '#FFFFFF' },
    { id: 'burger', category: 'food', text: '🍔', emoji: '🍔', backgroundColor: '#FF9500', color: '#FFFFFF' },
    { id: 'taco', category: 'food', text: '🌮', emoji: '🌮', backgroundColor: '#FF9500', color: '#FFFFFF' },
    { id: 'spice-hot', category: 'food', text: '🌶️ Hot', emoji: '🌶️', backgroundColor: '#FF3B30', color: '#FFFFFF' },
    { id: 'spice-mild', category: 'food', text: '🌶 Mild', emoji: '🌶', backgroundColor: '#FF9500', color: '#FFFFFF' },
    { id: 'temperature-hot', category: 'food', text: '🔥 Hot', emoji: '🔥', backgroundColor: '#FF3B30', color: '#FFFFFF' },
    { id: 'temperature-cold', category: 'food', text: '❄️ Cold', emoji: '❄️', backgroundColor: '#5AC8FA', color: '#FFFFFF' },
  ],
};

export const getStickersByCategory = (category: StickerCategory): Sticker[] => {
  return STICKERS[category] || [];
};

export const getAllStickers = (): Sticker[] => {
  return Object.values(STICKERS).flat();
};

export const getStickerById = (id: string): Sticker | undefined => {
  return getAllStickers().find(sticker => sticker.id === id);
};

