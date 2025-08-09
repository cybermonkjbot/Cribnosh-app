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
    { uri: 'https://avatar.iran.liara.run/public/44' },
    { uri: 'https://avatar.iran.liara.run/public/47' },
    { uri: 'https://avatar.iran.liara.run/public/27' },
    { uri: 'https://avatar.iran.liara.run/public/12' },
    { uri: 'https://avatar.iran.liara.run/public/16' },
]

export const groupMembers = [
  { name: 'Fola', avatarUri: 'https://avatar.iran.liara.run/public/44', top: 0, left: 0 },
  { name: 'Josh', avatarUri: 'https://avatar.iran.liara.run/public/47', top: 50, left: 50 },
  { name: 'Sarah', avatarUri: 'https://avatar.iran.liara.run/public/27', top: 100, left: 100 },
  { name: 'Mike', avatarUri: 'https://avatar.iran.liara.run/public/12', top: 150, left: 150 },
  { name: 'Emma', avatarUri: 'https://avatar.iran.liara.run/public/16', top: 200, left: 200 },
  { name: 'Alex', avatarUri: 'https://avatar.iran.liara.run/public/16', top: 250, left: 250 },
];
