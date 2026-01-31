"use client";


export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
                    <h1>Something went wrong!</h1>
                    <button
                        onClick={() => reset()}
                        style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer', marginTop: '20px' }}
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    );
}
