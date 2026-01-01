import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Truck, 
  Receipt,
  DollarSign,
  Settings,
  HelpCircle,
  MoreVertical,
  LogOut
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  action?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children, title, action }) => {
  const [showMenu, setShowMenu] = useState(false);

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Bord', tour: 'tour-dashboard' },
    { path: '/clients', icon: Users, label: 'Clients', tour: 'tour-clients' },
    { path: '/fournisseurs', icon: Truck, label: 'Fournisseurs', tour: 'tour-vendors' },
    { path: '/transactions', icon: Receipt, label: 'Transactions', tour: 'tour-transactions' },
    { path: '/payments', icon: DollarSign, label: 'Paiements', tour: 'tour-payments' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {title && <h1 className="text-lg font-bold text-gray-900">{title}</h1>}
            </div>

            <div className="flex items-center gap-2">
              {action}
              
              {/* Menu Secondaire Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
                  data-tour="tour-secondary-menu"
                >
                  <MoreVertical size={20} />
                </button>

                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1">
                      <NavLink to="/help" data-tour="help-link" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">
                        <HelpCircle size={18} className="text-gray-400" /> Aide & Support
                      </NavLink>
                      <NavLink to="/settings" data-tour="settings-link" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">
                        <Settings size={18} className="text-gray-400" /> Paramètres
                      </NavLink>
                      <hr className="my-1 border-gray-100" />
                      <button className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 w-full text-left">
                        <LogOut size={18} /> Déconnexion
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="grid grid-cols-5 h-16 max-w-7xl mx-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              data-tour={item.tour}
              className={({ isActive }) => `
                flex flex-col items-center justify-center transition-colors
                ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}
              `}
            >
              <item.icon size={22} />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};