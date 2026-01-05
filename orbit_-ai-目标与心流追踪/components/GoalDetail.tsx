import React, { useState, useRef, useEffect } from 'react';
import { Goal, SubGoal, GoalLog, MatrixQuadrant } from '../types';
import { ArrowLeft, CheckSquare, Square, Send, Copy, FileText, Activity, ChevronRight, MousePointerClick, Sun, Pencil, Save, X } from 'lucide-react';
import { formatGoalForExport } from '../services/geminiService';

interface Props {
  goal: Goal;
  onBack: () => void;
  onUpdateGoal: (updatedGoal: Goal) => void;
}

const QuadrantLabels: Record<MatrixQuadrant, string> = {
  [MatrixQuadrant.DoFirst]: '重要紧急',
  [MatrixQuadrant.Schedule]: '重要 不紧急',
  [MatrixQuadrant.Delegate]: '不重要紧急',
  [MatrixQuadrant.Eliminate]: '不重要不紧急'
};

export const GoalDetail: React.FC<Props> = ({ goal, onBack, onUpdateGoal }) => {
  // State for subgoals
  const [newSubGoal, setNewSubGoal] = useState('');
  const [logInput, setLogInput] = useState('');
  const [activeSubGoalId, setActiveSubGoalId] = useState<string | null>(
    goal.subGoals.length > 0 ? goal.subGoals[0].id : null
  );
  
  // State for Editing
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(goal.title);
  const [editDesc, setEditDesc] = useState(goal.description);
  const [editQuadrant, setEditQuadrant] = useState(goal.quadrant);
  
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const activeSubGoal = goal.subGoals.find(sg => sg.id === activeSubGoalId);
  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [activeSubGoal?.logs, activeSubGoalId]);

  // Sync edit state if goal changes externally (rare but good practice)
  useEffect(() => {
    setEditTitle(goal.title);
    setEditDesc(goal.description);
    setEditQuadrant(goal.quadrant);
  }, [goal]);

  const handleSaveEdit = () => {
    onUpdateGoal({
      ...goal,
      title: editTitle,
      description: editDesc,
      quadrant: editQuadrant
    });
    setIsEditing(false);
  };

  const handleAddSubGoal = () => {
    if (!newSubGoal.trim()) return;
    const newId = crypto.randomUUID();
    const newItem: SubGoal = {
      id: newId,
      title: newSubGoal,
      isCompleted: false,
      logs: []
    };
    const updatedSubGoals = [...goal.subGoals, newItem];
    onUpdateGoal({
      ...goal,
      subGoals: updatedSubGoals
    });
    setNewSubGoal('');
    setActiveSubGoalId(newId);
  };

  const toggleSubGoalCompletion = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedSubGoals = goal.subGoals.map(sg => {
      if (sg.id === id) {
        return { 
          ...sg, 
          isCompleted: !sg.isCompleted,
          completedAt: !sg.isCompleted ? Date.now() : undefined
        };
      }
      return sg;
    });
    onUpdateGoal({ ...goal, subGoals: updatedSubGoals });
  };

  const toggleSubGoalToday = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedSubGoals = goal.subGoals.map(sg => {
      if (sg.id === id) {
        return { 
          ...sg, 
          assignedDate: sg.assignedDate === todayStr ? undefined : todayStr
        };
      }
      return sg;
    });
    onUpdateGoal({ ...goal, subGoals: updatedSubGoals });
  };

  const handleAddLog = () => {
    if (!logInput.trim() || !activeSubGoalId) return;
    
    const newLog: GoalLog = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      content: logInput,
      mood: 'neutral'
    };

    const updatedSubGoals = goal.subGoals.map(sg => {
      if (sg.id === activeSubGoalId) {
        return { ...sg, logs: [...sg.logs, newLog] };
      }
      return sg;
    });

    onUpdateGoal({ ...goal, subGoals: updatedSubGoals });
    setLogInput('');
  };

  const handleCopyRecord = () => {
    const text = formatGoalForExport(goal);
    navigator.clipboard.writeText(text).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    });
  };

  const handleUpdateRetrospective = (text: string) => {
    onUpdateGoal({ ...goal, retrospective: text });
  };

  const completedCount = goal.subGoals.filter(s => s.isCompleted).length;
  const progress = goal.subGoals.length ? Math.round((completedCount / goal.subGoals.length) * 100) : 0;

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 overflow-y-auto md:overflow-hidden pb-10 md:pb-0">
      
      {/* Column 1: Header & Sub-goal List */}
      <div className="w-full md:w-1/3 flex flex-col gap-4 md:h-full shrink-0">
        <div className="flex-none">
          <button onClick={onBack} className="flex items-center text-gray-500 hover:text-gray-800 self-start mb-2">
            <ArrowLeft size={16} className="mr-1" /> 返回
          </button>
          
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4 relative">
             {!isEditing ? (
               <>
                 <div className="flex justify-between items-start mb-2">
                   <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-md inline-block">
                     {QuadrantLabels[goal.quadrant]}
                   </span>
                   <button 
                     onClick={() => setIsEditing(true)}
                     className="text-gray-400 hover:text-indigo-600 p-1 rounded-md transition-colors"
                     title="编辑目标"
                   >
                     <Pencil size={16} />
                   </button>
                 </div>
                 <h1 className="text-xl font-bold text-gray-900 leading-tight mb-2">{goal.title}</h1>
                 <p className="text-sm text-gray-500 mb-3">{goal.description}</p>
                 <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                    <div className="h-1.5 rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${progress}%` }} />
                 </div>
               </>
             ) : (
               <div className="space-y-3">
                 <input 
                   type="text" 
                   value={editTitle} 
                   onChange={e => setEditTitle(e.target.value)}
                   className="w-full font-bold text-lg border-b border-gray-300 focus:border-indigo-600 outline-none pb-1"
                   placeholder="目标标题"
                 />
                 <textarea 
                   value={editDesc} 
                   onChange={e => setEditDesc(e.target.value)}
                   className="w-full text-sm text-gray-600 border border-gray-200 rounded p-2 focus:ring-1 focus:ring-indigo-600 outline-none resize-none"
                   rows={3}
                   placeholder="描述..."
                 />
                 <select 
                   value={editQuadrant}
                   onChange={e => setEditQuadrant(e.target.value as MatrixQuadrant)}
                   className="w-full text-sm p-2 border border-gray-200 rounded bg-gray-50 outline-none"
                 >
                    <option value={MatrixQuadrant.DoFirst}>重要紧急 (Do First)</option>
                    <option value={MatrixQuadrant.Schedule}>重要 不紧急 (Schedule)</option>
                    <option value={MatrixQuadrant.Delegate}>不重要紧急 (Delegate)</option>
                    <option value={MatrixQuadrant.Eliminate}>不重要不紧急 (Eliminate)</option>
                 </select>
                 <div className="flex justify-end gap-2 pt-1">
                   <button 
                     onClick={() => setIsEditing(false)}
                     className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
                   >
                     <X size={18} />
                   </button>
                   <button 
                     onClick={handleSaveEdit}
                     className="p-1.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-sm"
                   >
                     <Save size={18} />
                   </button>
                 </div>
               </div>
             )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col md:overflow-hidden min-h-[400px]">
          <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2 uppercase tracking-wide">
            <CheckSquare size={16} /> 1. 子目标列表
          </h2>
          
          <div className="flex-1 md:overflow-y-auto custom-scrollbar space-y-2 pr-1 pb-2">
            {goal.subGoals.map((sg) => {
               const isAssignedToday = sg.assignedDate === todayStr;
               return (
                <div 
                  key={sg.id} 
                  onClick={() => setActiveSubGoalId(sg.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 group
                    ${activeSubGoalId === sg.id 
                      ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200 shadow-sm' 
                      : 'bg-white border-gray-100 hover:border-indigo-100 hover:bg-slate-50'}`}
                >
                  <button
                    onClick={(e) => toggleSubGoalCompletion(sg.id, e)}
                    className={`mt-0.5 shrink-0 ${sg.isCompleted ? 'text-green-500' : 'text-gray-300 hover:text-gray-400'}`}
                  >
                    {sg.isCompleted ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${sg.isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                      {sg.title}
                    </p>
                  </div>

                  <button
                    onClick={(e) => toggleSubGoalToday(sg.id, e)}
                    className={`p-1.5 rounded-lg transition-colors shrink-0
                      ${isAssignedToday 
                        ? 'bg-amber-100 text-amber-600' 
                        : 'text-gray-300 hover:bg-gray-100 hover:text-amber-500'}`}
                    title={isAssignedToday ? "移出今天" : "加入今天"}
                  >
                    {isAssignedToday ? <Sun size={16} fill="currentColor" /> : <Sun size={16} />}
                  </button>

                  {activeSubGoalId === sg.id && <ChevronRight size={16} className="text-indigo-400" />}
                </div>
              );
            })}
            {goal.subGoals.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-xl">
                添加第一个子目标开始
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100">
             <div className="flex gap-2">
              <input
                type="text"
                value={newSubGoal}
                onChange={(e) => setNewSubGoal(e.target.value)}
                onKeyDown={(e) => {
                    if(e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubGoal();
                    }
                }}
                placeholder="在此输入新子目标..."
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 focus:bg-white transition-all"
              />
              <button
                onClick={handleAddSubGoal}
                disabled={!newSubGoal.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg transition-colors font-medium text-sm whitespace-nowrap"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Column 2: Logs */}
      <div className="w-full md:w-1/3 flex flex-col md:h-full shrink-0 bg-white rounded-2xl shadow-sm border border-gray-100 md:overflow-hidden min-h-[400px]">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col gap-1">
          <h2 className="font-bold text-gray-800 flex items-center gap-2 text-sm uppercase tracking-wide">
            <Activity size={16} className="text-indigo-500" /> 2. 具体心流日志
          </h2>
          {activeSubGoal ? (
             <p className="text-xs text-gray-500 truncate">
               当前记录：<span className="font-medium text-indigo-700">{activeSubGoal.title}</span>
             </p>
          ) : (
            <p className="text-xs text-gray-400">未选择子目标</p>
          )}
        </div>

        <div ref={logContainerRef} className="flex-1 p-4 space-y-4 md:overflow-y-auto custom-scrollbar bg-slate-50">
           {!activeSubGoal ? (
             <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <MousePointerClick size={32} className="text-gray-300 mb-2" />
                <p className="text-gray-500 text-sm">请在左侧选择一个子目标</p>
                <p className="text-gray-400 text-xs">以查看或添加该步骤的心流日志</p>
             </div>
           ) : activeSubGoal.logs.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <div className="bg-white p-3 rounded-full mb-3 shadow-sm border border-gray-100">
                  <Activity size={24} className="text-indigo-200" />
                </div>
                <p className="text-gray-500 text-sm">暂无记录</p>
                <p className="text-gray-400 text-xs mt-1">记录这一个步骤中你做了什么、想了什么...</p>
             </div>
           ) : (
             activeSubGoal.logs.map((log) => (
               <div key={log.id} className="relative pl-4 border-l-2 border-indigo-200">
                 <div className="mb-1 flex items-center gap-2">
                   <span className="text-[10px] font-mono text-gray-400 bg-white px-1 border rounded">
                     {new Date(log.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                   </span>
                 </div>
                 <div className="bg-white p-3 rounded-lg shadow-sm text-sm text-gray-700 border border-gray-100">
                   {log.content}
                 </div>
               </div>
             ))
           )}
        </div>

        <div className="p-3 border-t border-gray-100 bg-white">
          <div className="flex gap-2">
            <textarea
              value={logInput}
              onChange={(e) => setLogInput(e.target.value)}
              disabled={!activeSubGoal}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddLog();
                }
              }}
              placeholder={activeSubGoal ? "记录该子步骤的细节..." : "请先选择子目标"}
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-12 disabled:bg-gray-50"
            />
            <button
              onClick={handleAddLog}
              disabled={!logInput.trim() || !activeSubGoal}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Column 3: Export/Review */}
      <div className="w-full md:w-1/3 flex flex-col md:h-full shrink-0 bg-white rounded-2xl shadow-sm border border-gray-100 md:overflow-hidden min-h-[300px]">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h2 className="font-bold text-gray-800 flex items-center gap-2 text-sm uppercase tracking-wide">
            <FileText size={16} className="text-teal-600" /> 3. 导出与复盘
          </h2>
        </div>

        <div className="flex-1 md:overflow-y-auto p-4 custom-scrollbar flex flex-col gap-6">
           <div className="bg-teal-50 rounded-xl p-4 border border-teal-100">
              <h3 className="text-sm font-semibold text-teal-900 mb-2">生成记录文档</h3>
              <p className="text-xs text-teal-700 mb-4 leading-relaxed">
                系统将按“子目标 &gt; 心流日志”的层级结构生成完整文本。您可以复制后发送给外部 AI 工具进行分析。
              </p>
              
              <div className="flex flex-col gap-2">
                <button 
                  onClick={handleCopyRecord}
                  className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all
                    ${copyFeedback 
                      ? 'bg-green-600 text-white shadow-inner' 
                      : 'bg-white text-teal-700 border border-teal-200 hover:bg-teal-100 hover:border-teal-300 shadow-sm'}`}
                >
                  {copyFeedback ? (
                    <span className="flex items-center gap-2 justify-center">已复制！</span>
                  ) : (
                    <span className="flex items-center gap-2 justify-center"><Copy size={16} /> 复制文本</span>
                  )}
                </button>
              </div>
           </div>

           <div className="flex-1 flex flex-col">
             <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-800">复盘总结</h3>
             </div>
             <textarea 
                value={goal.retrospective || ''}
                onChange={(e) => handleUpdateRetrospective(e.target.value)}
                placeholder="您可以手动在此输入复盘内容，或将 AI 生成的建议粘贴到这里..."
                className="flex-1 w-full p-3 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none min-h-[200px]"
             />
           </div>
        </div>
      </div>
    </div>
  );
};