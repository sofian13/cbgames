import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "next-auth/react";
import { Providers } from "@/components/Providers";
import "./globals.css";

// Fonts (Clash Display via Fontshare for display + DM Sans + JetBrains Mono)
// are loaded via @import in globals.css and exposed through the --font-* CSS vars.

export const metadata: Metadata = {
  title: "af.games · Party Arcade",
  description: "Une soirée, un code, un jeu. Des mini-jeux multijoueur pensés pour le mobile et les soirées entre potes.",
  applicationName: "af.games",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "af.games" },
  // Favicon + apple-touch are served via the app/icon.png & app/apple-icon.png
  // file conventions (auto cache-busted), so no manual `icons` here.
  other: {
    "apple-mobile-web-app-capable": "yes",
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#0E0828",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
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
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </SessionProvider>
      </body>
    </html>
  );
}
