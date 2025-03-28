'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Use dynamic import with SSR disabled to avoid hydration issues
const StockDashboardClient = dynamic(
  () => import('@/components/stock-dashboard-client').then(mod => mod.StockDashboardClient),
  {
    ssr: false,
    loading: () => (
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex flex-col space-y-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">NSE Stock Dashboard</h1>
            <p className="text-muted-foreground">Loading stock data...</p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Stock Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
);

// Simple page component that renders the dynamic client component
export default function StockDashboard() {
  return (
    <Suspense>
      <StockDashboardClient />
    </Suspense>
  );
}
