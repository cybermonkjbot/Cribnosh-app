import { NextRequest } from 'next/server';

export interface NextRequestWithParams<Params = Record<string, string>> extends NextRequest {
  params: Params;
}

declare module 'next' {
  export interface NextApiRequest {
    user?: {
      id: string;
      email: string;
      // Add other user properties as needed
    };
  }
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      // Add other environment variables as needed
    }
  }
}
