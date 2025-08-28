import PaymentScreen from "@/components/ui/PaymentScreen";
import { router } from "expo-router";

export default function Payment() {
  const handlePaymentSuccess = () => {
    // Navigate to the success screen
    router.push("/orders/cart/success");
  };

  return (
    <PaymentScreen
      orderTotal={34}
      deliveryFee={9}
      onPaymentSuccess={handlePaymentSuccess}
    />
  );
}
