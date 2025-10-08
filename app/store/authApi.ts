// app/store/authApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import * as SecureStore from "expo-secure-store";
import { isTokenExpired } from "../../utils/jwtUtils";
import {
  PhoneLoginData,
  PhoneLoginResponse,
  SendLoginOTPResponse,
} from "../types/auth";

const baseQuery = fetchBaseQuery({
  baseUrl: "https://cribnosh.com/api",
  prepareHeaders: async (headers) => {
    const token = await SecureStore.getItemAsync("cribnosh_token");
    if (token) {
      // Check if token is expired before adding to headers
      if (isTokenExpired(token)) {
        // Clear expired token
        await SecureStore.deleteItemAsync("cribnosh_token");
        await SecureStore.deleteItemAsync("cribnosh_user");
        // Don't add the expired token to headers
        console.log("Token expired, cleared from storage");
      } else {
        headers.set("authorization", `Bearer ${token}`);
      }
    }
    headers.set("accept", "application/json");
    return headers;
  },
});

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery,
  tagTypes: ["Auth", "User"],
  endpoints: (builder) => ({
    sendLoginOTP: builder.mutation<SendLoginOTPResponse, PhoneLoginData>({
      query: (data) => ({
        url: "/auth/phone-signin",
        method: "POST",
        body: data,
      }),
    }),
    phoneLogin: builder.mutation<PhoneLoginResponse, PhoneLoginData>({
      query: (data) => ({
        url: "/auth/phone-signin",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const { useSendLoginOTPMutation, usePhoneLoginMutation } = authApi;
