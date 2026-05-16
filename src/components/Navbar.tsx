import { Home, Lock, Key, Menu, X, Unlock } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NavItemLink, MobileNavItem, type NavItem } from './NavItem';

const leftNavItems: NavItem[] = [
  { path: '/', label: '首页', icon: Home },
  { path: '/encrypt', label: '加密工坊', icon: Lock },
  { path: '/decrypt', label: '解密工坊', icon: Unlock },
];

const rightNavItems: NavItem[] = [
  { path: '/my', label: '密钥中心', icon: Key },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span>🐱</span><span>哈基米 (Hajimi)</span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {leftNavItems.map((item) => (
                <NavItemLink key={item.path} item={item} isActive={location.pathname === item.path} />
              ))}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
            {rightNavItems.map((item) => (
              <NavItemLink key={item.label} item={item} isActive={location.pathname === item.path} />
            ))}
          </div>
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-black hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-black"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {[...leftNavItems, ...rightNavItems].map((item) => (
              <MobileNavItem key={item.label} item={item} isActive={location.pathname === item.path} onClose={() => setIsOpen(false)} />
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}