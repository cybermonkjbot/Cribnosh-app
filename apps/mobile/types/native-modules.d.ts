import * as React from "react";

declare module "@/components/ui/AddCardSheet" {
  export interface AddCardSheetProps {
    isVisible: boolean;
    onClose: () => void;
    onSuccess?: () => void;
  }

  export function AddCardSheet(props: AddCardSheetProps): JSX.Element | null;
}

declare module "@/components/ui/TopUpBalanceSheet" {
  export interface TopUpBalanceSheetProps {
    isVisible: boolean;
    onClose: () => void;
  }

  export function TopUpBalanceSheet(
    props: TopUpBalanceSheetProps,
  ): JSX.Element | null;
}

declare module "@/components/ui/PaymentScreen" {
  export interface PaymentScreenProps {
    onPaymentSuccess?: (orderId?: string) => void;
  }

  export default function PaymentScreen(
    props: PaymentScreenProps,
  ): JSX.Element | null;
}

declare module "@/components/StripeContainer" {
  export interface StripeContainerProps {
    children: React.ReactNode;
  }

  export function StripeContainer(
    props: StripeContainerProps,
  ): JSX.Element | null;
}

declare module "@/components/PayForOrderScreen" {
  export interface PayForOrderScreenProps {
    token: string;
  }

  const PayForOrderScreen: React.ComponentType<PayForOrderScreenProps>;
  export default PayForOrderScreen;
}
