import React from 'react';
import { EmptyState } from './EmptyState';

interface TakeAwaysEmptyProps {
  onBrowseAll?: () => void;
}

export const TakeAwaysEmpty: React.FC<TakeAwaysEmptyProps> = ({
  onBrowseAll,
}) => {
  return (
    <EmptyState
      title="No Takeaway Items"
      subtitle="We couldn't find any takeaway items at the moment. Check back soon!"
      icon="fast-food-outline"
      actionButton={
        onBrowseAll
          ? {
              label: 'Browse All Items',
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

