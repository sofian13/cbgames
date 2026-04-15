import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "next-auth/react";
import { SmoothScroll } from "@/components/layout/smooth-scroll";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const geist = Geist({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono-face",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AF Games | Party Arcade",
  description: "Mini-jeux multijoueur pensés pour le mobile et les soirees entre potes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body
        className={`${bricolage.variable} ${geist.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <SessionProvider>
          <SmoothScroll>{children}</SmoothScroll>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
