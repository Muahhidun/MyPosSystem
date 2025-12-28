import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, UtensilsCrossed,
  ChefHat, FileText, Settings, LogOut, ChevronRight, FlaskConical
} from 'lucide-react';

const AdminLayout = ({ children, title, breadcrumbs }) => {
  const menuGroups = [
    {
      label: "Меню",
      items: [
        { name: "Товары", path: "/admin", icon: <ShoppingBag size={18} /> },
        { name: "Ингредиенты", path: "/admin/ingredients", icon: <UtensilsCrossed size={18} /> },
        { name: "Полуфабрикаты", path: "/admin/semifinished", icon: <FlaskConical size={18} /> },
        { name: "Техкарты", path: "/admin/recipes", icon: <FileText size={18} /> },
      ]
    },
    {
      label: "Система",
      items: [
        { name: "Дашборд", path: "/dashboard", icon: <LayoutDashboard size={18} /> },
        { name: "Настройки", path: "/admin/settings", icon: <Settings size={18} /> },
      ]
    }
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 font-inter text-slate-900">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 fixed h-full z-20 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <Link to="/dashboard" className="font-bold text-xl tracking-tight text-indigo-600 flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              MP
            </div>
            MyPOS
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-6">
          {menuGroups.map((group, idx) => (
            <div key={idx}>
              <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {group.label}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/admin"}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`
                    }
                  >
                    {item.icon}
                    {item.name}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="text-xs text-slate-500 space-y-1 mb-3">
            <p className="font-semibold text-slate-700">My POS System</p>
            <p>Версия 1.0.0 MVP</p>
            <p className="text-green-600">● Система работает</p>
          </div>
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-500 hover:text-red-600 w-full transition-colors rounded-lg hover:bg-red-50"
          >
            <LogOut size={18} />
            На главную
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center text-sm text-slate-500">
             {breadcrumbs && breadcrumbs.map((crumb, index) => (
               <span key={index} className="flex items-center">
                 {index > 0 && <ChevronRight size={14} className="mx-2" />}
                 <span className={index === breadcrumbs.length - 1 ? "font-semibold text-slate-800" : ""}>
                   {crumb}
                 </span>
               </span>
             ))}
          </div>
          <div className="flex items-center gap-4">
             <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-slate-700">Администратор</span>
                <span className="text-xs text-slate-400">Управляющий</span>
             </div>
             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 border-2 border-white shadow-sm flex items-center justify-center text-white font-bold">
               A
             </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full">
           {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
