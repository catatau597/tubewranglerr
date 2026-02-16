import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TubeWranglerr",
  description: "YouTube Stream Aggregator",
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
