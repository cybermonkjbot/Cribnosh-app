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


export const avatars = [
    { uri: require('@/assets/images/demo/avatar-1.png') },
    { uri: require('@/assets/images/demo/avatar-2.png') },
    { uri: require('@/assets/images/demo/avatar-3.png') },
    { uri: require('@/assets/images/demo/avatar-4.png') },
    { uri: require('@/assets/images/demo/avatar-5.png') },
]

export const groupMembers = [
    { name: 'Fola', avatarUri: require('@/assets/images/demo/avatar-1.png'), top: 0, left: 0 },
    { name: 'Josh', avatarUri: require('@/assets/images/demo/avatar-2.png'), top: 50, left: 50 },
    { name: 'Sarah', avatarUri: require('@/assets/images/demo/avatar-3.png'), top: 100, left: 100 },
    { name: 'Mike', avatarUri: require('@/assets/images/demo/avatar-4.png'), top: 150, left: 150 },
    { name: 'Emma', avatarUri: require('@/assets/images/demo/avatar-5.png'), top: 200, left: 200 },
    { name: 'Alex', avatarUri: require('@/assets/images/demo/avatar-5.png'), top: 250, left: 250 },
];
