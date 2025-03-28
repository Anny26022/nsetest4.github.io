import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface PriceTickerProps {
  price: number;
  previousPrice?: number;
  formatFn?: (price: number) => string;
  className?: string;
}

export function PriceTicker({
  price,
  previousPrice,
  formatFn = (p) => p.toFixed(2),
  className
}: PriceTickerProps) {
  const [trend, setTrend] = useState<'up' | 'down' | null>(null);
  const prevPriceRef = useRef(previousPrice ?? price);

  useEffect(() => {
    if (price === prevPriceRef.current) return;

    // Set the trend based on price change
    setTrend(price > prevPriceRef.current ? 'up' : 'down');

    // Reset trend after animation
    const timer = setTimeout(() => {
      setTrend(null);
    }, 1000);

    prevPriceRef.current = price;
    return () => clearTimeout(timer);
  }, [price]);

  return (
    <span
      className={cn(
        'transition-colors duration-1000',
        trend === 'up' && 'text-green-500 animate-price-up',
        trend === 'down' && 'text-red-500 animate-price-down',
        className
      )}
    >
      {formatFn(price)}
    </span>
  );
}
