import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lobby game",
  description: "Single-room multiplayer lobby with host-controlled start and end.",
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
