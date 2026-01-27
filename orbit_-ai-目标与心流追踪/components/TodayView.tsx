import React, { useState, useEffect } from 'react';
import { Goal, SubGoal, MatrixQuadrant } from '../types';
import { CheckSquare, Square, CalendarOff, ArrowRight, GripVertical, Sparkles } from 'lucide-react';
import { getLocalDateKey } from '../utils/date';

interface Props {
  goals: Goal[];
  onToggleSubGoal: (goalId: string, subGoalId: string) => void;
  onRemoveSubGoalFromToday: (goalId: string, subGoalId: string) => void;
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

// Helper icon
const SunIcon = ({ size, className }: { size: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
  </svg>
);

export const TodayView: React.FC<Props> = ({ goals, onToggleSubGoal, onRemoveSubGoalFromToday, onOpenDetail, onUpdateOrder }) => {
  const [flatTasks, setFlatTasks] = useState<{ goal: Goal, subGoal: SubGoal }[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const todayKey = getLocalDateKey();
  const [dailyReview, setDailyReview] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Re-flatten tasks whenever goals change
  useEffect(() => {
      const todayDateStr = todayKey;
      const tasks: { goal: Goal, subGoal: SubGoal }[] = [];
      
      goals.forEach(g => {
          g.subGoals.forEach(sg => {
              if (sg.assignedDate === todayDateStr) {
                  tasks.push({ goal: g, subGoal: sg });
              }
          });
      });

      // Sort by todayIndex
      tasks.sort((a, b) => (a.subGoal.todayIndex || 0) - (b.subGoal.todayIndex || 0));
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

  // Load daily review
  useEffect(() => {
    const saved = localStorage.getItem(`orbit_daily_review_${todayKey}`);
    setDailyReview(saved || '');
  }, [todayKey]);

  // Persist daily review
  useEffect(() => {
    localStorage.setItem(`orbit_daily_review_${todayKey}`,
      dailyReview
    );
  }, [todayKey, dailyReview]);

  const handleSummarize = async () => {
    if (!dailyReview.trim()) return;
    setIsSummarizing(true);
    try {
      const summary = dailyReview
        .split(/\n+/)
        .map(s => s.trim())
        .filter(Boolean)
        .slice(0, 8)
        .map(s => `- ${s}`)
        .join('\n');
      setDailyReview(summary || dailyReview);
    } finally {
      setIsSummarizing(false);
    }
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

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      <div className="mb-4 bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">今天</h1>
          <p className="text-gray-500 text-sm">
            {new Date().toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="mb-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 shrink-0">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h2 className="text-sm font-bold text-gray-800">今日复盘</h2>
            <p className="text-xs text-gray-400 mt-0.5">写下今天的收获、卡点、明天的调整。</p>
          </div>
          <button
            onClick={handleSummarize}
            disabled={isSummarizing || !dailyReview.trim()}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            title="AI 总结为摘要"
          >
            <Sparkles size={14} /> {isSummarizing ? '总结中…' : 'AI'}
          </button>
        </div>
        <textarea
          value={dailyReview}
          onChange={(e) => setDailyReview(e.target.value)}
          placeholder="例如：\n1) 今天完成了哪些关键任务\n2) 遇到的最大障碍是什么\n3) 明天准备怎么调整"
          className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none min-h-[140px]"
        />
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
                      <button onClick={() => handleMove(index, 'up')} className="hover:text-indigo-600 px-1">▲</button>
                      <button onClick={() => handleMove(index, 'down')} className="hover:text-indigo-600 px-1">▼</button>
                  </div>

                  {/* Checkbox */}
                  <button 
                    onClick={() => onToggleSubGoal(item.goal.id, item.subGoal.id)}
                    className={item.subGoal.isCompleted ? 'text-green-500' : 'text-gray-300'}
                  >
                    {item.subGoal.isCompleted ? <CheckSquare size={24} /> : <Square size={24} />}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-sm font-medium truncate ${item.subGoal.isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                              {item.subGoal.title}
                          </span>
                      </div>
                      <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400 truncate max-w-[150px]">{item.goal.title}</span>
                          <QuadrantBadge q={item.goal.quadrant} />
                      </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                      <button 
                          onClick={() => onOpenDetail(item.goal)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                          <ArrowRight size={18} />
                      </button>
                      <button 
                          onClick={() => onRemoveSubGoalFromToday(item.goal.id, item.subGoal.id)}
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
    </div>
  );
};