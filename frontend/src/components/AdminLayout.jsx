import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, ChefHat, ScrollText, Settings, Package } from 'lucide-react';

const AdminLayout = ({ children, title }) => {
  const navItems = [
    { icon: <ShoppingBag size={20} />, label: 'Товары', path: '/admin' },
    { icon: <Package size={20} />, label: 'Ингредиенты', path: '/admin/ingredients' },
    { icon: <ScrollText size={20} />, label: 'Техкарты', path: '/admin/recipes' },
    { icon: <Settings size={20} />, label: 'Настройки', path: '/admin/settings' },
  ];

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-inter overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col z-20">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <span className="text-xl font-bold text-blue-600 tracking-tight">MyPOS</span>
          <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Pro</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
              AD
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Admin</p>
              <p className="text-xs text-gray-500">Управляющий</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 flex-shrink-0">
          <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        </header>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
