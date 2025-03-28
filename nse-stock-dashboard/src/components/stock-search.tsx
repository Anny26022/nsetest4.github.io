import { useState, useRef, useEffect } from 'react';
import { useSymbols } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';
import {
  Card,
  CardContent
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { SymbolWithCompany } from '@/types/nse';

interface StockSearchProps {
  onSelect: (symbol: string) => void;
}

export function StockSearch({ onSelect }: StockSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const { data: rawSymbols = [], error, isLoading } = useSymbols();
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Process incoming symbols to handle different formats safely
  const symbols: SymbolWithCompany[] = Array.isArray(rawSymbols)
    ? rawSymbols.map(item => {
        // Handle direct string format
        if (typeof item === 'string') {
          return { symbol: item, companyName: '' };
        }
        // Handle object format but ensure it has a symbol property
        else if (item && typeof item === 'object' && 'symbol' in item) {
          return {
            symbol: item.symbol,
            companyName: item.companyName || ''
          };
        }
        // Fallback
        return { symbol: String(item), companyName: '' };
      })
    : [];

  // Set up debounce for search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle clicks outside search container
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node) &&
        showResults
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showResults]);

  // Filter symbols based on search query (search in both symbol and company name)
  const filteredSymbols = debouncedQuery.length > 0
    ? symbols.filter(item =>
        item.symbol.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        (item.companyName && item.companyName.toLowerCase().includes(debouncedQuery.toLowerCase()))
      ).slice(0, 10)
    : [];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value.length > 0) {
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  };

  const handleSymbolSelect = (symbolItem: SymbolWithCompany) => {
    onSelect(symbolItem.symbol);
    setSearchQuery(symbolItem.symbol);
    setShowResults(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (filteredSymbols.length > 0) {
      handleSymbolSelect(filteredSymbols[0]);
    }
  };

  return (
    <div className="relative w-full max-w-sm" ref={searchContainerRef}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by symbol or company name"
            className="pl-9 pr-4 py-2"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => {
              if (searchQuery.length > 0) {
                setShowResults(true);
              }
            }}
            autoComplete="off"
          />
          {isLoading && (
            <div className="absolute right-3 top-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </form>

      {/* Search Results */}
      {showResults && (
        <Card className="absolute z-50 w-full mt-1 overflow-hidden border shadow-md">
          <CardContent className="p-0 max-h-[300px] overflow-y-auto">
            {error ? (
              <div className="p-4 text-center text-sm text-red-500">
                Failed to load stock symbols
              </div>
            ) : filteredSymbols.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {debouncedQuery.length > 0 ? 'No matching stocks found' : 'Start typing to search'}
              </div>
            ) : (
              <ul className="py-1">
                {filteredSymbols.map((item) => (
                  <li key={item.symbol}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto px-3 py-2 text-sm flex flex-col items-start"
                      onClick={() => handleSymbolSelect(item)}
                    >
                      <span className="font-medium">{item.symbol}</span>
                      {item.companyName && (
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {item.companyName}
                        </span>
                      )}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
