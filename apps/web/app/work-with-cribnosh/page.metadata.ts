import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Work With CribNosh - Join Our Team',
  description: 'Join CribNosh as a chef or driver and be part of our culinary community. Explore opportunities to cook or deliver delicious meals.',
  openGraph: {
    title: 'Work With CribNosh',
    description: 'Join our team as a chef or driver and be part of the CribNosh community.',
    url: 'https://cribnosh.com/work-with-cribnosh',
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
    title: 'Work With CribNosh',
    description: 'Join our team as a chef or driver and be part of the CribNosh community.',
    images: ['/backgrounds/driver-background.png'],
  },
}; 