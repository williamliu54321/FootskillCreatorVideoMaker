export const metadata = {
  title: 'Footskill Creator Video Maker',
  description: 'Upload a clip, get a ball-trail video stitched with a skill analysis card.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{
        margin: 0,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: 'linear-gradient(180deg, #000 0%, #0a1525 50%, #000 100%)',
        color: '#fff',
        minHeight: '100vh',
      }}>
        {children}
      </body>
    </html>
  );
}
