import './global.css';

export const metadata = {
  title: 'LockIn',
  description: 'Simple animated card with image',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
