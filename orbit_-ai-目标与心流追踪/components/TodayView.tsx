import React, { useState, useEffect } from 'react';
import { Goal, SubGoal, MatrixQuadrant } from '../types';
import { CheckSquare, Square, CalendarOff, ArrowRight, GripVertical, ArrowRightCircle, Send, X } from 'lucide-react';
import { getLocalDateKey } from '../utils/date';

interface Props {
  goals: Goal[];
  onToggleSubGoal: (goalId: string, subGoalId: string) => void;
  onRemoveSubGoalFromToday: (goalId: string, subGoalId: string) => void;
  onDeferToTomorrow: (goalId: string, subGoalId: string) => void;
  onQuickAddLog: (goalId: string, subGoalId: string, content: string) => void;
  onOpenDetail: (goal: Goal) => void;
  onUpdateOrder: (items: { goalId: string, subGoalId: string, newIndex: number }[]) => void;
}

const QuadrantBadge: React.FC<{ q: MatrixQuadrant }> = ({ q }) => {
  const config = {
    [MatrixQuadrant.DoFirst]: { color: 'bg-rose-100 text-rose-700', label: '重要紧急' },
    [MatrixQuadrant.Schedule]: { color: 'bg-blue-100 text-blue-700', label: '重要不紧急' },
    [MatrixQuadrant.Delegate]: { color: 'bg-amber-100 text-amber-700', label: '不重要紧急' },
    [MatrixQuadrant.Eliminate]: { color: 'bg-slate-100 text-slate-700', label: '不重要不紧急' },
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${config[q].color}`}>
      {config[q].label}
    </span>
  );
};

const SourceBadge: React.FC<{ source?: Goal['source'] }> = ({ source }) => {
  if (source !== 'calendar') return null;
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700">
      日历待办
    </span>
  );
};

// Helper icon
const SunIcon = ({ size, className }: { size: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
  </svg>
);

export const TodayView: React.FC<Props> = ({ goals, onToggleSubGoal, onRemoveSubGoalFromToday, onDeferToTomorrow, onQuickAddLog, onOpenDetail, onUpdateOrder }) => {
  const [flatTasks, setFlatTasks] = useState<{ goal: Goal, subGoal: SubGoal }[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [logText, setLogText] = useState('');
  const [activeTask, setActiveTask] = useState<{ goal: Goal; subGoal: SubGoal } | null>(null);

  // Re-flatten tasks whenever goals change
  useEffect(() => {
      const todayDateStr = getLocalDateKey();
      const tasks: { goal: Goal, subGoal: SubGoal }[] = [];
      
      goals.forEach(g => {
          g.subGoals.forEach(sg => {
              // Show tasks scheduled for today OR overdue tasks (assigned earlier than today)
              if (!sg.isCompleted && sg.assignedDate && sg.assignedDate <= todayDateStr) {
                tasks.push({ goal: g, subGoal: sg });
              }
          });
      });

      // Sort overdue first (older date), then by todayIndex
      tasks.sort((a, b) => {
        const ad = a.subGoal.assignedDate || todayDateStr;
        const bd = b.subGoal.assignedDate || todayDateStr;
        if (ad !== bd) return ad.localeCompare(bd);
        return (a.subGoal.todayIndex || 0) - (b.subGoal.todayIndex || 0);
      });
      setFlatTasks(tasks);
  }, [goals]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Transparent drag image usually preferred, but default is fine
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    // Simple reorder visualization in local state before committing
    const newItems = [...flatTasks];
    const draggedItem = newItems[draggedIndex];
    newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, draggedItem);
    
    setFlatTasks(newItems);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    // Commit the new order to the parent state
    const updates = flatTasks.map((item, index) => ({
        goalId: item.goal.id,
        subGoalId: item.subGoal.id,
        newIndex: index
    }));
    onUpdateOrder(updates);
  };

  // Simple move up/down for mobile tap users who can't drag easily
  const handleMove = (index: number, direction: 'up' | 'down') => {
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= flatTasks.length) return;

      const newItems = [...flatTasks];
      const [movedItem] = newItems.splice(index, 1);
      newItems.splice(newIndex, 0, movedItem);
      
      const updates = newItems.map((item, idx) => ({
          goalId: item.goal.id,
          subGoalId: item.subGoal.id,
          newIndex: idx
      }));
      onUpdateOrder(updates);
  };

  if (flatTasks.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
          <SunIcon size={48} className="text-indigo-200" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">今天还没有安排任务</h2>
        <p className="text-gray-500 max-w-md">
          请前往“目标仓库”，点击卡片上的 <span className="inline-flex items-center justify-center w-5 h-5 bg-indigo-100 rounded text-indigo-600 mx-1">+</span> 按钮将任务加入今天，或者进入目标详情单独安排子目标。
        </p>
      </div>
    );
  }

  // Calculate progress
  const completedTasks = flatTasks.filter(t => t.subGoal.isCompleted).length;
  const progress = flatTasks.length === 0 ? 0 : Math.round((completedTasks / flatTasks.length) * 100);

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      <div className="mb-6 bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 shrink-0">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">今天</h1>
            <p className="text-gray-500 text-sm">
              {new Date().toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="text-right">
             <span className="text-3xl font-bold text-indigo-600">{progress}%</span>
             <p className="text-xs text-gray-400">今日进度</p>
          </div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div 
            className="h-2 rounded-full bg-indigo-600 transition-all duration-700 ease-out" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-24 md:pb-10">
        <div className="space-y-3">
            {flatTasks.map((item, index) => (
              <div 
                key={`${item.goal.id}-${item.subGoal.id}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => {
                  setActiveTask(item);
                  setIsLogOpen(true);
                  setLogText('');
                }}
                className={`bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex items-center gap-3 transition-all
                  ${draggedIndex === index ? 'opacity-50 scale-95 border-indigo-300' : 'hover:border-gray-300'}
                `}
              >
                  {/* Drag Handle */}
                  <div className="text-gray-300 cursor-grab active:cursor-grabbing px-1 hidden md:block">
                      <GripVertical size={20} />
                  </div>

                  {/* Mobile Sort Controls (Simple fallback for touch) */}
                  <div className="flex flex-col md:hidden text-gray-300 gap-1 mr-1">
                      <button onClick={(e) => { e.stopPropagation(); handleMove(index, 'up'); }} className="hover:text-indigo-600 px-1">▲</button>
                      <button onClick={(e) => { e.stopPropagation(); handleMove(index, 'down'); }} className="hover:text-indigo-600 px-1">▼</button>
                  </div>

                  {/* Checkbox */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); onToggleSubGoal(item.goal.id, item.subGoal.id); }}
                    className={item.subGoal.isCompleted ? 'text-green-500' : 'text-gray-300'}
                  >
                    {item.subGoal.isCompleted ? <CheckSquare size={24} /> : <Square size={24} />}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-sm font-medium whitespace-normal break-words ${item.subGoal.isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                              {item.subGoal.title}
                          </span>
                          {item.subGoal.assignedDate && item.subGoal.assignedDate < getLocalDateKey() && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">逾期</span>
                          )}
                          <SourceBadge source={item.goal.source} />
                      </div>
                      <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400 truncate max-w-[150px]">
                            {item.goal.source === 'calendar' ? '计划任务' : item.goal.title}
                          </span>
                          {item.goal.source !== 'calendar' && <QuadrantBadge q={item.goal.quadrant} />}
                      </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                      <button
                          onClick={(e) => { e.stopPropagation(); onDeferToTomorrow(item.goal.id, item.subGoal.id); }}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="顺延到明天"
                          aria-label="顺延到明天"
                      >
                          <ArrowRightCircle size={18} />
                      </button>
                      <button 
                          onClick={(e) => { e.stopPropagation(); onOpenDetail(item.goal); }}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                          <ArrowRight size={18} />
                      </button>
                      <button 
                          onClick={(e) => { e.stopPropagation(); onRemoveSubGoalFromToday(item.goal.id, item.subGoal.id); }}
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                          <CalendarOff size={18} />
                      </button>
                  </div>
              </div>
            ))}
        </div>
        
        <p className="text-center text-xs text-gray-400 mt-6 mb-2 md:hidden">
            点击左侧箭头调整顺序
        </p>
      </div>

      {/* Quick log modal */}
      {isLogOpen && activeTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 pb-20 md:pb-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="min-w-0 pr-4">
                <h3 className="text-lg font-bold text-gray-900 truncate">记录心流日志</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {activeTask.subGoal.title}
                </p>
              </div>
              <button
                onClick={() => { setIsLogOpen(false); setActiveTask(null); }}
                className="p-2 rounded-full hover:bg-gray-100"
                aria-label="关闭"
                title="关闭"
              >
                <X size={18} />
              </button>
            </div>

            <textarea
              value={logText}
              onChange={(e) => setLogText(e.target.value)}
              placeholder="此刻我在做什么？遇到了什么？下一步是什么？"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none h-28 resize-none bg-gray-50 focus:bg-white"
              autoFocus
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => { setIsLogOpen(false); setActiveTask(null); }}
                className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => {
                  onQuickAddLog(activeTask.goal.id, activeTask.subGoal.id, logText);
                  setIsLogOpen(false);
                  setActiveTask(null);
                }}
                disabled={!logText.trim()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-2"
              >
                <Send size={16} /> 保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};