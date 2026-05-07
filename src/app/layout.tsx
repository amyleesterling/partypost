import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const playful = Fraunces({
  subsets: ["latin"],
  variable: "--font-playful",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PartyPost",
  description: "Cheerful, lightweight birthday-party invitations and RSVPs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playful.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#fafaf9] font-[family-name:var(--font-body)] text-zinc-900">
        {children}
      </body>
    </html>
  );
}
