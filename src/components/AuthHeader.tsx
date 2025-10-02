'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export default function AuthHeader() {
  const [doctorName, setDoctorName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const name = localStorage.getItem('doctorName');
    if (name) {
      setDoctorName(name);
    }
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

  if (!doctorName) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={handleLogout}
        disabled={isLoading}
        className="p-3 rounded-lg bg-white shadow-md hover:shadow-lg border border-gray-200 transition-all disabled:opacity-50 group"
        title={`Logout ${doctorName}`}
      >
        <LogOut className="w-5 h-5 text-[#1e5f79] group-hover:text-[#1e5f79]/80" />
      </button>
    </div>
  );
}