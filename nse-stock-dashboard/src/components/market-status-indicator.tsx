'use client';

import { useEffect, useState } from 'react';
import { useMarketStatus } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  ArrowDownCircle,
  ArrowUpCircle,
  CircleCheckBig,
  CircleXIcon,
  Timer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from 'date-fns';

export function MarketStatusIndicator({ compact = false }: { compact?: boolean }) {
  const { data, error, isLoading } = useMarketStatus();
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isAnimating, setIsAnimating] = useState(false);

  // Function to calculate time difference and format it nicely
  const calculateTimeLeft = (targetTime: string | undefined) => {
    if (!targetTime) return { hours: 0, minutes: 0, seconds: 0 };

    const targetDate = new Date(targetTime);
    const now = new Date();
    const diffInMilliseconds = targetDate.getTime() - now.getTime();

    if (diffInMilliseconds <= 0) return { hours: 0, minutes: 0, seconds: 0 };

    // Calculate hours, minutes, and seconds
    const hours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((diffInMilliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffInMilliseconds % (1000 * 60)) / 1000);

    return { hours, minutes, seconds };
  };

  // Update the timer every second for a smoother countdown
  useEffect(() => {
    const timer = setInterval(() => {
      if (data?.nextMarketTime) {
        setTimeLeft(calculateTimeLeft(data.nextMarketTime));
      }
    }, 1000); // Update every second

    // Initial calculation
    if (data?.nextMarketTime) {
      setTimeLeft(calculateTimeLeft(data.nextMarketTime));
    }

    return () => clearInterval(timer);
  }, [data?.nextMarketTime]);

  // Pulse animation for the status indicator
  useEffect(() => {
    if (data?.isOpen) {
      const interval = setInterval(() => {
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 1000);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [data?.isOpen]);

  // Format time components with leading zeros
  const formatTimeComponent = (value: number) => {
    return value.toString().padStart(2, '0');
  };

  // Format the time for display
  const formatCountdown = () => {
    if (compact) {
      // Compact format - just show the most significant non-zero unit
      if (timeLeft.hours > 0) return `${timeLeft.hours}h`;
      if (timeLeft.minutes > 0) return `${timeLeft.minutes}m`;
      return `${timeLeft.seconds}s`;
    }

    // Full format with hours:minutes:seconds
    if (timeLeft.hours > 0) {
      return `${formatTimeComponent(timeLeft.hours)}:${formatTimeComponent(timeLeft.minutes)}:${formatTimeComponent(timeLeft.seconds)}`;
    }
    return `${formatTimeComponent(timeLeft.minutes)}:${formatTimeComponent(timeLeft.seconds)}`;
  };

  // Format the next market time for the tooltip
  const formatNextTime = (nextTime: string | undefined) => {
    if (!nextTime) return '';
    try {
      const date = new Date(nextTime);
      return format(date, 'h:mm a, EEE, d MMM');
    } catch (e) {
      return nextTime;
    }
  };

  if (isLoading) {
    return (
      <div className={cn(
        "flex items-center space-x-2 animate-pulse rounded-full px-3 py-1 bg-background/40 backdrop-blur-sm border border-border/20",
        compact ? "text-xs" : "text-sm"
      )}>
        <Timer className={compact ? "h-3 w-3" : "h-4 w-4"} />
        <span>Loading...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={cn(
        "flex items-center space-x-2 rounded-full px-3 py-1 bg-background/40 backdrop-blur-sm border border-border/20",
        compact ? "text-xs" : "text-sm"
      )}>
        <CircleXIcon className={cn("text-red-500", compact ? "h-3 w-3" : "h-4 w-4")} />
        <span>Status unavailable</span>
      </div>
    );
  }

  const { isOpen, nextTimeType, nextMarketTime } = data;
  const nextTimeFormatted = formatNextTime(nextMarketTime);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex items-center space-x-2 cursor-help rounded-full px-3 py-1 transition-all duration-300 hover:bg-background/80",
            "bg-background/40 backdrop-blur-sm border border-border/20 shadow-sm",
            compact ? "text-xs" : "text-sm"
          )}>
            {/* Status indicator */}
            <div className="flex items-center space-x-1.5">
              <span className={cn(
                "relative flex h-2 w-2 rounded-full transition-all duration-300",
                isOpen
                  ? "bg-green-500"
                  : "bg-amber-500"
              )}>
                {isAnimating && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-green-400"></span>
                )}
              </span>
              <span className={cn(
                isOpen ? "text-green-500 dark:text-green-400" : "text-amber-500 dark:text-amber-400",
                "font-medium"
              )}>
                {isOpen ? 'Open' : 'Closed'}
              </span>
            </div>

            {/* Separator - hide in compact mode */}
            {!compact && (
              <span className="h-4 w-px bg-border/50" />
            )}

            {/* Countdown */}
            <div className={cn(
              "flex items-center space-x-1.5",
              "text-foreground/80"
            )}>
              {!compact && (
                <>
                  {nextTimeType === 'open'
                    ? <ArrowUpCircle className="h-3.5 w-3.5 text-amber-500" />
                    : <ArrowDownCircle className="h-3.5 w-3.5 text-green-500" />
                  }
                  <span className="text-muted-foreground">
                    {nextTimeType === 'open' ? 'Opens' : 'Closes'}:
                  </span>
                </>
              )}
              <span className={cn(
                "font-mono font-medium tracking-tight",
                compact ? "" : "tabular-nums"
              )}>
                {formatCountdown()}
              </span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="p-4 max-w-xs">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className={cn(
                "h-3 w-3 rounded-full",
                isOpen ? "bg-green-500" : "bg-amber-500"
              )} />
              <p className="font-medium">
                {isOpen
                  ? 'NSE Market is Open'
                  : 'NSE Market is Closed'}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {isOpen
                ? `Trading hours are from 9:15 AM to 3:30 PM IST, Monday to Friday. The market will close at 3:30 PM.`
                : `Trading hours are from 9:15 AM to 3:30 PM IST, Monday to Friday. The market will next open at ${nextTimeFormatted}.`}
            </p>
            <div className="text-xs text-muted-foreground pt-1 border-t border-border/50">
              {nextTimeType === 'open'
                ? `Next market open: ${nextTimeFormatted}`
                : `Next market close: ${nextTimeFormatted}`}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
