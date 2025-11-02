import PaymentScreen from "@/components/ui/PaymentScreen";
import { router } from "expo-router";

export default function Payment() {
  const handlePaymentSuccess = (orderId?: string) => {
    // Navigate to the success screen with order_id
    if (orderId) {
      router.push(`/orders/cart/success?order_id=${orderId}`);
    } else {
      router.push("/orders/cart/success");
    }
  };

  return (
    <PaymentScreen
      onPaymentSuccess={handlePaymentSuccess}
    />
  );
}
