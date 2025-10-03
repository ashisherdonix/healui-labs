'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
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
  X,
  LogOut,
  Database,
  ChevronDown
} from 'lucide-react';
import { theme } from '@/lib/theme';

const Navigation = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [doctorName, setDoctorName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDatabaseOpen, setIsDatabaseOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const name = localStorage.getItem('doctorName');
    if (name) {
      setDoctorName(name);
    }
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDatabaseOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        localStorage.removeItem('doctorName');
        router.push('/login');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/search', label: 'Search', icon: Search },
  ];

  const navItemsAfterDatabase = [
    { href: '/graph', label: 'Graph', icon: Network },
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  ];

  const databaseItems = [
    { href: '/conditions', label: 'Conditions', icon: Heart },
    { href: '/exercises', label: 'Exercises', icon: Dumbbell },
    { href: '/equipment', label: 'Equipment', icon: Wrench },
  ];

  return (
    <header className="sticky top-0 z-50" style={{ backgroundColor: theme.colors.primary[900] }}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <img 
              src="/Healui Logo/Healui Logo Final-12.png" 
              alt="healui" 
              className="h-16 w-auto py-2"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {/* First nav items (Home, Search) */}
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
            
            {/* Database Dropdown (after Search) */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDatabaseOpen(!isDatabaseOpen)}
                className={`
                  flex items-center space-x-2 px-3 py-2 rounded text-sm transition-colors duration-200
                  ${databaseItems.some(item => pathname === item.href)
                    ? 'text-white bg-gray-800'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  }
                `}
              >
                <Database className="w-4 h-4" />
                <span>Database</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isDatabaseOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown Menu */}
              {isDatabaseOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-50">
                  {databaseItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`
                          flex items-center space-x-2 px-4 py-2 text-sm transition-colors duration-200
                          ${pathname === item.href
                            ? 'text-white bg-gray-700'
                            : 'text-gray-300 hover:text-white hover:bg-gray-700'
                          }
                        `}
                        onClick={() => setIsDatabaseOpen(false)}
                      >
                        <IconComponent className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Remaining nav items (Graph, Dashboard) */}
            {navItemsAfterDatabase.map((item) => {
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
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="flex items-center space-x-2 px-3 py-2 rounded text-sm border border-gray-600 text-gray-400 hover:text-white hover:border-gray-500 hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 ml-auto cursor-default"
              title={doctorName ? `Logout ${doctorName}` : 'Logout'}
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
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
              {/* First nav items */}
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
              
              {/* Mobile Database Section */}
              <div className="pt-2 mt-2 border-t border-gray-700">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Database
                </div>
                {databaseItems.map((item) => {
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
              
              {/* Remaining nav items */}
              <div className="pt-2 mt-2 border-t border-gray-700">
                {navItemsAfterDatabase.map((item) => {
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
              
              {/* Mobile Logout Button */}
              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                disabled={isLoading}
                className="flex items-center space-x-3 w-full px-3 py-2 rounded text-sm border border-gray-600 text-gray-400 hover:text-white hover:border-gray-500 hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50 mt-4 cursor-default"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navigation;