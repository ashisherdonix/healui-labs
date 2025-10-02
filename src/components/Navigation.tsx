'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { 
  Home, 
  Search, 
  Heart, 
  Dumbbell, 
  Wrench, 
  Network, 
  BarChart3,
  Activity,
  Menu,
  X
} from 'lucide-react';
import { theme } from '@/lib/theme';

const Navigation = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/search', label: 'Search', icon: Search },
    { href: '/conditions', label: 'Conditions', icon: Heart },
    { href: '/exercises', label: 'Exercises', icon: Dumbbell },
    { href: '/equipment', label: 'Equipment', icon: Wrench },
    { href: '/graph', label: 'Graph', icon: Network },
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/analytics', label: 'Analytics', icon: Activity }
  ];

  return (
    <header className="sticky top-0 z-50" style={{ backgroundColor: theme.colors.primary[900] }}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <img 
              src="/healui-logo-header.png" 
              alt="healui" 
              className="h-16 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center space-x-2 px-3 py-2 rounded text-sm transition-colors duration-200
                    ${pathname === item.href
                      ? 'text-white bg-gray-800'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                    }
                  `}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white cursor-pointer"
          >
            <span className="sr-only">Open main menu</span>
            {!isMobileMenuOpen ? (
              <Menu className="block h-6 w-6" />
            ) : (
              <X className="block h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-800/50 rounded-lg mt-2">
              {navItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center space-x-3 block px-3 py-2 rounded text-sm transition-colors duration-200
                      ${pathname === item.href
                        ? 'text-white bg-gray-800'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                      }
                    `}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navigation;