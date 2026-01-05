import React, { useRef, useState } from 'react';
import { Goal } from '../types';
import { Download, Upload, AlertTriangle, Database, CheckCircle2, Trash2 } from 'lucide-react';

interface Props {
  goals: Goal[];
  onImport: (goals: Goal[]) => void;
  onClearAll: () => void;
}

export const SettingsView: React.FC<Props> = ({ goals, onImport, onClearAll }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(goals, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orbit_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        const parsed = JSON.parse(result);
        
        // Basic validation check
        if (!Array.isArray(parsed)) throw new Error("Format invalid");
        
        if (window.confirm(`检测到备份文件中包含 ${parsed.length} 个目标。\n\n警告：恢复备份将覆盖当前的 ${goals.length} 个目标。\n确定要继续吗？`)) {
          onImport(parsed);
          setImportStatus('success');
          setTimeout(() => setImportStatus('idle'), 3000);
        }
      } catch (err) {
        console.error(err);
        setImportStatus('error');
        alert('文件格式错误：请确保上传的是 Orbit 生成的 .json 备份文件。');
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    if (window.confirm('高危操作：确定要清空所有数据吗？此操作无法撤销！')) {
       if (window.confirm('再次确认：这会删除本地所有目标和记录。')) {
         onClearAll();
       }
    }
  };

  const totalLogs = goals.reduce((acc, g) => acc + g.subGoals.reduce((sAcc, s) => sAcc + s.logs.length, 0), 0);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">设置与数据</h1>
      <p className="text-gray-500 mb-8">管理您的本地数据，确保数据安全。</p>

      <div className="space-y-6">
        
        {/* Status Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
              <Database size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">本地存储状态</h3>
              <p className="text-sm text-gray-500 mt-1">
                当前共有 <span className="font-bold text-indigo-600">{goals.length}</span> 个目标，
                <span className="font-bold text-indigo-600">{totalLogs}</span> 条心流日志。
              </p>
            </div>
          </div>
          <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
            运行中
          </div>
        </div>

        {/* Backup & Restore */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-bold text-gray-800">数据备份与恢复</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">1. 导出备份 (JSON)</h4>
                <p className="text-sm text-gray-500 leading-relaxed">
                  下载包含所有目标、子任务和心流日志的完整数据文件。建议每周导出并保存到云盘（如 iCloud/Google Drive）中。
                </p>
                <button 
                  onClick={handleExportJSON}
                  className="mt-3 flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Download size={16} /> 下载备份文件
                </button>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6 flex items-start gap-4">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">2. 恢复数据</h4>
                <p className="text-sm text-gray-500 leading-relaxed">
                  使用之前导出的 .json 文件恢复数据。注意：这将<span className="text-red-500 font-bold">覆盖</span>当前设备上的所有数据。
                </p>
                
                <input 
                  type="file" 
                  accept=".json" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  <Upload size={16} /> 上传备份文件恢复
                </button>

                {importStatus === 'success' && (
                  <div className="mt-2 flex items-center gap-2 text-green-600 text-sm animate-fade-in">
                    <CheckCircle2 size={16} /> 数据恢复成功！
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 rounded-2xl border border-red-100 p-6 mt-8">
           <h3 className="font-bold text-red-800 flex items-center gap-2 mb-2">
             <AlertTriangle size={18} /> 危险区域
           </h3>
           <p className="text-sm text-red-600/80 mb-4">
             清空所有本地数据。此操作不可逆，请务必先备份。
           </p>
           <button 
             onClick={handleClearData}
             className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
           >
             <Trash2 size={16} /> 清空所有数据
           </button>
        </div>

      </div>
    </div>
  );
};