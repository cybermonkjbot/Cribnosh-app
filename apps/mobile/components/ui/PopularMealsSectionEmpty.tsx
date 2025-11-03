import React from 'react';
import { EmptyState } from './EmptyState';

interface PopularMealsSectionEmptyProps {
  onBrowseAll?: () => void;
}

export const PopularMealsSectionEmpty: React.FC<PopularMealsSectionEmptyProps> = ({
  onBrowseAll,
}) => {
  return (
    <EmptyState
      title="No Popular Meals"
      subtitle="We couldn't find any popular meals at the moment. Check back soon!"
      icon="restaurant-outline"
      actionButton={
        onBrowseAll
          ? {
              label: 'Browse All Meals',
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

