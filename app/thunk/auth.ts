import { Dispatch } from "react";
import { PhoneLoginData } from "../types/auth";

export function phoneLogin(data: PhoneLoginData) {
  return async (dispatch: Dispatch<any>) => {
    try {
      // Make API call directly using fetch
      const response = await fetch("https://cribnosh.com/api/auth/phone-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: data.phone, action: "send" }),
      });
      console.log("Phone login data:", data);
    } catch (error) {
      console.error(error);
    }
  };
}
