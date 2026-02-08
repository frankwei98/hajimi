import { Link, useLocation } from 'react-router-dom';
import { Home, Lock, Key, UserPlus, LogIn, Menu, X, LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useState } from 'react';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export function Navbar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Mock login state

  type NavItem = {
    path: string;
    label: string;
    icon: React.ElementType;
    onClick?: (e: React.MouseEvent) => void;
  };

  const leftNavItems: NavItem[] = [
    { path: '/', label: '首页', icon: Home },
    { path: '/encrypt', label: '加密工坊', icon: Lock },
  ];

  const rightNavItems: NavItem[] = isLoggedIn
    ? [
        { path: '/my', label: '密钥中心', icon: Key },
        { 
          path: '#', 
          label: '退出', 
          icon: LogOut, 
          onClick: (e: React.MouseEvent) => {
            e.preventDefault();
            setIsLoggedIn(false);
          }
        },
      ]
    : [
        { path: '/register', label: '注册', icon: UserPlus },
        { 
            path: '/login', 
            label: '登录', 
            icon: LogIn,
            onClick: () => {
                // Mock login action when clicking login page link (optional, 
                // but better to let the Login page handle it. 
                // For now, I'll add a temporary toggle in the UI or just let the user click a button)
                // Actually, let's just make the Login button toggle state for demo purposes if user wants?
                // The user said "mock login state". Usually implies a button to toggle.
                // But typically Login page handles it. 
                // Let's add a "Toggle Login" button for dev purposes or just assume clicking Login "logs you in" for this mock?
                // Let's keep it simple: clicking "Login" takes you to page. 
                // I will add a small invisible or visible dev tool or just clicking Login sets it to true?
                // No, that's confusing.
                // I will just add a small "Toggle Auth" button in the corner or just let the "Login" link work as a link, 
                // and maybe clicking "Login" in the menu *also* sets the state for demo?
                // Or better: clicking "Login" takes you to /login.
                // For this task, "mock login state (boolean code)" implies I should have a variable.
                // To allow the user to see the change, I'll make the "Login" button in the navbar also set isLoggedIn(true) for convenience?
                // No, that's bad UX.
                // I will just add a temporary "Toggle Mock Auth" button in the navbar for the user to test.
                // Or, I can just make the "Login" link `onClick={() => setIsLoggedIn(true)}` effectively treating it as "Instant Login".
                // User asked: "mock一下登录状态（代码boolean即可）"
                setIsLoggedIn(true);
            }
        },
      ];

    // To make it cleaner, I will NOT put the state change in the link click for Login/Register, 
    // but I'll add a developer toggle or just make the "Login" button toggle it for now so they can see the effect.
    // "Login" -> Click -> IsLoggedIn = true.
    
    const handleLoginClick = () => {
        setIsLoggedIn(true);
    };

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
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
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
                    onClick={item.onClick || (item.path === '/login' ? handleLoginClick : undefined)}
                    className={cn(
                      'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200',
                      isActive
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
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
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
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
                      if (item.path === '/login') handleLoginClick();
                  }}
                  className={cn(
                    'flex items-center px-3 py-2 border-l-4 text-base font-medium',
                    isActive
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
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
