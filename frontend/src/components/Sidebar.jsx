import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Car, AlertTriangle, Activity, Landmark, Route } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const links = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Navigation Module', path: '/navigation', icon: Route },
    { name: 'Traffic Optimization', path: '/traffic', icon: Car },
    { name: 'Emergency Alerts', path: '/emergency', icon: AlertTriangle },
    { name: 'Utility Grid', path: '/utility', icon: Activity },
  ];

  return (
    <aside className="w-64 bg-darkbg-card border-r border-darkbg-border flex flex-col hidden md:flex">
      <div className="p-6 border-b border-darkbg-border flex items-center gap-3">
        <Landmark className="h-8 w-8 text-brand-500" />
        <div>
          <h1 className="font-bold text-lg leading-none text-white">Smart City</h1>
          <span className="text-xs text-darkbg-textMuted font-medium">Management System</span>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                  : 'text-darkbg-textMuted hover:bg-darkbg-border hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" />
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-darkbg-border">
        <div className="bg-darkbg-pure p-3 rounded-lg text-xs text-darkbg-textMuted text-center">
          v1.0.0 (Production Setup)
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
