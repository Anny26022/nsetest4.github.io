import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useGainersLosers } from '@/lib/api';
import { IndexEquityInfo } from '@/types/nse';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';
import { PriceTicker } from './price-ticker';

export function MarketOverview() {
  const [activeTab, setActiveTab] = useState('gainers');
  const { data, error, isLoading } = useGainersLosers();

  // Format volume with Indian number system
  const formatVolume = (value: string) => {
    const num = parseInt(value.replace(/,/g, ''));
    if (isNaN(num)) return '0';
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const renderEquityRow = (equity: IndexEquityInfo) => {
    // Handle potentially undefined properties with fallbacks
    const ltp = typeof equity.ltp === 'number' ? equity.ltp : 0;
    const change = typeof equity.change === 'number' ? equity.change : 0;
    const pChange = typeof equity.pChange === 'number' ? equity.pChange : 0;

    return (
      <TableRow key={equity.symbol} className="hover:bg-secondary/40 transition-colors">
        <TableCell className="font-medium">{equity.symbol}</TableCell>
        <TableCell>
          <PriceTicker 
            price={ltp} 
            previousPrice={ltp - change}
            formatFn={(p) => p.toFixed(2)} 
          />
        </TableCell>
        <TableCell className={change > 0 ? 'text-green-500' : 'text-red-500'}>
          {change > 0 ? '+' : ''}{change.toFixed(2)}
        </TableCell>
        <TableCell className={pChange > 0 ? 'text-green-500' : 'text-red-500'}>
          <div className="flex items-center">
            {pChange > 0 ? (
              <ArrowUpIcon className="h-4 w-4 mr-1" />
            ) : (
              <ArrowDownIcon className="h-4 w-4 mr-1" />
            )}
            {pChange > 0 ? '+' : ''}{pChange.toFixed(2)}%
          </div>
        </TableCell>
        <TableCell>{formatVolume(equity.tradedQuantity)}</TableCell>
      </TableRow>
    );
  };

  const renderLoadingState = () => (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-8 w-[120px]" />
          <Skeleton className="h-8 w-[80px]" />
          <Skeleton className="h-8 w-[80px]" />
          <Skeleton className="h-8 w-[80px]" />
          <Skeleton className="h-8 w-[100px]" />
        </div>
      ))}
    </div>
  );

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          Market Overview
          <Badge variant="outline" className="ml-2">NIFTY 50</Badge>
        </CardTitle>
        <CardDescription>Top gainers and losers based on percentage change</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gainers">Top Gainers</TabsTrigger>
            <TabsTrigger value="losers">Top Losers</TabsTrigger>
          </TabsList>
          <TabsContent value="gainers">
            {isLoading ? (
              renderLoadingState()
            ) : error ? (
              <div className="text-center text-red-500">Failed to load market overview</div>
            ) : data?.gainers && data.gainers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>LTP (₹)</TableHead>
                    <TableHead>Change (₹)</TableHead>
                    <TableHead>Change (%)</TableHead>
                    <TableHead>Volume</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.gainers.map(renderEquityRow)}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-4 text-muted-foreground">No gainers data available</div>
            )}
          </TabsContent>
          <TabsContent value="losers">
            {isLoading ? (
              renderLoadingState()
            ) : error ? (
              <div className="text-center text-red-500">Failed to load market overview</div>
            ) : data?.losers && data.losers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>LTP (₹)</TableHead>
                    <TableHead>Change (₹)</TableHead>
                    <TableHead>Change (%)</TableHead>
                    <TableHead>Volume</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.losers.map(renderEquityRow)}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-4 text-muted-foreground">No losers data available</div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
