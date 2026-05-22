import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

// Fonts (Clash Display via Fontshare for display + DM Sans + JetBrains Mono)
// are loaded via @import in globals.css and exposed through the --font-* CSS vars.

export const metadata: Metadata = {
  title: "af.games · Party Arcade",
  description: "Une soirée, un code, un jeu. Des mini-jeux multijoueur pensés pour le mobile et les soirées entre potes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="antialiased">
        <SessionProvider>
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
