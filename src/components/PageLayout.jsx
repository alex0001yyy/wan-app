import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import HistoryGallery from './HistoryGallery';

/**
 * 统一的页面布局组件
 * 优化版：支持历史记录折叠，固定生成表单在顶部
 */
const PageLayout = ({ 
    title, 
    description, 
    tasks, 
    filterType, 
    generator: GeneratorComponent, 
    onGenerate, 
    onDelete,
    onRetry,
    onUpdate,
    apiKey,  // 添加 apiKey 参数
    docUrl  // 文档链接
}) => {
    const [historyCollapsed, setHistoryCollapsed] = useState(false);
    
    // 使用 useMemo 缓存过滤后的任务，避免每次都重新计算
    const filteredTasks = useMemo(
        () => tasks.filter(t => t.type === filterType),
        [tasks, filterType]
    );
    
    return (
        <div className="flex flex-col gap-4">
            {/* Page Header */}
            <div className="bg-white/60 backdrop-blur-sm border-b border-gray-100 pb-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                    {docUrl && (
                        <a
                            href={docUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            <ExternalLink size={14} />
                            <span>参考文档</span>
                        </a>
                    )}
                </div>
                <p className="text-xs text-gray-500 mt-1">{description}</p>
            </div>

            {/* Generator Form - Fixed Top Priority */}
            <div className="bg-white/80 backdrop-blur rounded-xl border border-gray-100 shadow-sm">
                <GeneratorComponent 
                    onGenerate={(params) => onGenerate(params, filterType)} 
                    apiKey={apiKey}
                />
            </div>

            {/* History Gallery - Collapsible */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-100 overflow-hidden">
                <button
                    onClick={() => setHistoryCollapsed(!historyCollapsed)}
                    className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                >
                    <div className="flex items-center gap-2.5">
                        <div className="w-1 h-5 bg-violet-500 rounded-full"></div>
                        <div className="text-left">
                            <h3 className="text-base font-bold text-gray-900">生成历史</h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {filteredTasks.length > 0 ? `共 ${filteredTasks.length} 个作品，最新优先` : '暂无记录'}
                            </p>
                        </div>
                    </div>
                    {historyCollapsed ? 
                        <ChevronDown size={20} className="text-gray-400" /> : 
                        <ChevronUp size={20} className="text-gray-400" />
                    }
                </button>
                
                {!historyCollapsed && (
                    <div className="px-5 pb-5">
                        <HistoryGallery tasks={filteredTasks} onDelete={onDelete} onRetry={onRetry} onUpdate={onUpdate} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default PageLayout;
