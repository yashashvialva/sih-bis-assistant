import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "BIS Compliance Assistant — AI-Powered BIS Certification Guide",
  description:
    "AI-powered compliance assistant for Indian manufacturers and MSMEs navigating Bureau of Indian Standards (BIS) certification, standards, and testing requirements.",
  keywords: [
    "BIS",
    "Bureau of Indian Standards",
    "ISI Mark",
    "compliance",
    "certification",
    "Indian Standards",
    "MSME",
    "manufacturing",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
