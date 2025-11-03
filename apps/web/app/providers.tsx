'use client';
import { Providers } from '../context';
 
export default function AppProviders({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
} 