import React from 'react';
import { EmptyState } from './EmptyState';

export const SpecialOffersSectionEmpty: React.FC = () => {
  return (
    <EmptyState
      title="No Special Offers"
      subtitle="There are no special offers available at the moment. Check back soon for great deals!"
      icon="pricetag-outline"
      style={{
        paddingVertical: 40,
        paddingHorizontal: 20,
      }}
    />
  );
};

