import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'CribNosh';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function OpenGraphImage({
  title = 'CribNosh | The app for foodies',
}: {
  title?: string;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1a1a',
          backgroundImage:
            'radial-gradient(circle at 25px 25px, #333 2%, transparent 0%), radial-gradient(circle at 75px 75px, #333 2%, transparent 0%)',
          backgroundSize: '100px 100px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 40,
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 'bold',
              background: 'linear-gradient(90deg, #fff 0%, #e0e0e0 100%)',
              backgroundClip: 'text',
              color: 'transparent',
              textAlign: 'center',
              margin: '0 30px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              fontFamily: 'system-ui',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 10 }}>▲</div>
            CribNosh
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 60,
            fontStyle: 'normal',
            color: 'white',
            marginTop: 30,
            lineHeight: 1.4,
            whiteSpace: 'pre-wrap',
            textAlign: 'center',
            padding: '0 120px',
            fontFamily: 'system-ui',
          }}
        >
          {title}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
} 