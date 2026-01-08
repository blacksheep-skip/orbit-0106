import React, { useState, useEffect, useRef } from 'react';
import { EisenhowerMatrix } from './components/EisenhowerMatrix';
import { GoalDetail } from './components/GoalDetail';
import { Sidebar } from './components/Sidebar';
import { TodayView } from './components/TodayView';
import { CalendarView } from './components/CalendarView';
import { SettingsView } from './components/SettingsView';
import { Goal, MatrixQuadrant } from './types';
import { PlusCircle, Upload } from 'lucide-react';
import { getLocalDateKey } from './utils/date';

const INITIAL_GOALS: Goal[] = [
  {
    id: '1',
    title: '发布 MVP 网站',
    description: '构建并部署个人作品集的第一个版本。',
    quadrant: MatrixQuadrant.DoFirst,
    deadline: new Date(Date.now() + 86400000 * 3).toISOString(),
    subGoals: [
      { 
        id: '1-1', 
        title: '设计主页视觉', 
        isCompleted: true,
        completedAt: Date.now() - 1000000,
        logs: [
           { id: 'l1', timestamp: Date.now() - 100000, content: '参考了 Dribbble 上的极简风格，确定了黑白配色。', mood: 'focused' },
           { id: 'l2', timestamp: Date.now() - 90000, content: '在 Figma 中完成了 Header 和 Hero Section 的草图。', mood: 'happy' }
        ]
      },
      { 
        id: '1-2', 
        title: '配置 React 路由', 
        isCompleted: false,
        logs: [
           { id: 'l3', timestamp: Date.now() - 50000, content: '安装了 react-router-dom v6，阅读文档中。', mood: 'neutral' },
           { id: 'l4', timestamp: Date.now() - 20000, content: '嵌套路由配置报错，正在排查 Outlet 组件的使用问题。', mood: 'frustrated' }
        ]
      },
    ],
    retrospective: '',
    createdAt: Date.now()
  }
];

