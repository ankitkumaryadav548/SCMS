import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Bell } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-darkbg-card border-b border-darkbg-border flex items-center justify-between px-6 md:px-8">
      <div>
        <h2 className="text-lg font-semibold text-white">
          Control Panel
        </h2>
        <p className="text-xs text-darkbg-textMuted hidden sm:block">
          Real-time smart city orchestration & algorithm dispatcher
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Alerts trigger */}
        <button className="p-2 text-darkbg-textMuted hover:text-white rounded-full hover:bg-darkbg-border transition-colors">
          <Bell className="h-5 w-5" />
        </button>

        {/* Vertical divider */}
        <div className="h-6 w-px bg-darkbg-border" />

        {/* User Card */}
        {user && (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-brand-900 border border-brand-500/30 flex items-center justify-center text-brand-500 font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            
            <div className="hidden sm:block">
              <div className="text-sm font-semibold text-white leading-tight">{user.name}</div>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xxs font-medium bg-brand-500/10 text-brand-500 border border-brand-500/20">
                {user.role}
              </span>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 text-rose-400 hover:text-rose-300 rounded-full hover:bg-rose-500/10 transition-colors ml-2"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
