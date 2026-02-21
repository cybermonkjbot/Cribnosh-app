import React from 'react';
import { EmptyState } from './EmptyState';

export const TopKebabsEmpty: React.FC = () => {
  return (
    <EmptyState
      title="No Top Kebabs"
      subtitle="We couldn't find any kebabs from top foodCreators at the moment. Check back soon!"
      icon="restaurant-outline"
      style={{
        paddingVertical: 40,
        paddingHorizontal: 20,
      }}
    />
  );
};

