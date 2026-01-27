import React, { useState, useMemo, useRef } from 'react';
import { Goal, SubGoal } from '../types';
import { ChevronLeft, ChevronRight, CheckCircle2, Download, Plus } from 'lucide-react';
import { getLocalDateKey } from '../utils/date';

interface Props {
  goals: Goal[];
  onAddScheduledTask: (dateKey: string, title: string, desc?: string) => void;
}

export const CalendarView: React.FC<Props> = ({ goals, onAddScheduledTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Helper to normalize date to YYYY-MM-DD for comparison (using local time)
  const toDateKey = (date: Date) => {
    return getLocalDateKey(date);
  };

  const completedMap = useMemo(() => {
    const map = new Map<string, { goalTitle: string, subGoal: SubGoal }[]>();
    
    goals.forEach(goal => {
      goal.subGoals.forEach(sg => {
        if (sg.isCompleted && sg.completedAt) {
          // Date.now() returns milliseconds since epoch
          // new Date(timestamp) creates a date in local timezone
          // Use getFullYear(), getMonth(), getDate() which return local time values
          const completedDate = new Date(sg.completedAt);
          // Directly use local date components - these are already in local time
          const dateKey = toDateKey(completedDate);
          const existing = map.get(dateKey) || [];
          existing.push({ goalTitle: goal.title, subGoal: sg });
          map.set(dateKey, existing);
        }
      });
    });
    return map;
  }, [goals]);

  // Pending scheduled tasks by date (未完成且有 assignedDate)
  const scheduledMap = useMemo(() => {
    const map = new Map<string, { goalTitle: string, subGoal: SubGoal }[]>();
    goals.forEach(goal => {
      goal.subGoals.forEach(sg => {
        if (!sg.isCompleted && sg.assignedDate) {
          const dateKey = sg.assignedDate;
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

  const shiftSelectedDate = (deltaDays: number) => {
    const next = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + deltaDays);
    setSelectedDate(next);
    // Keep calendar month in sync when crossing months
    if (next.getFullYear() !== currentDate.getFullYear() || next.getMonth() !== currentDate.getMonth()) {
      setCurrentDate(new Date(next.getFullYear(), next.getMonth(), 1));
    }
  };

  const handlePanelTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const handlePanelTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    // Only treat as horizontal swipe if it’s mostly horizontal and long enough
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) shiftSelectedDate(1); // swipe left -> next day
    else shiftSelectedDate(-1); // swipe right -> previous day
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
      const scheduled = scheduledMap.get(dateKey) || [];
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
             {isSelected && (
               <button
                 onClick={(e) => {
                   e.stopPropagation();
                   setSelectedDate(date);
                   setIsAddModalOpen(true);
                 }}
                 className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-sm active:scale-95 transition-transform"
                 title="为这一天添加待办"
                 aria-label="为这一天添加待办"
               >
                 <Plus size={16} />
               </button>
             )}
             <div className="flex items-center gap-1">
               {scheduled.length > 0 && (
                 <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded-full">
                   待 {scheduled.length}
                 </span>
               )}
               {tasks.length > 0 && (
                 <span className="text-[10px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">
                   完 {tasks.length}
                 </span>
               )}
             </div>
           </div>
           
           <div className="space-y-1 overflow-hidden">
             {scheduled.slice(0, 1).map((t, idx) => (
               <div key={`s-${idx}`} className="text-[10px] truncate text-indigo-600 bg-indigo-50 px-1 rounded">
                 {t.subGoal.title}
               </div>
             ))}
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

  const selectedDateKey = toDateKey(selectedDate);
  const selectedDateTasks = completedMap.get(selectedDateKey) || [];
  const selectedScheduled = scheduledMap.get(selectedDateKey) || [];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onAddScheduledTask(selectedDateKey, newTaskTitle.trim(), newTaskDesc.trim() || undefined);
    setNewTaskTitle('');
    setNewTaskDesc('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-4 md:gap-6 overflow-hidden">
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden min-h-0">
        {/* Calendar Header */}
        <div className="p-4 flex items-center justify-between border-b border-gray-100 shrink-0">
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
        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50 shrink-0">
          {['日', '一', '二', '三', '四', '五', '六'].map(day => (
            <div key={day} className="py-2 text-center text-xs font-semibold text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
          <div className="grid grid-cols-7 auto-rows-fr">
            {renderCalendarDays()}
          </div>
        </div>
      </div>

      {/* Side Panel: Selected Date Details - 手机端在下方，桌面端在右侧 */}
      <div
        className="w-full md:w-80 bg-white rounded-2xl shadow-sm border-2 border-indigo-200 flex flex-col overflow-hidden shrink-0 md:max-h-full"
        style={{ maxHeight: '60vh' }}
        onTouchStart={handlePanelTouchStart}
        onTouchEnd={handlePanelTouchEnd}
      >
         <div className="shrink-0 px-4 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between gap-3">
           <div className="flex items-center gap-2">
             <span className="text-2xl text-indigo-600 font-bold">{selectedDate.getDate()}</span>
             <span className="text-sm font-normal text-gray-500">
               {selectedDate.toLocaleDateString('zh-CN', { month: 'long', weekday: 'long' })}
             </span>
           </div>
           <div className="flex items-center gap-1 shrink-0">
             <button
               onClick={() => shiftSelectedDate(-1)}
               className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
               aria-label="前一天"
               title="前一天"
             >
               <ChevronLeft size={20} />
             </button>
             <button
               onClick={() => shiftSelectedDate(1)}
               className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
               aria-label="后一天"
               title="后一天"
             >
               <ChevronRight size={20} />
             </button>
           </div>
         </div>

         {/* Hint for mobile */}
         <div className="px-4 shrink-0 border-b border-gray-100 pb-3 mb-3">
           <p className="text-xs text-gray-500">
             选中日期后，点击日历格子右上角的 <span className="inline-flex items-center justify-center w-5 h-5 bg-indigo-600 text-white rounded-full align-middle mx-1">+</span> 添加待办
           </p>
         </div>

         <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 px-4 pb-4">
           {selectedScheduled.length === 0 && selectedDateTasks.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">
              <p>这一天还没有计划或完成记录</p>
            </div>
           ) : (
            <>
              {selectedScheduled.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-indigo-600 mb-2">待办</p>
                  <div className="space-y-2">
                    {selectedScheduled.map((item, idx) => (
                      <div key={`plan-${idx}`} className="flex gap-3 items-start bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{item.subGoal.title}</p>
                          {item.goalTitle && <p className="text-xs text-gray-500 mt-0.5">{item.goalTitle}</p>}
                          <p className="text-[10px] text-gray-400 mt-1">计划于此日显示在“今日待办”</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectedDateTasks.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-green-600 mb-2 mt-2">已完成</p>
                  <div className="space-y-2">
                    {selectedDateTasks.map((item, idx) => (
                      <div key={`done-${idx}`} className="flex gap-3 items-start">
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
                    ))}
                  </div>
                </div>
              )}
            </>
           )}
         </div>
      </div>

      {/* Add Task Modal (mobile-friendly) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 pb-20 md:pb-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-900">
                添加到 {selectedDate.toLocaleDateString('zh-CN')}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100"
                aria-label="关闭"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <input
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                placeholder="待办标题（必填）"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                autoFocus
              />
              <textarea
                value={newTaskDesc}
                onChange={e => setNewTaskDesc(e.target.value)}
                placeholder="可选描述"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none h-20 resize-none"
              />
              <button
                type="submit"
                disabled={!newTaskTitle.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Plus size={18} /> 添加
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};