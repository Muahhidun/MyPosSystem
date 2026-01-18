import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, UtensilsCrossed, Monitor,
  ChefHat, FileText, Settings, LogOut, ChevronRight, FlaskConical,
  Sparkles, BarChart3
} from 'lucide-react';

const AdminLayout = ({ children, title, breadcrumbs }) => {
  const menuGroups = [
    {
      label: "OPERATIONS",
      items: [
        { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={18} /> },
        { name: "POS Terminal", path: "/pos", icon: <Monitor size={18} /> },
      ]
    },
    {
      label: "CATALOG",
      items: [
        { name: "Товары", path: "/admin", icon: <ShoppingBag size={18} /> },
        { name: "Техкарты", path: "/admin/recipes", icon: <FileText size={18} /> },
        { name: "Ингредиенты", path: "/admin/ingredients", icon: <UtensilsCrossed size={18} /> },
        { name: "Полуфабрикаты", path: "/admin/semifinished", icon: <FlaskConical size={18} /> },
      ]
    },
    {
      label: "AI CONTROL",
      accent: true,
      items: [
        { name: "Smart Assistant", path: "/admin/ai-assistant", icon: <Sparkles size={18} />, disabled: true },
        { name: "Analytics", path: "/admin/analytics", icon: <BarChart3 size={18} />, disabled: true },
      ]
    },
    {
      label: "SETTINGS",
      items: [
        { name: "Настройки", path: "/admin/settings", icon: <Settings size={18} /> },
      ]
    }
  ];

  return (
    <div className="flex min-h-screen font-inter text-slate-900" style={{ backgroundColor: '#f5f5f7' }}>
      {/* SIDEBAR - Glass Morphism */}
      <aside className="w-[280px] fixed h-full z-20 flex flex-col" style={{
        background: 'rgba(245, 245, 247, 0.75)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(0, 0, 0, 0.05)'
      }}>
        <div className="h-16 flex items-center px-6 border-b" style={{ borderColor: 'rgba(0, 0, 0, 0.05)' }}>
          <Link to="/dashboard" className="font-bold text-xl tracking-tight flex items-center gap-2" style={{ color: '#1f6b7a' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: '#1f6b7a' }}>
              MP
            </div>
            MyPOS
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-6">
          {menuGroups.map((group, idx) => (
            <div key={idx}>
              <h3 className="px-3 text-xs font-semibold uppercase tracking-wider mb-2" style={{
                color: group.accent ? '#8b5cf6' : '#94a3b8'
              }}>
                {group.label}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isAiItem = group.accent;
                  const activeColor = isAiItem ? '#8b5cf6' : '#1f6b7a';
                  const activeBg = isAiItem ? '#ede9fe' : '#e0f2f4';

                  if (item.disabled) {
                    return (
                      <div
                        key={item.path}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium opacity-40 cursor-not-allowed"
                        style={{ color: '#64748b' }}
                      >
                        {item.icon}
                        {item.name}
                        <span className="ml-auto text-xs">Soon</span>
                      </div>
                    );
                  }

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === "/admin" || item.path === "/dashboard"}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200`
                      }
                      style={({ isActive }) => ({
                        backgroundColor: isActive ? activeBg : 'transparent',
                        color: isActive ? activeColor : '#64748b'
                      })}
                    >
                      {item.icon}
                      {item.name}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t" style={{ borderColor: 'rgba(0, 0, 0, 0.05)' }}>
          <div className="text-xs space-y-1 mb-3" style={{ color: '#64748b' }}>
            <p className="font-semibold" style={{ color: '#1e293b' }}>My POS System</p>
            <p>Версия 1.0.0 MVP</p>
            <p className="flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#10b981' }}></span>
              Система работает
            </p>
          </div>
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium w-full transition-colors rounded-lg"
            style={{ color: '#64748b' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ef4444';
              e.currentTarget.style.backgroundColor = '#fee2e2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#64748b';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <LogOut size={18} />
            На главную
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-h-screen" style={{ marginLeft: '280px' }}>
        {/* Top Header */}
        <header className="h-16 bg-white flex items-center justify-between px-8 sticky top-0 z-10" style={{
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
        }}>
          <div className="flex items-center text-sm" style={{ color: '#64748b' }}>
             {breadcrumbs && breadcrumbs.map((crumb, index) => (
               <span key={index} className="flex items-center">
                 {index > 0 && <ChevronRight size={14} className="mx-2" />}
                 <span className={index === breadcrumbs.length - 1 ? "font-semibold" : ""} style={
                   index === breadcrumbs.length - 1 ? { color: '#1e293b' } : {}
                 }>
                   {crumb}
                 </span>
               </span>
             ))}
          </div>
          <div className="flex items-center gap-4">
             <div className="flex flex-col items-end">
                <span className="text-sm font-semibold" style={{ color: '#1e293b' }}>Администратор</span>
                <span className="text-xs" style={{ color: '#94a3b8' }}>Управляющий</span>
             </div>
             <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white font-bold" style={{
               background: 'linear-gradient(to bottom right, #1f6b7a, #164d58)'
             }}>
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
