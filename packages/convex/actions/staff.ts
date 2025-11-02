"use node";
import { action } from "../_generated/server";
import { randomInt } from "crypto";

export const staff_generateOnboardingCode = action({
  args: {},
  handler: async () => {
    return String(randomInt(100000, 1000000));
  }
}); 