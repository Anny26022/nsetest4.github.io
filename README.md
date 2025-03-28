# NSE Stock Dashboard

A comprehensive, real-time dashboard for monitoring and analyzing stocks listed on the National Stock Exchange of India (NSE).

![NSE Stock Dashboard](https://same-assets.com/api/v1/asset/df19d1dc-eeea-43a3-be1d-76650a5d3c3b)

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technical Architecture](#technical-architecture)
- [Installation](#installation)
- [Development Guide](#development-guide)
- [API Reference](#api-reference)
- [Performance Optimization](#performance-optimization)
- [State Management](#state-management)
- [Authentication](#authentication)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Disclaimer](#disclaimer)

## Overview

The NSE Stock Dashboard is a Next.js application that provides real-time stock data from the National Stock Exchange of India. It leverages server-side rendering and client-side data fetching to deliver a responsive and data-rich experience for analyzing Indian equities.

## Features

### Core Functionality
- **Real-time Stock Data**: Integration with NSE APIs through the `stock-nse-india` library
- **Advanced Stock Search**: Debounced queries with optimized autocomplete functionality
- **Interactive Charts**: Time-series visualization with customizable technical indicators
- **Technical Analysis**: Algorithmic pattern recognition and indicator calculation

### Technical Components
- **Market Data Endpoints**: RESTful API implementation with Next.js API routes
- **Responsive UI**: Fluid layout with CSS Grid and Flexbox
- **Theme Support**: System-aware theme detection with context-based state management
- **Real-time Updates**: SWR-powered data fetching with configurable revalidation

## Technical Architecture

### System Architecture

```
┌─────────────────────────────┐
│ Client (Browser)            │
│                             │
│  ┌─────────┐    ┌─────────┐ │
│  │ React UI │◄───┤ SWR/RQ  │ │
│  └─────────┘    └─────────┘ │
│        ▲               │    │
└────────┼───────────────┼────┘
         │               │
         │               ▼
┌────────┼───────────────┼────┐
│        │               │    │
│  ┌─────────┐    ┌─────────┐ │
│  │Next.js  │◄───┤API Routes│ │
│  │  SSR    │    └─────────┘ │
│  └─────────┘         │      │
│                      │      │
└──────────────────────┼──────┘
                       │
                       ▼
               ┌───────────────┐
               │  External API │
               │   (NSE Data)  │
               └───────────────┘
```

### Frontend Architecture

The frontend is built with React and implements a component-based architecture using custom hooks for data fetching and state management:

#### Component Hierarchy
```
<App>
 ├── <Layout>
 │    ├── <Providers> (ThemeProvider, QueryClientProvider)
 │    └── <NavBar>
 │         └── <ThemeToggle>
 ├── <StockDashboard>
 │    ├── <StockSearch>
 │    │    └── <CommandMenu>
 │    ├── <StockDetails>
 │    │    ├── <PriceTicker>
 │    │    └── <StockMetrics>
 │    ├── <StockChart>
 │    │    └── <TradingViewChart>
 │    ├── <MarketOverview>
 │    │    └── <IndexCards>
 │    └── <MostActive>
 │         └── <DataTable>
 └── <TechnicalScanner>
      └── <EMAScanner>
          └── <ScanResults>
```

### Backend Architecture

The backend is implemented using Next.js API routes that serve as a middleware between the frontend and external NSE data services:

```
/api/
 ├── /nse/
 │    ├── /equity/
 │    │    ├── /details        # Stock details API
 │    │    ├── /historical     # Historical price data API
 │    │    ├── /intraday       # Intraday price data API
 │    │    └── /all-details    # Comprehensive stock data API
 │    ├── /index/
 │    │    ├── /details        # Index details API
 │    │    └── /historical     # Historical index data API
 │    ├── /helpers/
 │    │    ├── /market-status  # Market open/close status API
 │    │    ├── /gainers-losers # Top gainers and losers API
 │    │    └── /most-active    # Most active stocks API
 │    └── /symbols             # Stock symbols lookup API
 └── /test                     # Testing endpoints
```

## Installation

### System Requirements

- **Node.js**: v18.0.0 or later
- **Memory**: Minimum 2GB RAM (4GB recommended)
- **Storage**: At least 500MB free disk space
- **Operating System**: Cross-platform (Windows, macOS, Linux)

### Dependency Installation

```bash
git clone https://github.com/Anny26022/nsetest4.github.io.git
cd nsetest4.github.io/nse-stock-dashboard

# Using Bun (recommended for faster installation)
bun install

# Using NPM
npm install

# Using Yarn
yarn install
```

### Environment Configuration

Create a `.env.local` file in the root directory:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
NEXT_PUBLIC_CACHE_MAX_AGE=60
NEXT_PUBLIC_DEFAULT_SYMBOL=RELIANCE
```

## Development Guide

### Development Server

```bash
# Development with hot reload
bun dev

# Development with debugging
bun dev:debug
```

### Build Process

```bash
# Production build
bun build

# TypeScript type checking
bun type-check

# Linting
bun lint
```

### Code Organization

```
nse-stock-dashboard/
├── src/
│   ├── app/                     # Next.js App Router structure
│   │   ├── api/                 # API route handlers
│   │   │   └── nse/             # NSE-specific endpoints
│   │   ├── stock-dashboard/     # Dashboard page
│   │   └── technical-scanner/   # Scanner page
│   ├── components/              # React components
│   │   ├── ui/                  # Reusable UI components (shadcn/ui)
│   │   │   ├── button.tsx       # Button component
│   │   │   ├── dialog.tsx       # Dialog component
│   │   │   └── ...              # Other UI components
│   │   ├── stock-details.tsx    # Stock information component
│   │   ├── stock-chart.tsx      # Price chart component
│   │   └── ...                  # Other feature components
│   ├── lib/                     # Utility functions and services
│   │   ├── api.ts               # API client implementation
│   │   ├── utils.ts             # General utility functions
│   │   ├── emaCalculator.ts     # EMA calculation algorithm
│   │   └── historicalDataHelper.ts # Historical data processor
│   └── types/                   # TypeScript type definitions
│       └── nse.ts               # NSE data type interfaces
└── [config files]               # Configuration files
```

### Coding Standards

- **TypeScript**: Strict typing with interfaces for all data structures
- **Component Structure**: Functional components with React hooks
- **CSS**: Tailwind CSS with custom utility classes
- **State Management**: React Context and SWR for global state
- **Error Handling**: Centralized error boundary implementation
- **Performance**: Memoization of expensive calculations with useCallback/useMemo

## API Reference

### Stock Symbols API

```typescript
// GET /api/nse/symbols
interface SymbolsResponse {
  status: 'success' | 'error';
  data: {
    symbols: Array<{
      symbol: string;
      companyName: string;
      series: string;
      isin: string;
    }>;
  };
}
```

### Stock Details API

```typescript
// GET /api/nse/equity/details?symbol=RELIANCE
interface EquityDetailsResponse {
  status: 'success' | 'error';
  data: {
    info: {
      symbol: string;
      companyName: string;
      industry: string;
      series: string;
      isin: string;
    };
    priceInfo: {
      lastPrice: number;
      change: number;
      pChange: number;
      previousClose: number;
      open: number;
      close: number;
      high: number;
      low: number;
      yearHigh: number;
      yearLow: number;
      totalTradedVolume: number;
      totalTradedValue: number;
      perChange365d: number;
      perChange30d: number;
    };
    metadata: {
      marketCap: number;
      pe: number;
      pbv: number;
      eps: number;
      faceValue: number;
      dividend: number;
      dividendYield: number;
    };
  };
}
```

### Historical Data API

```typescript
// GET /api/nse/equity/historical?symbol=RELIANCE&period=1y
interface HistoricalDataResponse {
  status: 'success' | 'error';
  data: {
    symbol: string;
    period: '1d' | '5d' | '1m' | '3m' | '6m' | '1y' | '5y';
    candles: Array<{
      date: string;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }>;
    meta: {
      firstTradeDate: string;
      lastTradeDate: string;
      splitEvents: Array<{
        date: string;
        ratio: number;
      }>;
      dividendEvents: Array<{
        date: string;
        amount: number;
      }>;
    };
  };
}
```

### Data Fetching Handlers

The application uses custom React hooks for data fetching:

```typescript
// Example usage of useStockDetails hook
function StockDetails({ symbol }: { symbol: string }) {
  const { data, error, isLoading } = useStockDetails(symbol);

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorDisplay error={error} />;

  return (
    <div>
      <h2>{data.info.companyName}</h2>
      <PriceDisplay price={data.priceInfo.lastPrice} change={data.priceInfo.pChange} />
      {/* Additional UI components */}
    </div>
  );
}
```

## Performance Optimization

### Implemented Optimizations

1. **Code Splitting**: Dynamic imports with Next.js for route-based code splitting
   ```typescript
   const EMAScanner = dynamic(() => import('@/components/ema-scanner'), {
     loading: () => <p>Loading scanner...</p>,
   });
   ```

2. **Memoization**: Strategic use of React.memo, useMemo, and useCallback
   ```typescript
   const processedData = useMemo(() => {
     return computeExpensiveCalculation(data);
   }, [data]);
   ```

3. **Data Caching**: SWR configuration for optimal revalidation
   ```typescript
   const { data } = useSWR(`/api/nse/equity/details?symbol=${symbol}`, fetcher, {
     revalidateOnFocus: false,
     revalidateIfStale: true,
     dedupingInterval: 60000,
   });
   ```

4. **Image Optimization**: Next.js Image component for responsive images
   ```typescript
   <Image
     src="/chart-thumbnail.png"
     width={600}
     height={400}
     alt="Stock chart"
     loading="lazy"
     placeholder="blur"
   />
   ```

5. **Bundle Size Reduction**: Import optimization for third-party dependencies
   ```typescript
   // Instead of importing the entire library
   import { Line, Bar, Area } from 'recharts';

   // Import only what's needed
   import Line from 'recharts/lib/cartesian/Line';
   import Bar from 'recharts/lib/cartesian/Bar';
   import Area from 'recharts/lib/cartesian/Area';
   ```

## State Management

### Data Flow Architecture

1. **Server-Side Rendering**: Initial data fetched on the server
2. **Client-Side Revalidation**: Subsequent updates via SWR
3. **Global State**: Theme, selected stock, market status via React Context
4. **Component State**: Local UI state with useState and useReducer

Example of the Context implementation:

```typescript
// StockContext.tsx
const StockContext = createContext<StockContextType | undefined>(undefined);

export function StockProvider({ children }: { children: React.ReactNode }) {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [watchlist, setWatchlist] = useState<string[]>([]);

  const addToWatchlist = useCallback((symbol: string) => {
    setWatchlist(prev => [...prev, symbol]);
  }, []);

  const removeFromWatchlist = useCallback((symbol: string) => {
    setWatchlist(prev => prev.filter(s => s !== symbol));
  }, []);

  return (
    <StockContext.Provider value={{
      selectedSymbol,
      setSelectedSymbol,
      watchlist,
      addToWatchlist,
      removeFromWatchlist
    }}>
      {children}
    </StockContext.Provider>
  );
}

export function useStock() {
  const context = useContext(StockContext);
  if (context === undefined) {
    throw new Error('useStock must be used within a StockProvider');
  }
  return context;
}
```

## Testing

### Testing Strategy

1. **Unit Tests**: Component and utility function testing with Jest
2. **Integration Tests**: API endpoint testing with Jest and Supertest
3. **End-to-End Tests**: User flow testing with Playwright

### Example Test

```typescript
// __tests__/components/stock-details.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { StockDetails } from '@/components/stock-details';
import { SWRConfig } from 'swr';

// Mock data
const mockStockData = {
  info: {
    symbol: 'RELIANCE',
    companyName: 'Reliance Industries Limited',
  },
  priceInfo: {
    lastPrice: 2500,
    pChange: 1.5,
  },
};

// Mock fetcher
const mockFetcher = jest.fn();

describe('StockDetails Component', () => {
  beforeEach(() => {
    mockFetcher.mockResolvedValue({
      status: 'success',
      data: mockStockData,
    });
  });

  it('renders stock details correctly', async () => {
    render(
      <SWRConfig value={{ fetcher: mockFetcher, dedupingInterval: 0 }}>
        <StockDetails symbol="RELIANCE" />
      </SWRConfig>
    );

    // Check loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Reliance Industries Limited')).toBeInTheDocument();
    });

    // Check price display
    expect(screen.getByText('₹2,500.00')).toBeInTheDocument();
    expect(screen.getByText('+1.5%')).toBeInTheDocument();
  });

  it('handles error states', async () => {
    mockFetcher.mockRejectedValue(new Error('Failed to fetch'));

    render(
      <SWRConfig value={{ fetcher: mockFetcher, dedupingInterval: 0 }}>
        <StockDetails symbol="RELIANCE" />
      </SWRConfig>
    );

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

## Deployment

### Production Deployment Configuration

The application is configured for deployment on Netlify with the following settings:

```toml
# netlify.toml
[build]
  command = "bun run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18.17.0"
  NPM_FLAGS = "--no-optional"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200
```

### CI/CD Pipeline

1. **Build Process**:
   - Install dependencies
   - Run type checking
   - Run linting
   - Run tests
   - Build production bundle

2. **Deployment Process**:
   - Deploy to staging environment
   - Run smoke tests
   - Deploy to production environment
   - Run performance tests

## Contributing

### Development Workflow

1. **Fork and Clone**:
   ```bash
   git clone https://github.com/yourusername/nsetest4.github.io.git
   cd nsetest4.github.io/nse-stock-dashboard
   ```

2. **Branch Creation**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Development Best Practices**:
   - Write unit tests for new features
   - Follow the TypeScript coding style
   - Use React hooks properly (avoid dependency array issues)
   - Document complex logic with comments
   - Optimize expensive operations

4. **Pull Request Process**:
   - Create a descriptive PR title
   - Fill out the PR template
   - Reference any related issues
   - Ensure CI pipeline passes
   - Request review from maintainers

### Code Quality Guidelines

- **TypeScript**: Use strict type checking
- **React**: Follow React hooks rules
- **CSS**: Follow Tailwind CSS naming conventions
- **Testing**: Maintain >80% code coverage
- **Performance**: No UI bottlenecks > 100ms

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This dashboard is for informational purposes only. The data presented is sourced from the National Stock Exchange of India Ltd. and should not be considered as financial advice. Always conduct your own research before making investment decisions.

---

Developed by the NSE Stock Dashboard team
