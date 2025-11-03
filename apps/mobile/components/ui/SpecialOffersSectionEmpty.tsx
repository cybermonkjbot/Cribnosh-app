import React from 'react';
import { EmptyState } from './EmptyState';

interface SpecialOffersSectionEmptyProps {
  onBrowseAll?: () => void;
}

export const SpecialOffersSectionEmpty: React.FC<SpecialOffersSectionEmptyProps> = ({
  onBrowseAll,
}) => {
  return (
    <EmptyState
      title="No Special Offers"
      subtitle="There are no special offers available at the moment. Check back soon for great deals!"
      icon="pricetag-outline"
      actionButton={
        onBrowseAll
          ? {
              label: 'Browse All Offers',
              onPress: onBrowseAll,
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

