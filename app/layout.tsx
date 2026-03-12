import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "STEAL",
  description: "A premium workout tracker for Joshua and Natasha.",
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
