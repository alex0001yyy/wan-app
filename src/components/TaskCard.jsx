import React, { useState, useEffect, memo } from 'react';
import { Download, AlertCircle, Loader2, Play, Maximize2, Trash2, RotateCcw, Copy, Check, Clock, CheckCircle2, Images } from 'lucide-react';
import StatusBadge from './StatusBadge';

/**
 * 任务卡片组件
 * 展示单个任务的预览、状态和操作
 */
// 解析URL中的过期时间
const parseUrlExpireTime = (url) => {
    if (!url) return null;
    try {
        const urlObj = new URL(url);
        const expires = urlObj.searchParams.get('Expires');
        if (expires) {
            return parseInt(expires) * 1000; // 转换为毫秒
        }
    } catch (e) {
        // 解析失败
    }
    return null;
};

// 格式化剩余时间（简短格式）
const formatRemainingTime = (ms) => {
    if (ms <= 0) return '已过期';
    
    const hours = Math.floor(ms / (1000 * 60 * 60));
    
    if (hours >= 24) {
        const days = Math.floor(hours / 24);
        return `${days}d`;
    } else if (hours > 0) {
        return `${hours}h`;
    } else {
        return '<1h';
    }
};

const TaskCard = ({ task, index, onView, onDelete, onRetry, onUpdate }) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [copied, setCopied] = useState(false);
    const [remainingTime, setRemainingTime] = useState(null);
    const [isExpired, setIsExpired] = useState(false);

    // 计算并更新URL有效期
    useEffect(() => {
        const mediaUrl = task.videoUrl || task.imgUrl;
        const expireTime = parseUrlExpireTime(mediaUrl);
        
        if (!expireTime) {
            setRemainingTime(null);
            return;
        }

        const updateRemaining = () => {
            const now = Date.now();
            const remaining = expireTime - now;
            setRemainingTime(remaining);
            setIsExpired(remaining <= 0);
        };

        updateRemaining();
        // 每分钟更新一次
        const timer = setInterval(updateRemaining, 60000);
        
        return () => clearInterval(timer);
    }, [task.videoUrl, task.imgUrl]);

    // 复制提示词
    const handleCopyPrompt = async (e) => {
        e.stopPropagation();
        if (!task.prompt) return;
        try {
            await navigator.clipboard.writeText(task.prompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('复制失败:', err);
        }
    };
    const hasMedia = task.videoUrl || task.imgUrl;
    // 对于失败的任务，总是显示重试按钮（即使没有originalParams）
    // 对于成功的任务，只有当有originalParams时才显示重试按钮
    const canRetry = task.status === 'FAILED' || (task.originalParams && task.status === 'SUCCEEDED');

    const handleDelete = (e) => {
        e.stopPropagation();
        if (showDeleteConfirm) {
            onDelete(task.taskId);
        } else {
            setShowDeleteConfirm(true);
            // 3秒后自动取消确认状态
            setTimeout(() => setShowDeleteConfirm(false), 3000);
        }
    };

    const handleRetry = (e) => {
        e.stopPropagation();
        if (!task.originalParams) {
            // 如果没有原始参数，提示用户这是旧任务
            alert('这是一个旧任务，没有保存原始参数。请删除后重新生成。');
            return;
        }
        onRetry && onRetry(task);
    };

    return (
        <div
            className="group fade-in-up"
            style={{ animationDelay: `${0.05 * (index + 1)}s` }}
        >
            <div className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-violet-300 hover:shadow-lg transition-all duration-300 group-hover:scale-[1.01] flex flex-col h-full">
                {/* Media Preview */}
                <div
                    className="aspect-video relative bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center overflow-hidden cursor-pointer"
                    onClick={() => hasMedia && onView(task)}
                >
                    {task.videoUrl ? (
                        <>
                            <video
                                src={task.videoUrl}
                                className="w-full h-full object-cover"
                                poster={task.posterUrl || ''}
                                controls={false}
                                autoPlay={false}
                                muted
                                playsInline
                            />
                            {/* Play Icon Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors pointer-events-none">
                                <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg backdrop-blur text-violet-600 scale-90 group-hover:scale-100 transition-transform">
                                    <Play size={24} fill="currentColor" />
                                </div>
                            </div>
                        </>
                    ) : task.imgUrl ? (
                        <>
                            <img
                                src={task.imgUrl}
                                alt={task.prompt}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                            {/* 多图数量角标 */}
                            {task.imgUrls && task.imgUrls.length > 1 && (
                                <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-black/60 text-white backdrop-blur-sm">
                                    <Images size={12} />
                                    <span>{task.imgUrls.length}张</span>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400 p-4 text-center cursor-default" onClick={(e) => e.stopPropagation()}>
                            {task.status === 'FAILED' ? (
                                <>
                                    <AlertCircle size={40} className="text-red-400 mb-3" />
                                    <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full">生成失败</span>
                                </>
                            ) : (
                                <>
                                    <div className="relative mb-3">
                                        <div className="absolute inset-0 bg-violet-400/20 blur-lg rounded-full animate-pulse"></div>
                                        <Loader2 size={40} className="text-violet-500 animate-spin relative z-10" />
                                    </div>
                                    <span className="text-xs font-bold text-violet-600 mb-2">
                                        {task.status === 'PENDING' ? '排队中...' : '正在生成...'}
                                    </span>
                                    <div className="w-24 h-1 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-violet-500 animate-shimmer"></div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-2 left-2 z-10 pointers-events-none">
                        <StatusBadge status={task.status} />
                    </div>

                    {/* URL有效期 / 已下载状态 - 右上角 */}
                    {task.status === 'SUCCEEDED' && (
                        task.downloaded ? (
                            <div className="absolute top-2 right-2 z-10 flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-green-500/90 text-white backdrop-blur-sm shadow-sm">
                                <CheckCircle2 size={12} />
                                <span>已下载</span>
                            </div>
                        ) : remainingTime !== null && (
                            <div className={`absolute top-2 right-2 z-10 flex items-center gap-1 text-xs px-2 py-1 rounded-lg backdrop-blur-sm shadow-sm ${
                                isExpired 
                                    ? 'bg-red-500/90 text-white' 
                                    : remainingTime < 3600000 
                                        ? 'bg-orange-500/90 text-white' 
                                        : remainingTime < 86400000 
                                            ? 'bg-amber-500/90 text-white'
                                            : 'bg-black/50 text-white'
                            }`}>
                                <Clock size={12} />
                                <span>{formatRemainingTime(remainingTime)}</span>
                            </div>
                        )
                    )}

                    {/* Action Buttons (Top Right) - Horizontal */}
                    <div className="absolute top-9 right-2 flex flex-row gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        {/* 复制提示词按钮 */}
                        {task.prompt && (
                            <button
                                className={`p-1.5 rounded-lg shadow-md backdrop-blur-sm transition-all ${
                                    copied 
                                        ? 'bg-green-500 text-white' 
                                        : 'bg-white/95 hover:bg-white text-gray-700 hover:text-violet-600'
                                }`}
                                title={copied ? '已复制!' : '复制提示词'}
                                onClick={handleCopyPrompt}
                            >
                                {copied ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                        )}

                        {canRetry && (
                            <button
                                className="p-1.5 bg-white/95 hover:bg-white text-gray-700 hover:text-blue-600 rounded-lg shadow-md backdrop-blur-sm transition-colors"
                                title="重试"
                                onClick={handleRetry}
                            >
                                <RotateCcw size={14} />
                            </button>
                        )}
                        
                        {hasMedia && (
                            <>
                                <button
                                    className="p-1.5 bg-white/95 hover:bg-white text-gray-700 hover:text-violet-600 rounded-lg shadow-md backdrop-blur-sm transition-colors"
                                    title="全屏预览"
                                    onClick={(e) => { e.stopPropagation(); onView(task); }}
                                >
                                    <Maximize2 size={14} />
                                </button>

                                <a
                                    href={task.videoUrl || task.imgUrl}
                                    download
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 bg-white/95 hover:bg-white text-gray-700 hover:text-violet-600 rounded-lg shadow-md backdrop-blur-sm transition-colors"
                                    title="下载"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // 点击下载后标记为已下载
                                        onUpdate && onUpdate(task.taskId, { downloaded: true });
                                    }}
                                >
                                    <Download size={14} />
                                </a>
                            </>
                        )}
                        
                        {/* Delete Button */}
                        <button
                            className={`p-1.5 rounded-lg shadow-md backdrop-blur-sm transition-all ${
                                showDeleteConfirm 
                                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                                    : 'bg-white/95 hover:bg-white text-gray-700 hover:text-red-500'
                            }`}
                            title={showDeleteConfirm ? '确认删除？' : '删除'}
                            onClick={handleDelete}
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>

                {/* Card Footer */}
                <div className="p-3 bg-white flex-1 flex flex-col justify-between">
                    <p className="text-xs text-gray-700 line-clamp-2 leading-relaxed mb-2 font-medium" title={task.prompt}>
                        {task.description === '图像扩展任务' ? '图像扩展: ' + task.prompt : task.prompt}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-50">
                        <span className="font-mono bg-gray-50 px-1.5 py-0.5 rounded text-gray-500">
                            {task.model?.split('-')[0] || 'WAN'}
                        </span>
                        <span>
                            {new Date(task.createdAt).toLocaleString('zh-CN', {
                                month: 'numeric',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default memo(TaskCard);
