import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from '../Images/Logo.png';

export default function Navbar({ user: userProp, onSignOut }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve user from props or fallback to authenticated user in localStorage
  const currentUser = userProp || (() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || null;
    } catch {
      return null;
    }
  })();

  // Normalize role string to match database schema lowercase values
  const userRole = (currentUser?.role || 'citizen').toLowerCase();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const handleSignOut = () => {
    if (onSignOut) {
      onSignOut();
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('resq_token');
      navigate('/');
    }
  };

  // Nav items configured strictly around DB schema roles:
  // "admin", "responder", "barangay_official", "citizen"
  const navItems = [
    {
      label: 'Live Map',
      icon: 'map',
      path: userRole === 'admin' ? '/admin-dashboard' : '/user',
      roles: ['admin', 'responder', 'barangay_official', 'citizen', 'user'],
      activeColor: 'bg-amber-700/30 text-amber-300 border-amber-500/50',
      idleColor: 'bg-amber-700/20 text-amber-500 hover:text-amber-300 hover:bg-amber-700/30',
    },
    {
      label: 'Analytics',
      icon: 'analytics',
      path: '/analytics',
      roles: ['admin', 'barangay_official', 'citizen'],
      activeColor: 'bg-indigo-700/30 text-indigo-300 border-indigo-500/50',
      idleColor: 'bg-indigo-700/20 text-indigo-500 hover:text-indigo-300 hover:bg-indigo-700/30',
    },
    {
      label: 'Incidents',
      icon: 'emergency',
      path: '/incidents',
      roles: ['admin', 'responder', 'barangay_official', 'citizen', 'user'],
      activeColor: 'bg-red-700/30 text-red-300 border-red-500/50',
      idleColor: 'bg-red-700/20 text-red-500 hover:text-red-300 hover:bg-red-700/30',
    },
    {
      label: 'Manage Accounts',
      icon: 'manage_accounts',
      path: '/accounts',
      roles: ['admin'],
      activeColor: 'bg-green-700/30 text-green-300 border-green-500/50',
      idleColor: 'bg-green-700/20 text-green-500 hover:text-green-300 hover:bg-green-700/30',
    },
    {
      label: 'Manage Facilities',
      icon: 'apartment',
      path: '/facilities',
      roles: ['admin'],
      activeColor: 'bg-gray-700/30 text-gray-300 border-gray-500/50',
      idleColor: 'bg-gray-700/20 text-gray-500 hover:text-gray-300 hover:bg-gray-700/30',
    },
  ];

  // Filter visible tabs matching the user's role
  const visibleNavItems = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <header className="bg-zinc-900 text-white border-b border-zinc-700 w-full sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand Logo & System Identifier */}
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => handleNavigation(userRole === 'admin' ? '/admin-dashboard' : '/user')}
          >
            <img src={Logo} alt="ResQ Biñan Logo" className="h-10 w-auto object-contain" />
            <span className="font-bold tracking-wide text-zinc-200 text-sm">
              ResQ:Biñan
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-2 text-xs font-semibold" aria-label="Main Navigation">
            {visibleNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors cursor-pointer border ${
                    isActive ? item.activeColor : `${item.idleColor} border-transparent`
                  }`}
                >
                  <span className="material-symbols-outlined text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center pl-2">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-red-400 px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">logout</span>
                <span>Sign out</span>
              </button>
            </div>
          </nav>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center md:hidden space-x-2">
            <button
              onClick={toggleMobileMenu}
              className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-800 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              <span className="material-symbols-outlined text-2xl">
                {isMobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-900 px-4 pt-3 pb-4 space-y-2">
          <div className="text-xs font-semibold text-zinc-500 px-2 pb-1 uppercase tracking-wider">
            Logged in as {currentUser?.username || 'User'} ({userRole})
          </div>

          {visibleNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? item.activeColor : `${item.idleColor}`
                }`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-2 border-t border-zinc-800">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-950/30 transition-colors"
            >
              <span className="material-symbols-outlined">logout</span>
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}