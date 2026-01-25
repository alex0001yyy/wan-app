import React, { useState, useEffect } from 'react';
import { Key, ShieldCheck, X, ExternalLink, Download, Upload, Database, Trash2 } from 'lucide-react';
import { exportTasks, importTasks, getStorageStats, clearAllTasks, getExportableMedia, exportAllMedia } from '../utils/storage';

const ApiKeyModal = ({ isOpen, onClose, currentKey, onSave, onTasksImported }) => {
    const [key, setKey] = useState('');
    const [storageStats, setStorageStats] = useState({ taskCount: 0, formattedSize: '0 B' });
    const [mediaCount, setMediaCount] = useState({ videos: 0, images: 0 });
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [exportClearStep, setExportClearStep] = useState(0); // 0: 初始, 1: 第一次确认, 2: 正在导出
    const [exportProgress, setExportProgress] = useState('');

    useEffect(() => {
        if (isOpen) {
            setKey(currentKey || '');
            loadStorageStats();
        }
    }, [isOpen, currentKey]);

    const loadStorageStats = async () => {
        const stats = await getStorageStats();
        setStorageStats(stats);
        
        // 统计媒体文件数量
        const media = await getExportableMedia();
        const videos = media.filter(m => m.type === 'video').length;
        const images = media.filter(m => m.type === 'image').length;
        setMediaCount({ videos, images });
    };

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(key);
        onClose();
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const count = await exportTasks();
            alert(`成功导出 ${count} 个任务`);
        } catch (error) {
            alert('导出失败: ' + error.message);
        } finally {
            setIsExporting(false);
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsImporting(true);
        try {
            const count = await importTasks(file);
            alert(`成功导入 ${count} 个任务`);
            await loadStorageStats();
            onTasksImported && onTasksImported();
        } catch (error) {
            alert('导入失败: ' + error.message);
        } finally {
            setIsImporting(false);
            e.target.value = ''; // 重置文件输入
        }
    };

    const handleClearAll = async () => {
        if (!showClearConfirm) {
            setShowClearConfirm(true);
            setTimeout(() => setShowClearConfirm(false), 3000);
            return;
        }
        
        try {
            await clearAllTasks();
            alert('已清空所有任务历史');
            await loadStorageStats();
            onTasksImported && onTasksImported();
        } catch (error) {
            alert('清空失败: ' + error.message);
        } finally {
            setShowClearConfirm(false);
        }
    };

    // 导出所有媒体并清空存储（两次确认）
    const handleExportAndClear = async () => {
        if (exportClearStep === 0) {
            // 第一次点击：显示第一次确认
            setExportClearStep(1);
            setTimeout(() => {
                if (exportClearStep === 1) setExportClearStep(0);
            }, 5000);
            return;
        }
        
        if (exportClearStep === 1) {
            // 第二次点击：显示第二次确认
            setExportClearStep(2);
            setTimeout(() => {
                if (exportClearStep === 2) setExportClearStep(0);
            }, 5000);
            return;
        }
        
        if (exportClearStep === 2) {
            // 第三次点击：执行操作
            setExportClearStep(3); // 正在执行
            
            try {
                // 1. 先导出所有媒体文件
                setExportProgress('正在导出媒体文件...');
                const mediaResult = await exportAllMedia((current, total, filename) => {
                    setExportProgress(`正在下载 (${current}/${total}): ${filename}`);
                });
                
                // 2. 导出配置文件
                setExportProgress('正在导出配置文件...');
                await exportTasks();
                
                // 3. 清空存储
                setExportProgress('正在清空存储...');
                await clearAllTasks();
                localStorage.removeItem('wan_app_tasks_v2');
                localStorage.removeItem('wan_tasks');
                localStorage.removeItem('wan_idb_migrated');
                
                const message = mediaResult.total > 0
                    ? `导出完成！\n\n媒体文件: ${mediaResult.success} 个成功` + 
                      (mediaResult.failed > 0 ? `, ${mediaResult.failed} 个失败` : '') +
                      `\n配置文件: 已保存\n\n浏览器存储已清空，文件已保存到下载目录`
                    : '导出完成！\n\n没有媒体文件需要导出\n配置文件已保存\n浏览器存储已清空';
                
                alert(message);
                await loadStorageStats();
                onTasksImported && onTasksImported();
            } catch (error) {
                alert('操作失败: ' + error.message);
            } finally {
                setExportClearStep(0);
                setExportProgress('');
            }
        }
    };

    // 获取导出清空按钮的文案
    const getExportClearButtonText = () => {
        switch (exportClearStep) {
            case 1: return '❗ 点击确认第1次';
            case 2: return '❗❗ 点击确认第2次';
            case 3: return exportProgress || '正在处理...';
            default: return '导出全部并清空';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative w-full max-w-lg transform transition-all">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
                    {/* Header */}
                    <div className="px-8 pt-8 pb-6 bg-gradient-to-br from-violet-50 to-purple-50 border-b border-violet-100">
                        <div className="flex items-start justify-between">
                            <div className="flex gap-4">
                                <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg">
                                    <Key className="w-6 h-6 text-white" strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-1">API 配置</h3>
                                    <p className="text-sm text-gray-600">连接到阿里云百炼平台</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-white/50 rounded-xl"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="space-y-3">
                            <label htmlFor="apiKey" className="block text-sm font-semibold text-gray-700">
                                访问密钥 (API Key)
                            </label>
                            <input
                                type="password"
                                id="apiKey"
                                value={key}
                                onChange={(e) => setKey(e.target.value)}
                                placeholder="sk-xxxxxxxxxxxxxxxx"
                                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl 
                         focus:border-violet-400 focus:ring-4 focus:ring-violet-100 focus:bg-white
                         outline-none text-gray-900 placeholder-gray-400 font-mono text-sm
                         transition-all duration-300"
                                autoFocus
                            />
                            <div className="flex items-start gap-3 p-4 bg-violet-50 border border-violet-200 rounded-xl">
                                <ShieldCheck size={18} className="text-violet-600 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-violet-700 leading-relaxed font-medium">
                                    您的密钥仅存储在本地浏览器中，不会上传到任何服务器
                                </p>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!key.trim()}
                            className="w-full h-14 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 
                       text-white font-bold text-lg rounded-2xl shadow-lg shadow-violet-500/30
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
                       transition-all duration-300 flex items-center justify-center gap-3"
                        >
                            <ShieldCheck size={20} />
                            保存配置
                        </button>

                        {/* Storage Management Section */}
                        <div className="pt-6 border-t border-gray-200 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Database size={16} className="text-gray-500" />
                                    <span className="text-sm font-semibold text-gray-700">本地存储管理</span>
                                </div>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                    {storageStats.taskCount} 个任务 · {mediaCount.videos} 视频 · {mediaCount.images} 图片 · {storageStats.formattedSize}
                                </span>
                            </div>

                            {/* 配置文件导入导出 */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-500">配置文件</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Export Config Button */}
                                    <button
                                        type="button"
                                        onClick={handleExport}
                                        disabled={isExporting || storageStats.taskCount === 0}
                                        className="flex items-center justify-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Download size={18} className="text-blue-600" />
                                        <span className="text-xs font-medium text-blue-700">
                                            {isExporting ? '导出中...' : '导出配置文件'}
                                        </span>
                                    </button>

                                    {/* Import Config Button */}
                                    <label className="flex items-center justify-center gap-2 p-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl transition-colors cursor-pointer">
                                        <Upload size={18} className="text-green-600" />
                                        <span className="text-xs font-medium text-green-700">
                                            {isImporting ? '导入中...' : '导入配置文件'}
                                        </span>
                                        <input
                                            type="file"
                                            accept=".json"
                                            onChange={handleImport}
                                            disabled={isImporting}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* 存储清理 */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-500">存储清理</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Export & Clear Button - 两次确认 */}
                                    <button
                                        type="button"
                                        onClick={handleExportAndClear}
                                        disabled={storageStats.taskCount === 0 || exportClearStep === 3}
                                        className={`flex flex-col items-center justify-center gap-1 p-3 border rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                            exportClearStep === 1 
                                                ? 'bg-orange-400 border-orange-400 text-white' 
                                                : exportClearStep === 2
                                                    ? 'bg-red-500 border-red-500 text-white animate-pulse'
                                                    : exportClearStep === 3
                                                        ? 'bg-gray-400 border-gray-400 text-white'
                                                        : 'bg-orange-50 hover:bg-orange-100 border-orange-200'
                                        }`}
                                    >
                                        <Download size={18} className={exportClearStep > 0 ? 'text-white' : 'text-orange-600'} />
                                        <span className={`text-xs font-medium text-center leading-tight ${
                                            exportClearStep > 0 ? 'text-white' : 'text-orange-700'
                                        }`}>
                                            {getExportClearButtonText()}
                                        </span>
                                    </button>

                                    {/* Clear Button */}
                                    <button
                                        type="button"
                                        onClick={handleClearAll}
                                        disabled={storageStats.taskCount === 0}
                                        className={`flex flex-col items-center justify-center gap-1 p-3 border rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                            showClearConfirm 
                                                ? 'bg-red-500 border-red-500 text-white' 
                                                : 'bg-red-50 hover:bg-red-100 border-red-200'
                                        }`}
                                    >
                                        <Trash2 size={18} className={showClearConfirm ? 'text-white' : 'text-red-600'} />
                                        <span className={`text-xs font-medium text-center leading-tight ${
                                            showClearConfirm ? 'text-white' : 'text-red-700'
                                        }`}>
                                            {showClearConfirm ? '点击确认清空' : '仅清空（不导出）'}
                                        </span>
                                    </button>
                                </div>
                                
                                {/* 提示信息 */}
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                    <p className="text-xs text-amber-700 leading-relaxed">
                                        <strong>导出全部并清空</strong>：将下载所有视频和图片到本地，同时导出配置文件，然后清空浏览器存储。<br/>
                                        <span className="text-amber-600">适用于：存储即将满载、更换设备、或需要迁移数据时。执行前需点击两次确认。</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="px-8 py-5 bg-gray-50 border-t border-gray-200">
                        <a
                            href="https://bailian.console.aliyun.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-violet-600 hover:text-violet-700 transition-colors font-semibold inline-flex items-center gap-2"
                        >
                            还没有密钥？前往阿里云控制台获取
                            <ExternalLink size={14} />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApiKeyModal;
