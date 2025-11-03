import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up as a Driver - CribNosh',
  description: 'Apply to become a delivery driver for CribNosh and earn on your schedule.',
  openGraph: {
    title: 'Sign Up as a Driver',
    description: 'Join our team of delivery drivers and be part of the CribNosh community.',
    url: 'https://cribnosh.com/driving/apply',
    siteName: 'CribNosh',
    images: [
      {
        url: '/backgrounds/driver-background.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sign Up as a Driver',
    description: 'Join our team of delivery drivers and be part of the CribNosh community.',
    images: ['/backgrounds/driver-background.png'],
  },
}; 