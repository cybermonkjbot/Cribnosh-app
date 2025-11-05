import React from 'react';
import { EmptyState } from './EmptyState';

export const PopularMealsSectionEmpty: React.FC = () => {
  return (
    <EmptyState
      title="No Popular Meals"
      subtitle="We couldn't find any popular meals at the moment. Check back soon!"
      icon="restaurant-outline"
      style={{
        paddingVertical: 40,
        paddingHorizontal: 20,
      }}
    />
  );
};

