import { Link, useLocation } from 'react-router-dom';
import { Home, Lock, Key, Menu, X, Unlock } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils/cn';

export function Navbar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  type NavItem = {
    path: string;
    label: string;
    icon: React.ElementType;
    onClick?: (e: React.MouseEvent) => void;
  };

  const leftNavItems: NavItem[] = [
    { path: '/', label: '首页', icon: Home },
    { path: '/encrypt', label: '加密工坊', icon: Lock },
    { path: '/decrypt', label: '解密工坊', icon: Unlock },
  ];

  const rightNavItems: NavItem[] = [
    { path: '/my', label: '密钥中心', icon: Key },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span>🐱</span>
                <span>哈基米 (Hajimi)</span>
              </Link>
            </div>
            {/* Left Nav Items */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {leftNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200',
                      isActive
                        ? 'border-black text-black'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-900'
                    )}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Nav Items */}
          <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
             {rightNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.label} // key path might be same for different items if not careful, label is unique here
                    to={item.path}
                    onClick={item.onClick}
                    className={cn(
                      'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200',
                      isActive
                        ? 'border-black text-black'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-900'
                    )}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Link>
                );
              })}
          </div>

          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-black hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-black"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {[...leftNavItems, ...rightNavItems].map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={(e) => {
                      setIsOpen(false);
                      if (item.onClick) item.onClick(e);
                  }}
                  className={cn(
                    'flex items-center px-3 py-2 border-l-4 text-base font-medium',
                    isActive
                      ? 'bg-gray-100 border-black text-black'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900'
                  )}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
