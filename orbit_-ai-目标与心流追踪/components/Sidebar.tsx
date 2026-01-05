import React from 'react';
import { LayoutGrid, Sun, Calendar as CalendarIcon, Settings } from 'lucide-react';

interface Props {
  currentView: 'matrix' | 'today' | 'calendar' | 'settings';
  onChangeView: (view: 'matrix' | 'today' | 'calendar' | 'settings') => void;
  todayCount: number;
}

export const Sidebar: React.FC<Props> = ({ currentView, onChangeView, todayCount }) => {
  const menuItems: { 
    id: 'today' | 'matrix' | 'calendar' | 'settings'; 
    label: string; 
    icon: React.ElementType; 
    count?: number; 
  }[] = [
    { id: 'today', label: '今天', icon: Sun, count: todayCount },
    { id: 'matrix', label: '仓库', icon: LayoutGrid },
    { id: 'calendar', label: '日历', icon: CalendarIcon },
    { id: 'settings', label: '设置', icon: Settings },
  ];

  return (
    <>
      {/* Desktop Sidebar (Hidden on Mobile) */}
      <div className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col flex-shrink-0 h-full">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            O
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Orbit</h1>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group relative
                ${currentView === item.id 
                  ? 'bg-indigo-50 text-indigo-600 font-medium shadow-sm' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              <item.icon size={20} className={currentView === item.id ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'} />
              <span>{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span className="ml-auto w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full">
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="text-xs text-gray-400 text-center">
            © Orbit 2024 · v0.2.0
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation (Hidden on Desktop) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 px-6 pb-safe pt-2">
        <div className="flex justify-between items-center">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all relative
                ${currentView === item.id ? 'text-indigo-600' : 'text-gray-400'}`}
            >
              <div className="relative">
                <item.icon size={24} strokeWidth={currentView === item.id ? 2.5 : 2} />
                {item.count !== undefined && item.count > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full border border-white">
                    {item.count}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};