const App: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem('orbit_goals');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_GOALS;
      }
    }
    return INITIAL_GOALS;
  });
  
  const [currentView, setCurrentView] = useState<'matrix' | 'today' | 'calendar' | 'settings'>('today');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // New Goal Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newQuadrant, setNewQuadrant] = useState<MatrixQuadrant>(MatrixQuadrant.DoFirst);

  useEffect(() => {
    localStorage.setItem('orbit_goals', JSON.stringify(goals));
  }, [goals]);

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newGoal: Goal = {
      id: crypto.randomUUID(),
      title: newTitle,
      description: newDesc,
      quadrant: newQuadrant,
      deadline: new Date(Date.now() + 86400000 * 7).toISOString(), // Default 1 week
      subGoals: [],
      createdAt: Date.now()
    };

    setGoals([...goals, newGoal]);
    setIsAdding(false);
    setNewTitle('');
    setNewDesc('');
  };

  const handleDeleteGoal = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("确定要删除这个目标吗？")) {
      setGoals(goals.filter(g => g.id !== id));
      if (selectedGoalId === id) setSelectedGoalId(null);
    }
  };

  const handleUpdateGoal = (updatedGoal: Goal) => {
    setGoals(goals.map(g => g.id === updatedGoal.id ? updatedGoal : g));
  };

  // Add ALL incomplete sub-goals of this goal to today
  const handleAddToToday = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const todayStr = getLocalDateKey();
    
    // Find current max index to append to end
    let maxIndex = 0;
    goals.forEach(g => {
        g.subGoals.forEach(sg => {
            if (sg.assignedDate === todayStr && (sg.todayIndex || 0) > maxIndex) {
                maxIndex = sg.todayIndex || 0;
            }
        });
    });

    setGoals(goals.map(g => {
      if (g.id === id) {
        // If there are no sub-goals yet, create one so the goal can appear in Today view.
        // This matches user expectation: clicking "+" means "add this goal to today".
        if (g.subGoals.length === 0) {
          return {
            ...g,
            subGoals: [
              {
                id: crypto.randomUUID(),
                title: g.title,
                isCompleted: false,
                assignedDate: todayStr,
                todayIndex: maxIndex + 1,
                logs: []
              }
            ]
          };
        }

        return {
          ...g,
          subGoals: g.subGoals.map((sg, idx) => 
            !sg.isCompleted ? { ...sg, assignedDate: todayStr, todayIndex: maxIndex + idx + 1 } : sg
          )
        };
      }
      return g;
    }));
  };

  const handleRemoveSubGoalFromToday = (goalId: string, subGoalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const updatedSubGoals = goal.subGoals.map(sg => {
      if (sg.id === subGoalId) {
        return { ...sg, assignedDate: undefined };
      }
      return sg;
    });

    handleUpdateGoal({ ...goal, subGoals: updatedSubGoals });
  };

  const handleToggleSubGoalInToday = (goalId: string, subGoalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const updatedSubGoals = goal.subGoals.map(sg => {
      if (sg.id === subGoalId) {
        // When marking as completed, use current local time
        // Date.now() is fine, but we'll ensure it's treated as local time when displayed
        return { 
          ...sg, 
          isCompleted: !sg.isCompleted,
          completedAt: !sg.isCompleted ? Date.now() : undefined
        };
      }
      return sg;
    });

    handleUpdateGoal({ ...goal, subGoals: updatedSubGoals });
  };

  const handleUpdateTodayOrder = (items: { goalId: string, subGoalId: string, newIndex: number }[]) => {
      const updatesMap = new Map<string, Map<string, number>>();
      
      items.forEach(item => {
          if (!updatesMap.has(item.goalId)) updatesMap.set(item.goalId, new Map());
          updatesMap.get(item.goalId)?.set(item.subGoalId, item.newIndex);
      });

      setGoals(goals.map(g => {
          if (updatesMap.has(g.id)) {
              const subUpdates = updatesMap.get(g.id)!;
              return {
                  ...g,
                  subGoals: g.subGoals.map(sg => {
                      if (subUpdates.has(sg.id)) {
                          return { ...sg, todayIndex: subUpdates.get(sg.id) };
                      }
                      return sg;
                  })
              }
          }
          return g;
      }));
  };

  // Helper to get local date string (YYYY-MM-DD) without timezone issues
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Add scheduled task for a specific date
  const handleAddScheduledTask = (dateKey: string, title: string, desc?: string) => {
    // Find max todayIndex for the target date
    let maxIndex = 0;
    goals.forEach(g => {
      g.subGoals.forEach(sg => {
        if (sg.assignedDate === dateKey && (sg.todayIndex || 0) > maxIndex) {
          maxIndex = sg.todayIndex || 0;
        }
      });
    });

    // Create a new goal for scheduled tasks
    const newGoal: Goal = {
      id: crypto.randomUUID(),
      title: desc || '计划任务',
      description: desc || '',
      quadrant: MatrixQuadrant.Schedule,
      deadline: new Date(dateKey + 'T23:59:59').toISOString(),
      subGoals: [{
        id: crypto.randomUUID(),
        title: title,
        isCompleted: false,
        assignedDate: dateKey,
        todayIndex: maxIndex + 1,
        logs: []
      }],
      createdAt: Date.now()
    };

    setGoals([...goals, newGoal]);
  };

  // Update a scheduled task (calendar-created task)
  const handleUpdateScheduledTask = (
    goalId: string,
    subGoalId: string,
    updates: { title?: string; desc?: string; assignedDate?: string }
  ) => {
    setGoals(goals.map(g => {
      if (g.id !== goalId) return g;
      return {
        ...g,
        description: updates.desc !== undefined ? updates.desc : g.description,
        subGoals: g.subGoals.map(sg => {
          if (sg.id !== subGoalId) return sg;
          return {
            ...sg,
            title: updates.title !== undefined ? updates.title : sg.title,
            assignedDate: updates.assignedDate !== undefined ? updates.assignedDate : sg.assignedDate
          };
        })
      };
    }));
  };

  // Delete a scheduled task (remove sub-goal; if goal becomes empty, remove it)
  const handleDeleteScheduledTask = (goalId: string, subGoalId: string) => {
    setGoals(goals.flatMap(g => {
      if (g.id !== goalId) return [g];
      const nextSubGoals = g.subGoals.filter(sg => sg.id !== subGoalId);
      if (nextSubGoals.length === 0) return [];
      return [{ ...g, subGoals: nextSubGoals }];
    }));
  };

  // --- CSV Import Logic ---
  const mapQuadrantFromText = (text: string): MatrixQuadrant => {
    const t = text.trim();
    if (t.includes('重要') && t.includes('紧急') && !t.includes('不')) return MatrixQuadrant.DoFirst;
    if (t.includes('重要') && t.includes('不紧急')) return MatrixQuadrant.Schedule;
    if (t.includes('不重要') && t.includes('紧急') && !t.includes('不紧急')) return MatrixQuadrant.Delegate;
    if (t.includes('不重要') && t.includes('不紧急')) return MatrixQuadrant.Eliminate;
    
    // Fallback specific mappings
    if (t === '立即去做' || t === 'Do First') return MatrixQuadrant.DoFirst;
    if (t === '计划去做' || t === 'Schedule') return MatrixQuadrant.Schedule;
    if (t === '授权' || t === 'Delegate') return MatrixQuadrant.Delegate;
    if (t === '删减' || t === 'Eliminate') return MatrixQuadrant.Eliminate;
    
    return MatrixQuadrant.DoFirst; // Default
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      try {
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        const newGoals: Goal[] = [];
        let successCount = 0;

        const startIndex = (lines[0].includes('标题') || lines[0].includes('Title')) ? 1 : 0;

        for (let i = startIndex; i < lines.length; i++) {
          const cols = lines[i].split(',').map(s => s.trim().replace(/^"|"$/g, ''));
          
          let title = cols[0];
          let quadrantStr = '';
          let desc = '';

          if (cols.length >= 3) {
             if (cols[1].includes('重要') || cols[1].includes('紧急')) {
                quadrantStr = cols[1];
                desc = cols[2] || '';
             } else if (cols[2].includes('重要') || cols[2].includes('紧急')) {
                desc = cols[1];
                quadrantStr = cols[2];
             } else {
                desc = cols[1];
                quadrantStr = cols[2];
             }
          } else if (cols.length === 2) {
             quadrantStr = cols[1];
          }

          if (title) {
            newGoals.push({
              id: crypto.randomUUID(),
              title: title,
              description: desc,
              quadrant: mapQuadrantFromText(quadrantStr),
              deadline: new Date(Date.now() + 86400000 * 7).toISOString(),
              subGoals: [],
              createdAt: Date.now()
            });
            successCount++;
          }
        }

        if (successCount > 0) {
          setGoals(prev => [...prev, ...newGoals]);
          alert(`成功导入 ${successCount} 个目标！`);
        } else {
          alert('未能识别数据，请确保 CSV 格式为：标题, 描述, 紧急程度');
        }
      } catch (err) {
        console.error(err);
        alert('解析文件失败，请检查是否为有效的 CSV 文件');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // --- Settings Actions ---
  const handleImportJSON = (importedGoals: Goal[]) => {
    setGoals(importedGoals);
  };

  const handleClearAllData = () => {
    setGoals([]);
  };

  const selectedGoal = goals.find(g => g.id === selectedGoalId);
  
  // Count sub-goals for today
  const todayDateKey = getLocalDateKey();
  const todaySubGoalsCount = goals.reduce((acc, goal) => {
    return acc + goal.subGoals.filter(sg => sg.assignedDate === todayDateKey && !sg.isCompleted).length;
  }, 0);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 text-gray-800 overflow-hidden">
      {/* Sidebar - Handles both Desktop Side and Mobile Bottom */}
      <Sidebar 
        currentView={currentView} 
        onChangeView={(view) => {
          setCurrentView(view);
          setSelectedGoalId(null);
        }}
        todayCount={todaySubGoalsCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative pb-[70px] md:pb-0">
        {/* Hidden File Input for CSV Import */}
        <input 
          type="file" 
          accept=".csv" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          className="hidden" 
        />

        {selectedGoal ? (
          <div className="h-full p-4 md:p-6 overflow-hidden">
             <GoalDetail 
              goal={selectedGoal} 
              onBack={() => setSelectedGoalId(null)}
              onUpdateGoal={handleUpdateGoal}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full">
            {/* Header */}
            {currentView !== 'settings' && (
              <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <h2 className="text-xl font-bold text-gray-800">
                  {currentView === 'matrix' && '目标仓库'}
                  {currentView === 'today' && '今日待办'}
                  {currentView === 'calendar' && '历史日历'}
                </h2>
                <div className="flex items-center gap-3">
                  {currentView === 'matrix' && (
                    <>
                      <button 
                        onClick={triggerFileInput}
                        className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 hidden sm:flex"
                      >
                        <Upload size={18} /> <span className="hidden sm:inline">导入 CSV</span>
                      </button>
                      <button 
                        onClick={() => setIsAdding(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
                      >
                        <PlusCircle size={18} /> 新建目标
                      </button>
                    </>
                  )}
                </div>
              </header>
            )}

            {/* Scrollable Content */}
            <main className="flex-1 overflow-y-auto p-4 md:p-6">
              {currentView === 'matrix' && (
                <EisenhowerMatrix 
                  goals={goals.filter(g => !g.retrospective || g.retrospective.trim() === '')}
                  completedGoals={goals.filter(g => g.retrospective && g.retrospective.trim() !== '')}
                  onSelectGoal={(g) => setSelectedGoalId(g.id)}
                  onDeleteGoal={handleDeleteGoal}
                  onAddToToday={handleAddToToday}
                />
              )}
              {currentView === 'today' && (
                <TodayView 
                  goals={goals} 
                  onToggleSubGoal={handleToggleSubGoalInToday}
                  onRemoveSubGoalFromToday={handleRemoveSubGoalFromToday}
                  onOpenDetail={(g) => setSelectedGoalId(g.id)}
                  onUpdateOrder={handleUpdateTodayOrder}
                />
              )}
              {currentView === 'calendar' && (
                 <CalendarView
                   goals={goals}
                   onAddScheduledTask={handleAddScheduledTask}
                   onUpdateScheduledTask={handleUpdateScheduledTask}
                   onDeleteScheduledTask={handleDeleteScheduledTask}
                 />
              )}
              {currentView === 'settings' && (
                <SettingsView 
                  goals={goals} 
                  onImport={handleImportJSON}
                  onClearAll={handleClearAllData}
                />
              )}
            </main>
          </div>
        )}
      </div>

      {/* Add Goal Modal Overlay */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 pb-20 md:pb-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">创建新目标</h2>
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">目标标题</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="例如：学习 TypeScript"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none h-20 resize-none"
                  placeholder="预期的成果是什么？"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">紧急程度 / 重要性</label>
                <select
                  value={newQuadrant}
                  onChange={e => setNewQuadrant(e.target.value as MatrixQuadrant)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                >
                  <option value={MatrixQuadrant.DoFirst}>重要紧急 (Do First)</option>
                  <option value={MatrixQuadrant.Schedule}>重要 不紧急 (Schedule)</option>
                  <option value={MatrixQuadrant.Delegate}>不重要紧急 (Delegate)</option>
                  <option value={MatrixQuadrant.Eliminate}>不重要不紧急 (Eliminate)</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;