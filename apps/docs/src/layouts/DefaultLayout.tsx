import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface DefaultLayoutProps {
  children: React.ReactNode;
}

export default function DefaultLayout({ children }: DefaultLayoutProps) {
  return (
    <div className="min-h-screen bg-black text-[#ededed] flex flex-col items-center px-4 md:px-8 relative overflow-hidden">
      <Header />
      
      <main className="w-full flex flex-col items-center flex-1 z-10">
        {children}
      </main>

      <Footer />
    </div>
  );
}
