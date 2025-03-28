import { NextResponse } from 'next/server';

// Function to check if the market is currently open
// NSE market hours: Monday to Friday, 9:15 AM to 3:30 PM IST
function isMarketOpen() {
  const now = new Date();

  // Convert to IST (Indian Standard Time is UTC+5:30)
  const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));

  // Get the day, hours, and minutes in IST
  const dayOfWeek = istTime.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
  const hours = istTime.getUTCHours();
  const minutes = istTime.getUTCMinutes();

  // Convert current time to minutes since midnight
  const currentTimeInMinutes = hours * 60 + minutes;

  // Market opening time: 9:15 AM = 9*60 + 15 = 555 minutes
  const marketOpenMinutes = 9 * 60 + 15;

  // Market closing time: 3:30 PM = 15*60 + 30 = 930 minutes
  const marketCloseMinutes = 15 * 60 + 30;

  // Check if it's a weekday (Monday to Friday) and within market hours
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  const isDuringMarketHours = currentTimeInMinutes >= marketOpenMinutes && currentTimeInMinutes <= marketCloseMinutes;

  return isWeekday && isDuringMarketHours;
}

// Function to get the next market opening or closing time
function getNextMarketTime() {
  const now = new Date();

  // Convert to IST (Indian Standard Time is UTC+5:30)
  const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));

  const dayOfWeek = istTime.getUTCDay();
  const hours = istTime.getUTCHours();
  const minutes = istTime.getUTCMinutes();
  const currentTimeInMinutes = hours * 60 + minutes;

  const marketOpenMinutes = 9 * 60 + 15; // 9:15 AM
  const marketCloseMinutes = 15 * 60 + 30; // 3:30 PM

  // Calculate next opening/closing time
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  const isBeforeMarketOpen = isWeekday && currentTimeInMinutes < marketOpenMinutes;
  const isDuringMarketHours = isWeekday && currentTimeInMinutes >= marketOpenMinutes && currentTimeInMinutes < marketCloseMinutes;
  const isAfterMarketClose = isWeekday && currentTimeInMinutes >= marketCloseMinutes;
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  let nextMarketTime = new Date(istTime);
  let timeType = '';

  if (isBeforeMarketOpen) {
    // Market will open today
    nextMarketTime.setUTCHours(9, 15, 0, 0);
    timeType = 'open';
  } else if (isDuringMarketHours) {
    // Market will close today
    nextMarketTime.setUTCHours(15, 30, 0, 0);
    timeType = 'close';
  } else if (isAfterMarketClose || isWeekend) {
    // Find next opening day
    let daysToAdd = 1;
    if (isWeekend) {
      // If it's Saturday (6), add 2 days to get to Monday
      // If it's Sunday (0), add 1 day to get to Monday
      daysToAdd = dayOfWeek === 6 ? 2 : 1;
    } else if (dayOfWeek === 5) {
      // If it's Friday after market close, add 3 days to get to Monday
      daysToAdd = 3;
    }

    nextMarketTime = new Date(istTime);
    nextMarketTime.setUTCDate(istTime.getUTCDate() + daysToAdd);
    nextMarketTime.setUTCHours(9, 15, 0, 0);
    timeType = 'open';
  }

  // Convert back to user's local time for the frontend
  const localNextMarketTime = new Date(nextMarketTime.getTime() - (5.5 * 60 * 60 * 1000));

  return {
    nextTime: localNextMarketTime.toISOString(),
    timeType: timeType
  };
}

export async function GET() {
  try {
    const isOpen = isMarketOpen();
    const nextMarketTime = getNextMarketTime();

    return NextResponse.json({
      success: true,
      data: {
        isOpen,
        nextMarketTime: nextMarketTime.nextTime,
        nextTimeType: nextMarketTime.timeType,
        serverTime: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Error determining market status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to determine market status' },
      { status: 500 }
    );
  }
}
