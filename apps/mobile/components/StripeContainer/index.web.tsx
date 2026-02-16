import React from 'react';

interface StripeContainerProps {
    children: React.ReactNode;
}

export function StripeContainer({ children }: StripeContainerProps) {
    return <>{children}</>;
}
