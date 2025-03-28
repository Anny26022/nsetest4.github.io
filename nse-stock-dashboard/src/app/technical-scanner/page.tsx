'use client';

import { EmaScanner } from '@/components/ema-scanner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { AlertCircle } from 'lucide-react';

export default function TechnicalScannerPage() {
  return (
    <main className="max-w-full overflow-x-hidden">
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex flex-col space-y-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Technical Scanner</h1>
            <p className="text-muted-foreground">
              Analyze stocks based on technical indicators and moving averages
            </p>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Technical Analysis Tool</AlertTitle>
          <AlertDescription>
            This tool scans NSE stocks to identify which ones are trading above or below important Exponential Moving Averages (EMAs).
            Use the filters to find stocks above or below the 10, 20, 50, and 200-day EMAs.
          </AlertDescription>
        </Alert>

        <Separator />

        <EmaScanner />

        <footer className="text-center text-muted-foreground text-sm mt-8 border-t pt-4">
          <p>
            Data provided by National Stock Exchange of India Ltd.
          </p>
          <p className="mt-1">
            This scanner is for informational purposes only. Not financial advice.
          </p>
        </footer>
      </div>
    </main>
  );
}
