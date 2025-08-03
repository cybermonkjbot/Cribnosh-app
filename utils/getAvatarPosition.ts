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
