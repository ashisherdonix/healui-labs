'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { 
  Heart, 
  Dumbbell, 
  Wrench, 
  Network, 
  BarChart3, 
  Search,
  Activity,
  Link2
} from 'lucide-react';
import { theme } from '@/lib/theme';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const stats = [
    { icon: Heart, value: '200', label: 'Medical Conditions' },
    { icon: Dumbbell, value: '2,007', label: 'Therapeutic Exercises' },
    { icon: Wrench, value: '200+', label: 'Equipment Items' },
    { icon: Link2, value: '4,014', label: 'Knowledge Connections' }
  ];

  const features = [
    {
      icon: Search,
      title: 'Advanced Search',
      description: 'Search across all entities and explore their relationships. Find conditions, exercises, equipment, and see what they\'re connected to.',
      href: '/search'
    },
    {
      icon: Heart,
      title: 'Medical Conditions',
      description: 'Browse 200 physiotherapy conditions with evidence-based treatment protocols, exercises, and equipment recommendations.',
      href: '/conditions'
    },
    {
      icon: Dumbbell,
      title: 'Exercise Database',
      description: 'Explore 2,007 therapeutic exercises categorized by body region, type, and difficulty level with detailed instructions.',
      href: '/exercises'
    },
    {
      icon: Wrench,
      title: 'Equipment Catalog',
      description: 'Discover rehabilitation equipment with specifications, usage guidelines, and exercise associations.',
      href: '/equipment'
    },
    {
      icon: Network,
      title: 'Interactive Graph',
      description: 'Visualize the complete knowledge graph with interactive network visualization of all relationships.',
      href: '/graph'
    },
    {
      icon: BarChart3,
      title: 'Database Dashboard',
      description: 'Enterprise-level dashboard with real-time database insights and comprehensive analytics.',
      href: '/dashboard'
    }
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.primary[50] }}>
      <Navigation />

      <main className="relative">
        {/* Hero Section */}
        <section 
          className="relative"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.85)),
              url('https://plus.unsplash.com/premium_photo-1753080951569-4134578b1c35?q=80&w=1412&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')
            `,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            minHeight: '100vh'
          }}
        >
          {/* Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 text-center">
            <div className="mb-8">
              <img 
                src="/healui-logo.png" 
                alt="healui" 
                className="h-24 w-auto mx-auto"
              />
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold mb-6" style={{ color: theme.colors.primary[900] }}>
              Physiotherapy Ontology Engine
            </h1>
            <p className="text-lg mb-16 max-w-2xl mx-auto leading-relaxed" style={{ color: theme.colors.primary[600] }}>
              Clinical knowledge graph for evidence-based physiotherapy rehabilitation
            </p>

            {/* Search Bar */}
            <div className="max-w-xl mx-auto mb-20">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Search conditions, exercises, equipment..."
                  className="w-full px-6 py-3 pr-24 bg-white border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-colors duration-200"
                  style={{
                    borderColor: theme.colors.primary[100],
                    color: theme.colors.primary[900],
                    '--tw-ring-color': theme.colors.primary[600]
                  } as React.CSSProperties}
                />
                <button
                  onClick={handleSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1 text-white text-sm rounded hover:shadow-md transition-all duration-200 cursor-pointer"
                  style={{ backgroundColor: theme.colors.primary[600] }}
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div
                  key={index}
                  className="bg-white border rounded-lg p-6 text-center shadow-sm hover:shadow-md transition-shadow"
                  style={{ borderColor: theme.colors.primary[100] }}
                >
                  <IconComponent className="w-8 h-8 mx-auto mb-3" style={{ color: theme.colors.primary[600] }} />
                  <div className="text-2xl font-bold mb-1" style={{ color: theme.colors.primary[900] }}>{stat.value}</div>
                  <div className="text-sm" style={{ color: theme.colors.primary[600] }}>{stat.label}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ color: theme.colors.primary[900] }}>
            Platform Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Link
                  key={index}
                  href={feature.href}
                  className="bg-white border rounded-lg p-6 hover:shadow-md transition-all duration-200 group cursor-pointer"
                  style={{ borderColor: theme.colors.primary[100] }}
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme.colors.primary[50] }}>
                      <IconComponent className="w-5 h-5" style={{ color: theme.colors.primary[600] }} />
                    </div>
                    <h3 className="text-lg font-semibold" style={{ color: theme.colors.primary[900] }}>
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: theme.colors.primary[600] }}>
                    {feature.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Footer */}
        <footer className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="border-t pt-8" style={{ borderColor: theme.colors.primary[100] }}>
            <div className="mb-4">
              <img 
                src="/healui-logo.png" 
                alt="healui" 
                className="h-12 w-auto mx-auto opacity-60"
              />
            </div>
            <p className="text-sm mb-2" style={{ color: theme.colors.primary[600] }}>
              &copy; 2025 Physiotherapy Ontology Engine • Powered by healui
            </p>
            <a 
              href="https://healui.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm hover:underline transition-all duration-200"
              style={{ color: theme.colors.primary[600] }}
            >
              Visit healui.com
              <svg className="ml-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </footer>
      </main>

    </div>
  );
}