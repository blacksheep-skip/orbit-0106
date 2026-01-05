import React, { useState, useMemo } from 'react';
import { Goal, SubGoal } from '../types';
import { ChevronLeft, ChevronRight, CheckCircle2, Download } from 'lucide-react';

interface Props {
  goals: Goal[];
}

export const CalendarView: React.FC<Props> = ({ goals }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Helper to normalize date to YYYY-MM-DD for comparison
  const toDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const completedMap = useMemo(() => {
    const map = new Map<string, { goalTitle: string, subGoal: SubGoal }[]>();
    
    goals.forEach(goal => {
      goal.subGoals.forEach(sg => {
        if (sg.isCompleted && sg.completedAt) {
          const dateKey = toDateKey(new Date(sg.completedAt));
          const existing = map.get(dateKey) || [];
          existing.push({ goalTitle: goal.title, subGoal: sg });
          map.set(dateKey, existing);
        }
      });
    });
    return map;
  }, [goals]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleExportCSV = () => {
    // Generate CSV data
    const headers = ['日期', '时间', '目标', '完成事项', '状态', 'AI复盘总结'];
    const rows: string[][] = [];
    
    goals.forEach(goal => {
      goal.subGoals.forEach(sg => {
        if (sg.isCompleted && sg.completedAt) {
           const d = new Date(sg.completedAt);
           // Escape quotes for CSV format
           const safeTitle = goal.title.replace(/"/g, '""');
           const safeSubGoal = sg.title.replace(/"/g, '""');
           const safeRetro = (goal.retrospective || '').replace(/"/g, '""');

           rows.push([
             d.toLocaleDateString('zh-CN'),
             d.toLocaleTimeString('zh-CN'),
             `"${safeTitle}"`, 
             `"${safeSubGoal}"`,
             '已完成',
             `"${safeRetro}"`
           ]);
        }
      });
    });

    // Sort by date desc
    rows.sort((a, b) => b[0].localeCompare(a[0]));

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `orbit_history_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderCalendarDays = () => {
    const days = [];
    // Padding for first day
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`pad-${i}`} className="h-24 bg-gray-50/30"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
      const dateKey = toDateKey(date);
      const tasks = completedMap.get(dateKey) || [];
      const isSelected = toDateKey(selectedDate) === dateKey;
      const isToday = toDateKey(new Date()) === dateKey;

      days.push(
        <div 
          key={d} 
          onClick={() => setSelectedDate(date)}
          className={`h-24 border border-gray-100 p-2 cursor-pointer transition-colors relative flex flex-col justify-between group
            ${isSelected ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-300 z-10' : 'bg-white hover:bg-gray-50'}
          `}
        >
           <div className="flex justify-between items-start">
             <span className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full
               ${isToday ? 'bg-indigo-600 text-white' : 'text-gray-700'}
             `}>
               {d}
             </span>
             {tasks.length > 0 && (
               <span className="text-[10px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">
                 {tasks.length}
               </span>
             )}
           </div>
           
           <div className="space-y-1 overflow-hidden">
             {tasks.slice(0, 2).map((t, idx) => (
               <div key={idx} className="text-[10px] truncate text-gray-500 bg-gray-100 px-1 rounded">
                 {t.subGoal.title}
               </div>
             ))}
             {tasks.length > 2 && (
               <div className="text-[10px] text-gray-400 pl-1">+ {tasks.length - 2} 更多</div>
             )}
           </div>
        </div>
      );
    }
    return days;
  };

  const selectedDateTasks = completedMap.get(toDateKey(selectedDate)) || [];

  return (
    <div className="h-full flex flex-col md:flex-row gap-6">
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        {/* Calendar Header */}
        <div className="p-4 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-4">
             <h2 className="text-lg font-bold text-gray-800">
               {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
             </h2>
             <div className="flex gap-1">
               <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded text-gray-600"><ChevronLeft size={20} /></button>
               <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded text-gray-600"><ChevronRight size={20} /></button>
             </div>
          </div>
          <button 
             onClick={handleExportCSV}
             className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50 transition-colors"
          >
            <Download size={16} /> 导出记录
          </button>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
          {['日', '一', '二', '三', '四', '五', '六'].map(day => (
            <div key={day} className="py-2 text-center text-xs font-semibold text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-7 auto-rows-fr">
            {renderCalendarDays()}
          </div>
        </div>
      </div>

      {/* Side Panel: Selected Date Details */}
      <div className="w-full md:w-80 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col">
         <h3 className="font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
           <span className="text-2xl text-indigo-600">{selectedDate.getDate()}</span>
           <span className="text-sm font-normal text-gray-500">
             {selectedDate.toLocaleDateString('zh-CN', { month: 'long', weekday: 'long' })}
           </span>
         </h3>

         <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
           {selectedDateTasks.length === 0 ? (
             <div className="text-center py-10 text-gray-400 text-sm">
               <p>这一天没有完成记录</p>
             </div>
           ) : (
             selectedDateTasks.map((item, idx) => (
               <div key={idx} className="flex gap-3 items-start">
                 <CheckCircle2 size={18} className="text-green-500 mt-0.5 shrink-0" />
                 <div>
                   <p className="text-sm font-medium text-gray-800 line-through decoration-gray-300">{item.subGoal.title}</p>
                   <p className="text-xs text-gray-500 mt-0.5">{item.goalTitle}</p>
                   {item.subGoal.completedAt && (
                     <p className="text-[10px] text-gray-400 mt-1">
                       {new Date(item.subGoal.completedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} 完成
                     </p>
                   )}
                 </div>
               </div>
             ))
           )}
         </div>
      </div>
    </div>
  );
};