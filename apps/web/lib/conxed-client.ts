import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

let convex: ConvexHttpClient | null = null;

export function getConvexClient() {
  if (!convex) {
    convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  }
  return convex;
}

export { api };

// Helper for dynamic module/function access
export function getApiFunction(module: string, fn: string) {
  // e.g. getApiFunction('mutations/sessions', 'deleteSession')
  // maps to api['mutations']['sessions']['deleteSession']
  const [type, mod] = module.split('/');
  return (api as any)[type][mod][fn];
}
