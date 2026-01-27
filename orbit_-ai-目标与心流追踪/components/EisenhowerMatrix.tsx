import React, { useMemo, useState } from 'react';
import { Goal, MatrixQuadrant } from '../types';
import { AlertCircle, Calendar, Clock, Trash2, CheckCircle2, Plus, Sun, X, Trophy, Search } from 'lucide-react';
import { getLocalDateKey } from '../utils/date';

interface Props {
  goals: Goal[];
  completedGoals: Goal[];
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
  onClick: () => void;
}> = ({ title, description, goals, colorClass, icon, onClick }) => (
  <div 
    onClick={onClick}
    className={`flex flex-col h-full rounded-2xl border ${colorClass} bg-opacity-50 overflow-hidden cursor-pointer hover:shadow-lg transition-all transform hover:scale-[1.02]`}
  >
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
    <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-white bg-opacity-30 custom-scrollbar">
      {goals.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm italic">
          点击查看详情
        </div>
      )}
      {goals.slice(0, 3).map((goal) => {
        const completedCount = goal.subGoals.filter(s => s.isCompleted).length;
        const totalCount = goal.subGoals.length;
        const progress = totalCount === 0 ? 0 : (completedCount / totalCount) * 100;
        
        return (
          <div
            key={goal.id}
            className="bg-white p-2 rounded-lg shadow-sm border border-gray-100"
          >
            <h4 className="font-semibold text-gray-800 line-clamp-1 text-sm mb-1">{goal.title}</h4>
            <div className="w-full bg-gray-100 rounded-full h-1">
              <div
                className={`h-1 rounded-full ${progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        );
      })}
      {goals.length > 3 && (
        <div className="text-center text-xs text-gray-400 pt-1">
          还有 {goals.length - 3} 个目标...
        </div>
      )}
    </div>
  </div>
);

const ExpandedQuadrantView: React.FC<{
  title: string;
  description: string;
  goals: Goal[];
  colorClass: string;
  icon: React.ReactNode;
  onClose: () => void;
  onSelectGoal: (goal: Goal) => void;
  onDeleteGoal: (e: React.MouseEvent, id: string) => void;
  onAddToToday: (e: React.MouseEvent, id: string) => void;
  showAddToToday?: boolean;
  enableSearch?: boolean;
}> = ({ title, description, goals, colorClass, icon, onClose, onSelectGoal, onDeleteGoal, onAddToToday, showAddToToday = true, enableSearch = false }) => {
  const [query, setQuery] = useState('');

  const filteredGoals = useMemo(() => {
    if (!enableSearch) return goals;
    const q = query.trim().toLowerCase();
    if (!q) return goals;
    return goals.filter(g => {
      const hay = `${g.title}\n${g.description}\n${g.retrospective || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [enableSearch, goals, query]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 pb-20 md:pb-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col ${colorClass} border-2`}>
        {/* Header */}
        <div className={`p-6 border-b ${colorClass} bg-opacity-20 flex items-center justify-between sticky top-0 z-10`}>
          <div className="flex items-center gap-3">
            {icon}
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {enableSearch && (
          <div className="px-6 py-3 bg-white border-b border-gray-100 sticky top-[97px] z-10">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
              <Search size={16} className="text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索已完成目标（标题/描述/复盘）"
                className="flex-1 bg-transparent outline-none text-sm text-gray-700"
              />
              {query.trim() && (
                <button
                  onClick={() => setQuery('')}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  清除
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Scrollable Goals List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {filteredGoals.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-20">
              <p className="text-lg">{enableSearch ? '没有匹配结果' : '暂无目标'}</p>
            </div>
          )}
          {filteredGoals.map((goal) => {
            const completedCount = goal.subGoals.filter(s => s.isCompleted).length;
            const totalCount = goal.subGoals.length;
            const progress = totalCount === 0 ? 0 : (completedCount / totalCount) * 100;
            
            const todayStr = getLocalDateKey();
            const hasTasksToday = goal.subGoals.some(sg => !sg.isCompleted && sg.assignedDate === todayStr);
            const allIncompleteAssigned = goal.subGoals.every(sg => sg.isCompleted || sg.assignedDate === todayStr);

            return (
              <div
                key={goal.id}
                onClick={() => {
                  onSelectGoal(goal);
                  onClose();
                }}
                className={`bg-white p-4 rounded-xl shadow-sm border hover:shadow-md transition-all cursor-pointer group relative
                  ${hasTasksToday ? 'border-indigo-400 ring-2 ring-indigo-200' : 'border-gray-200'}
                `}
              >
                <div className="flex justify-between items-start mb-3 gap-3 relative">
                  <div className="flex-1 min-w-0 pr-2">
                    <h4 className="font-semibold text-gray-800 text-base mb-1">{goal.title}</h4>
                    {goal.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{goal.description}</p>
                    )}
                  </div>
                  {/* 按钮区域 - 确保始终显示且不被压缩 */}
                  <div className="flex items-center gap-2 shrink-0 z-30 relative" style={{ minWidth: '110px', flexShrink: 0 }}>
                    {hasTasksToday && (
                      <div className="absolute -top-8 right-0 bg-indigo-600 text-white text-xs px-2 py-1 rounded-full shadow-sm flex items-center gap-1 whitespace-nowrap z-40">
                        <Sun size={12} /> 今天
                      </div>
                    )}
                    {showAddToToday && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          onAddToToday(e, goal.id);
                        }}
                        className="text-indigo-600 hover:text-indigo-700 active:text-indigo-700 hover:bg-indigo-100 active:bg-indigo-100 p-3 rounded-lg transition-all touch-manipulation w-[48px] h-[48px] flex items-center justify-center bg-indigo-50 border-2 border-indigo-400 shadow-md"
                        title="加入今天"
                        aria-label="加入今天"
                      >
                        <Plus size={24} strokeWidth={3} />
                      </button>
                    )}
                    {/* 删除按钮 - 必须显示 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onDeleteGoal(e, goal.id);
                      }}
                      className="text-red-600 hover:text-red-700 active:text-red-700 hover:bg-red-100 active:bg-red-100 p-3 rounded-lg transition-all touch-manipulation w-[48px] h-[48px] flex items-center justify-center bg-red-50 border-2 border-red-400 shadow-md"
                      title="删除目标"
                      aria-label="删除目标"
                    >
                      <Trash2 size={24} strokeWidth={3} />
                    </button>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full ${progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>

                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 size={14} /> {completedCount}/{totalCount} 已完成
                  </span>
                  {goal.deadline && (
                    <span className={`px-2 py-1 rounded ${new Date(goal.deadline) < new Date() ? 'bg-red-100 text-red-600' : 'bg-gray-100'}`}>
                      {new Date(goal.deadline).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>

                {goal.retrospective && goal.retrospective.trim() && (
                  <div className="mt-2 text-xs text-teal-700 bg-teal-50 border border-teal-100 rounded-lg p-2 line-clamp-2">
                    复盘：{goal.retrospective.trim()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const EisenhowerMatrix: React.FC<Props> = ({ goals, completedGoals, onSelectGoal, onDeleteGoal, onAddToToday }) => {
  const [expandedQuadrant, setExpandedQuadrant] = useState<MatrixQuadrant | 'completed' | null>(null);
  
  const getGoals = (q: MatrixQuadrant) => goals.filter((g) => g.quadrant === q);

  const quadrantConfigs = [
    {
      quadrant: MatrixQuadrant.DoFirst,
      title: "重要紧急",
      description: "立即去做 (Do First)",
      colorClass: "border-rose-200 bg-rose-50",
      icon: <AlertCircle className="text-rose-500" size={18} />
    },
    {
      quadrant: MatrixQuadrant.Schedule,
      title: "重要 不紧急",
      description: "计划去做 (Schedule)",
      colorClass: "border-blue-200 bg-blue-50",
      icon: <Calendar className="text-blue-500" size={18} />
    },
    {
      quadrant: MatrixQuadrant.Delegate,
      title: "不重要紧急",
      description: "授权/委派 (Delegate)",
      colorClass: "border-amber-200 bg-amber-50",
      icon: <Clock className="text-amber-500" size={18} />
    },
    {
      quadrant: MatrixQuadrant.Eliminate,
      title: "不重要不紧急",
      description: "删减/稍后 (Eliminate)",
      colorClass: "border-slate-200 bg-slate-50",
      icon: <Trash2 className="text-slate-500" size={18} />
    }
  ];

  const handleQuadrantClick = (quadrant: MatrixQuadrant) => {
    setExpandedQuadrant(quadrant);
  };

  const handleCompletedClick = () => {
    setExpandedQuadrant('completed');
  };

  return (
    <>
      <div className="space-y-4 h-full pb-10 md:pb-0">
        {/* 四个象限网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[600px]">
          {quadrantConfigs.map((config) => (
            <QuadrantCard
              key={config.quadrant}
              title={config.title}
              description={config.description}
              goals={getGoals(config.quadrant)}
              colorClass={config.colorClass}
              icon={config.icon}
              onClick={() => handleQuadrantClick(config.quadrant)}
            />
          ))}
        </div>

        {/* 已完成板块 */}
        {completedGoals.length > 0 && (
          <div className="mt-6">
            <QuadrantCard
              title="已完成"
              description="已完成复盘的目标"
              goals={completedGoals}
              colorClass="border-green-200 bg-green-50"
              icon={<Trophy className="text-green-500" size={18} />}
              onClick={handleCompletedClick}
            />
          </div>
        )}
      </div>

      {/* 展开的象限视图 */}
      {expandedQuadrant && expandedQuadrant !== 'completed' && (
        <ExpandedQuadrantView
          title={quadrantConfigs.find(c => c.quadrant === expandedQuadrant)?.title || ''}
          description={quadrantConfigs.find(c => c.quadrant === expandedQuadrant)?.description || ''}
          goals={getGoals(expandedQuadrant)}
          colorClass={quadrantConfigs.find(c => c.quadrant === expandedQuadrant)?.colorClass || ''}
          icon={quadrantConfigs.find(c => c.quadrant === expandedQuadrant)?.icon || <></>}
          onClose={() => setExpandedQuadrant(null)}
          onSelectGoal={onSelectGoal}
          onDeleteGoal={onDeleteGoal}
          onAddToToday={onAddToToday}
        />
      )}

      {/* 已完成的展开视图 */}
      {expandedQuadrant === 'completed' && (
        <ExpandedQuadrantView
          title="已完成"
          description="已完成复盘的目标"
          goals={completedGoals}
          colorClass="border-green-200 bg-green-50"
          icon={<Trophy className="text-green-500" size={18} />}
          onClose={() => setExpandedQuadrant(null)}
          onSelectGoal={onSelectGoal}
          onDeleteGoal={onDeleteGoal}
          onAddToToday={onAddToToday}
          showAddToToday={false}
          enableSearch={true}
        />
      )}
    </>
  );
};