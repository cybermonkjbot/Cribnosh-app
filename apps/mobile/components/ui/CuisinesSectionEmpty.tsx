import React from 'react';
import { EmptyState } from './EmptyState';

export const CuisinesSectionEmpty: React.FC = () => {
  return (
    <EmptyState
      title="No Cuisines Available"
      subtitle="We couldn't find any cuisines at the moment. Check back soon!"
      icon="restaurant-outline"
      style={{
        paddingVertical: 40,
        paddingHorizontal: 20,
      }}
    />
  );
};

