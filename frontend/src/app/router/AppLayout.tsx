import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../../shared/components/Navbar';

const CURRENT_YEAR = new Date().getFullYear();

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200/80 bg-white py-4 text-center text-xs text-slate-400">
        Учебный радар © {CURRENT_YEAR} — Сервис контроля сроков и учебных проектов
      </footer>
    </div>
  );
};
