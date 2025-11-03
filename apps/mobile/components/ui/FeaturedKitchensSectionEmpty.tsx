import React from 'react';
import { EmptyState } from './EmptyState';

export const FeaturedKitchensSectionEmpty: React.FC = () => {
  return (
    <EmptyState
      title="No Featured Kitchens"
      subtitle="We couldn't find any featured kitchens at the moment. Check back soon!"
      icon="storefront-outline"
      style={{
        paddingVertical: 40,
        paddingHorizontal: 20,
      }}
    />
  );
};

