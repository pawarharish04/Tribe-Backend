import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tribe — Discover Your People",
  description: "Find people who share your passions. Tribe matches you based on what you love.",
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
