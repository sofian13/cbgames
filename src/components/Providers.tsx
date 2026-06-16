"use client";

/**
 * Providers — Mount everything that needs to wrap the entire app under
 * <body> in your root layout. Right now this is just the AudioProvider,
 * but extend it with theme/session/zustand providers if you add more.
 *
 * Wire in `src/app/layout.tsx` :
 *
 *   import { Providers } from "@/components/Providers";
 *   ...
 *   <body>
 *     <Providers>{children}</Providers>
 *   </body>
 */

import { AudioProvider } from "@/lib/hooks/useAudio";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AudioProvider>
      <ServiceWorkerRegister />
      {children}
    </AudioProvider>
  );
}
