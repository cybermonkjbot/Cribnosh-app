import React from 'react';
import { EmptyState } from './EmptyState';

export const CuisineCategoriesSectionEmpty: React.FC = () => {
  return (
    <EmptyState
      title="No Cuisine Categories"
      subtitle="We couldn't find any cuisine categories at the moment. Check back soon!"
      icon="restaurant-outline"
      style={{
        paddingVertical: 40,
        paddingHorizontal: 20,
      }}
    />
  );
};

