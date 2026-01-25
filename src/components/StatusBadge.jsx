import React from 'react';
import { AlertCircle, Loader2, CheckCircle2, Clock } from 'lucide-react';

/**
 * 任务状态标识组件
 * 统一管理所有状态的展示样式
 */
const StatusBadge = ({ status }) => {
    const configs = {
        PENDING: {
            bg: 'bg-yellow-100',
            text: 'text-yellow-700',
            border: 'border-yellow-300',
            icon: <Clock size={10} />,
            label: '排队中'
        },
        RUNNING: {
            bg: 'bg-blue-100',
            text: 'text-blue-700',
            border: 'border-blue-300',
            icon: <Loader2 size={10} className="animate-spin" />,
            label: '生成中'
        },
        SUCCEEDED: {
            bg: 'bg-emerald-100',
            text: 'text-emerald-700',
            border: 'border-emerald-300',
            icon: <CheckCircle2 size={10} />,
            label: '完成'
        },
        FAILED: {
            bg: 'bg-red-100',
            text: 'text-red-700',
            border: 'border-red-300',
            icon: <AlertCircle size={10} />,
            label: '失败'
        },
        UNKNOWN: {
            bg: 'bg-gray-100',
            text: 'text-gray-700',
            border: 'border-gray-300',
            icon: <AlertCircle size={10} />,
            label: '未知'
        }
    };

    const config = configs[status] || configs.UNKNOWN;

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold border ${config.bg} ${config.text} ${config.border} shadow-sm`}>
            {config.icon}
            {config.label}
        </span>
    );
};

export default StatusBadge;
