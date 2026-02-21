import React from 'react';
import { EmptyState } from './EmptyState';

export const FeaturedFoodCreatorsSectionEmpty: React.FC = () => {
  return (
    <EmptyState
      title="No Featured FoodCreators"
      subtitle="We couldn't find any featured foodCreators at the moment. Check back soon!"
      icon="storefront-outline"
      style={{
        paddingVertical: 40,
        paddingHorizontal: 20,
      }}
    />
  );
};

