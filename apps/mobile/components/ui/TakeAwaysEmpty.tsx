import React from 'react';
import { EmptyState } from './EmptyState';

export const TakeAwaysEmpty: React.FC = () => {
  return (
    <EmptyState
      title="No Takeaway Items"
      subtitle="We couldn't find any takeaway items at the moment. Check back soon!"
      icon="fast-food-outline"
      style={{
        paddingVertical: 40,
        paddingHorizontal: 20,
      }}
    />
  );
};

