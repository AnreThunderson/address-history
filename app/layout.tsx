export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ background: "#fafbfc" }}>{children}</body>
    </html>
  );
}