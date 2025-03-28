'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function NavBar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/' },
    { name: 'Stock Table', href: '/stock-dashboard' },
    { name: 'Technical Scanner', href: '/technical-scanner' },
  ];

  return (
    <div className="flex items-center space-x-4 overflow-x-auto py-2 px-4 border-b">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "transition-colors hover:text-foreground/80 text-sm font-medium whitespace-nowrap",
            pathname === item.href
              ? "text-foreground underline underline-offset-4"
              : "text-foreground/60"
          )}
        >
          {item.name}
        </Link>
      ))}
    </div>
  );
}
