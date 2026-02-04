'use client';


export const dynamic = "force-dynamic";
export const runtime = 'edge';

/**
 * Minimal Global Error page to workaround Next.js internal InvariantError
 * during pre-rendering. This page provides a robust fallback that avoids
 * accessing request-time context during the build process.
 * 
 * Using runtime: 'edge' is a recommended workaround for this specific InvariantError.
 */
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="en">
            <body style={{
                fontFamily: 'system-ui, sans-serif',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                margin: 0,
                backgroundColor: '#f8f9fa',
                color: '#212529',
                textAlign: 'center',
                padding: '20px'
            }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Something went wrong</h1>
                <p style={{ marginBottom: '1.5rem', color: '#6c757d' }}>
                    We encountered a critical error. Our team has been notified.
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => reset()}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#ff3b30',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        Try again
                    </button>
                    <a
                        href="/"
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#e9ecef',
                            color: '#212529',
                            textDecoration: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer'
                        }}
                    >
                        Go home
                    </a>
                </div>
                {error.digest && (
                    <p style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#adb5bd' }}>
                        Error ID: {error.digest}
                    </p>
                )}
            </body>
        </html>
    );
}
