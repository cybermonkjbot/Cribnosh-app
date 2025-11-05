import React from 'react';
import { EmptyState } from './EmptyState';

interface TooFreshToWasteEmptyProps {
  onOpenSustainability?: () => void;
}

export const TooFreshToWasteEmpty: React.FC<TooFreshToWasteEmptyProps> = ({
  onOpenSustainability,
}) => {
  return (
    <EmptyState
      title="No Eco Nosh Items"
      subtitle="There are no sustainability items available at the moment. Help reduce food waste by checking back soon!"
      icon="leaf-outline"
      actionButton={
        onOpenSustainability
          ? {
              label: 'Learn More',
              onPress: onOpenSustainability,
            }
          : undefined
      }
      style={{
        paddingVertical: 40,
        paddingHorizontal: 20,
      }}
    />
  );
};

