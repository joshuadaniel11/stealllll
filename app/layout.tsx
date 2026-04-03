import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "STEAL",
  title: "STEAL",
  description: "Private shared training app for Joshua and Natasha.",
  metadataBase: new URL("https://stealllll.vercel.app"),
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
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#090a0d",
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
      <body className="apple-fonts">{children}</body>
    </html>
  );
}
