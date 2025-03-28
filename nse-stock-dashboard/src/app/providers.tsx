'use client';

import { ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        // Default fetcher config
        fetcher: (url: string) => fetch(url).then((res) => res.json()),
        // Global error handling and retry logic
        onError: (error) => {
          console.error('SWR Global Error:', error);
        },
        // Additional SWR options
        revalidateOnFocus: false,
        shouldRetryOnError: true,
        dedupingInterval: 5000,
      }}
    >
      <Toaster position="top-right" />
      {children}
    </SWRConfig>
  );
}
