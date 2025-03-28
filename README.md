NSE Stock Dashboard

A comprehensive, real-time dashboard for monitoring and analyzing stocks listed on the National Stock Exchange of India (NSE).

![NSE Stock Dashboard](https://same-assets.com/api/v1/asset/df19d1dc-eeea-43a3-be1d-76650a5d3c3b)

## 📋 Features

- **Real-time Stock Data**: View live prices, market status, and trading information from NSE
- **Advanced Stock Search**: Find stocks by symbol or company name with intelligent autocomplete
- **Interactive Charts**: Visualize historical price data with customizable timeframes
- **Technical Analysis**: View key technical indicators and price patterns
- **Market Overview**: Track major indices and market performance at a glance
- **Most Active Stocks**: Monitor stocks with the highest trading volume
- **Detailed Stock Information**: Access comprehensive data including:
  - Current price and daily change
  - 52-week high/low
  - Market capitalization
  - Trading volume
  - Key financial ratios
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Dark/Light Mode**: Choose your preferred theme

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.0.0 or later)
- [Bun](https://bun.sh/) (recommended) or npm/yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Anny26022/nsetest4.github.io.git
   cd nsetest4.github.io/nse-stock-dashboard
   ```

2. Install dependencies:
   ```bash
   bun install
   # or
   npm install
   ```

3. Run the development server:
   ```bash
   bun dev
   # or
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the dashboard.

## 🔍 Usage Guide

### Stock Search

1. Use the search bar at the top of the dashboard to find stocks
2. Enter a company name or stock symbol (e.g., "RELIANCE", "TCS", or "INFY")
3. Select a stock from the dropdown to view its details

### Chart Navigation

- Toggle between different timeframes (1D, 5D, 1M, 6M, 1Y, 5Y)
- Hover over the chart to see specific price points
- Use the chart controls to zoom in/out or reset the view

### Technical Scanner

The dashboard includes a technical analysis scanner that can be used to:
- Find stocks crossing key moving averages
- Identify potential breakout patterns
- Filter stocks based on technical criteria

## 🧩 Project Structure

```
nse-stock-dashboard/
├── src/
│   ├── app/                   # Next.js application routes
│   │   ├── api/               # API routes for data fetching
│   │   │   └── nse/           # NSE-specific API endpoints
│   │   ├── stock-dashboard/   # Stock dashboard page
│   │   └── technical-scanner/ # Technical analysis scanner page
│   ├── components/            # React components
│   │   ├── ui/                # Reusable UI components (shadcn/ui)
│   │   └── [feature].tsx      # Feature-specific components
│   ├── lib/                   # Utility functions and helpers
│   └── types/                 # TypeScript type definitions
├── public/                    # Static files and assets
└── [config files]             # Configuration files for Next.js, TypeScript, etc.
```

## 🛠️ API Endpoints

The application serves data through several API endpoints:

- `/api/nse/symbols` - List of all available NSE symbols
- `/api/nse/equity/details` - Detailed information for a specific equity
- `/api/nse/equity/historical` - Historical price data for charting
- `/api/nse/helpers/market-status` - Current market status (open/closed)
- `/api/nse/helpers/gainers-losers` - Top gaining and losing stocks
- `/api/nse/helpers/most-active` - Most actively traded stocks

## 📦 Technologies Used

- **Next.js**: React framework for server-rendered applications
- **React**: JavaScript library for building user interfaces
- **TypeScript**: Typed superset of JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality UI components built with Radix UI and Tailwind
- **SWR & React Query**: Data fetching and caching libraries
- **Recharts**: Composable charting library for React
- **stock-nse-india**: Library for accessing NSE stock data

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## ⚠️ Disclaimer

This dashboard is for informational purposes only. The data presented is sourced from the National Stock Exchange of India Ltd. and should not be considered as financial advice. Always conduct your own research before making investment decisions.

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Contact

If you have any questions or suggestions, please open an issue on GitHub.

---

Developed with ❤️ for the Indian stock market community
