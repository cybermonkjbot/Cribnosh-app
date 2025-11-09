type Position = { top: number; left: number };

export function getAvatarPositions(
  count: number,
  radius: number,
  centerX: number,
  centerY: number
): Position[] {
  const angleStep = (2 * Math.PI) / count;
  const positions: Position[] = [];

  for (let i = 0; i < count; i++) {
    const angle = i * angleStep;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    positions.push({ left: x, top: y });
  }

  return positions;
}


// Placeholder avatars for fallback use (when user avatar is not available)
export const placeholderAvatars = [
    { uri: require('@/assets/images/demo/avatar-1.png') },
    { uri: require('@/assets/images/demo/avatar-2.png') },
    { uri: require('@/assets/images/demo/avatar-3.png') },
    { uri: require('@/assets/images/demo/avatar-4.png') },
    { uri: require('@/assets/images/demo/avatar-5.png') },
];

// Deprecated: groupMembers removed - use real data from API instead
// This export is kept for backward compatibility but should not be used
