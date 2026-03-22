import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "STEAL",
  title: "STEAL",
  description: "A premium workout tracker for Joshua and Natasha.",
  manifest: "/manifest.webmanifest",
  category: "health",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "STEAL",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#050507",
  colorScheme: "dark",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
