'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Loader2, AlertCircle, Brain, Network, Sparkles, ChartBar, Cpu, Microscope } from 'lucide-react';

export default function LoginPage() {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('doctorName', data.doctor.name);
        router.push('/');
      } else {
        setError(data.error || 'Invalid access key');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Physiotherapy',
      description: 'Intelligent algorithms for personalized rehabilitation protocols'
    },
    {
      icon: ChartBar,
      title: 'Clinical Analytics',
      description: 'Real-time insights for evidence-based treatment decisions'
    },
    {
      icon: Microscope,
      title: 'Research-Driven',
      description: 'Built on the latest physiotherapy research and clinical trials'
    }
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Features */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url(https://plus.unsplash.com/premium_photo-1699387204388-120141c76d51?q=80&w=1978&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#000000]/90 via-[#1e5f79]/80 to-[#000000]/90 z-10" />
        
        {/* Content */}
        <div className="relative z-20 flex flex-col justify-center px-12 lg:px-16">
          <div className="mb-12">
            <p className="text-lg font-light text-[#c8eaeb]">
              Developing tomorrow&apos;s physiotherapy algorithms
            </p>
          </div>

          <div className="space-y-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <feature.icon className="h-6 w-6 text-[#c8eaeb]" />
                </div>
                <div>
                  <h3 className="text-[#eff8ff] font-semibold mb-1">{feature.title}</h3>
                  <p className="text-[#c8eaeb]/80 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Login */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-[#eff8ff]">
        <div className="max-w-md w-full space-y-8">

          {/* Login Form */}
          <div>
            <h2 className="text-3xl font-bold text-[#000000] mb-2">Welcome back</h2>
            <p className="text-[#1e5f79]/70 mb-8">Enter your credentials to access the platform</p>
            
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="apiKey" className="block text-sm font-semibold text-[#1e5f79] mb-2">
                  Medical Access Key
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-[#1e5f79]/50" />
                  </div>
                  <input
                    id="apiKey"
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your secure access key"
                    className="w-full pl-10 pr-4 py-3 bg-white border-2 border-[#c8eaeb] rounded-lg text-[#000000] placeholder-[#1e5f79]/40 focus:outline-none focus:border-[#1e5f79] focus:bg-white transition-all"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !apiKey.trim()}
                className="w-full bg-[#1e5f79] text-[#eff8ff] py-3 px-6 rounded-lg font-semibold hover:bg-[#1e5f79]/90 focus:outline-none focus:ring-2 focus:ring-[#1e5f79] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                    Authenticating...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-xs text-[#1e5f79]/60">
              By signing in, you agree to our medical data privacy policies
            </p>
            <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-[#1e5f79]/50">
              <span className="flex items-center">
                <Sparkles className="w-3 h-3 mr-1" />
                AI-Powered
              </span>
              <span>•</span>
              <span>HIPAA Compliant</span>
              <span>•</span>
              <span>Physiotherapy Focused</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}