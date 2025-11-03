import { Resend } from "resend";
import { fullEnv } from "./config/env";

export const resend = fullEnv.RESEND_API_KEY
  ? new Resend(fullEnv.RESEND_API_KEY)
  : { send: async () => { throw new Error("Resend API key not configured"); } };
