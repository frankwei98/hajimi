import { Link } from 'react-router-dom';
import { cn } from '../lib/utils/cn';

type NavItem = {
  path: string;
  label: string;
  icon: React.ElementType;
  onClick?: (e: React.MouseEvent) => void;
};

export type { NavItem };

export function NavItemLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      onClick={item.onClick}
      className={cn(
        'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200',
        isActive ? 'border-black text-black' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-900',
      )}
    >
      <Icon className="w-4 h-4 mr-2" />
      {item.label}
    </Link>
  );
}

export function MobileNavItem({ item, isActive, onClose }: { item: NavItem; isActive: boolean; onClose: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      key={item.label}
      to={item.path}
      onClick={(e) => { onClose(); if (item.onClick) item.onClick(e); }}
      className={cn(
        'flex items-center px-3 py-2 border-l-4 text-base font-medium',
        isActive ? 'bg-gray-100 border-black text-black' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900',
      )}
    >
      <Icon className="w-4 h-4 mr-3" />
      {item.label}
    </Link>
  );
}