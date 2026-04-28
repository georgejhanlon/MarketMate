import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MarketMate — Marketing for everybody",
  description: "AI-powered marketing for UK sole traders and small businesses",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}