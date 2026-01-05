import React from 'react';
import { Goal, MatrixQuadrant } from '../types';
import { AlertCircle, Calendar, Clock, Trash2, CheckCircle2, Plus, Sun } from 'lucide-react';

interface Props {
  goals: Goal[];
  onSelectGoal: (goal: Goal) => void;
  onDeleteGoal: (e: React.MouseEvent, id: string) => void;
  onAddToToday: (e: React.MouseEvent, id: string) => void;
}

const QuadrantCard: React.FC<{
  title: string;
  description: string;
  goals: Goal[];
  colorClass: string;
  icon: React.ReactNode;
  onSelect: (g: Goal) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  onAddToToday: (e: React.MouseEvent, id: string) => void;
}> = ({ title, description, goals, colorClass, icon, onSelect, onDelete, onAddToToday }) => (
  <div className={`flex flex-col h-full rounded-2xl border ${colorClass} bg-opacity-50 overflow-hidden`}>
    <div className={`p-4 border-b ${colorClass} bg-white bg-opacity-60 flex items-center justify-between`}>
      <div>
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          {icon} {title}
        </h3>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </div>
      <span className="text-xs font-semibold bg-white px-2 py-1 rounded-full border border-gray-200">
        {goals.length}
      </span>
    </div>
    <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-white bg-opacity-30 custom-scrollbar">
      {goals.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm italic">
          暂无目标。
        </div>
      )}
      {goals.map((goal) => {
        const completedCount = goal.subGoals.filter(s => s.isCompleted).length;
        const totalCount = goal.subGoals.length;
        const progress = totalCount === 0 ? 0 : (completedCount / totalCount) * 100;
        
        // Check if ANY incomplete sub-goal is assigned to today
        const todayStr = new Date().toISOString().split('T')[0];
        const hasTasksToday = goal.subGoals.some(sg => !sg.isCompleted && sg.assignedDate === todayStr);
        const allIncompleteAssigned = goal.subGoals.every(sg => sg.isCompleted || sg.assignedDate === todayStr);

        return (
          <div
            key={goal.id}
            onClick={() => onSelect(goal)}
            className={`bg-white p-3 rounded-xl shadow-sm border hover:shadow-md transition-all cursor-pointer group relative
              ${hasTasksToday ? 'border-indigo-400 ring-1 ring-indigo-200' : 'border-gray-100'}
            `}
          >
            {hasTasksToday && (
               <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm z-10 flex items-center gap-1">
                 <Sun size={10} /> 今天
               </div>
            )}

            <div className="flex justify-between items-start mb-2 gap-2">
              <h4 className="font-semibold text-gray-800 line-clamp-2 text-sm">{goal.title}</h4>
              <div className="flex items-center gap-1 shrink-0">
                {!allIncompleteAssigned && totalCount > completedCount && (
                  <button
                    onClick={(e) => onAddToToday(e, goal.id)}
                    className="text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 p-1 rounded transition-all"
                    title="将未完成子目标加入今天"
                  >
                    <Plus size={16} />
                  </button>
                )}
                <button
                  onClick={(e) => onDelete(e, goal.id)}
                  className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-all opacity-0 group-hover:opacity-100"
                  title="删除"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
              <div
                className={`h-1.5 rounded-full ${progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-center text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <CheckCircle2 size={12} /> {completedCount}/{totalCount}
              </span>
              {goal.deadline && (
                <span className={`px-1.5 py-0.5 rounded ${new Date(goal.deadline) < new Date() ? 'bg-red-100 text-red-600' : 'bg-gray-100'}`}>
                  {new Date(goal.deadline).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export const EisenhowerMatrix: React.FC<Props> = ({ goals, onSelectGoal, onDeleteGoal, onAddToToday }) => {
  const getGoals = (q: MatrixQuadrant) => goals.filter((g) => g.quadrant === q);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full min-h-[600px] pb-10 md:pb-0">
      <QuadrantCard
        title="重要紧急"
        description="立即去做 (Do First)"
        goals={getGoals(MatrixQuadrant.DoFirst)}
        colorClass="border-rose-200 bg-rose-50"
        icon={<AlertCircle className="text-rose-500" size={18} />}
        onSelect={onSelectGoal}
        onDelete={onDeleteGoal}
        onAddToToday={onAddToToday}
      />
      <QuadrantCard
        title="重要 不紧急"
        description="计划去做 (Schedule)"
        goals={getGoals(MatrixQuadrant.Schedule)}
        colorClass="border-blue-200 bg-blue-50"
        icon={<Calendar className="text-blue-500" size={18} />}
        onSelect={onSelectGoal}
        onDelete={onDeleteGoal}
        onAddToToday={onAddToToday}
      />
      <QuadrantCard
        title="不重要紧急"
        description="授权/委派 (Delegate)"
        goals={getGoals(MatrixQuadrant.Delegate)}
        colorClass="border-amber-200 bg-amber-50"
        icon={<Clock className="text-amber-500" size={18} />}
        onSelect={onSelectGoal}
        onDelete={onDeleteGoal}
        onAddToToday={onAddToToday}
      />
      <QuadrantCard
        title="不重要不紧急"
        description="删减/稍后 (Eliminate)"
        goals={getGoals(MatrixQuadrant.Eliminate)}
        colorClass="border-slate-200 bg-slate-50"
        icon={<Trash2 className="text-slate-500" size={18} />}
        onSelect={onSelectGoal}
        onDelete={onDeleteGoal}
        onAddToToday={onAddToToday}
      />
    </div>
  );
};