// app/store/authApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import * as SecureStore from "expo-secure-store";
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
      headers.set("authorization", `Bearer ${token}`);
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
