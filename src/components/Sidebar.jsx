import React, { useState } from 'react';
import {
    Video, Image as ImageIcon, User, ShoppingBag,
    ChevronDown, ChevronRight, Wand2, Film, Scissors,
    Palette, Expand, Type, Music, Smile, Shirt,
    Settings, Key, ExternalLink, Menu, Eraser, Maximize,
    PenTool, SmilePlus
} from 'lucide-react';

const Sidebar = ({ activeMenu, onSelectMenu, className = '' }) => {
    // Navigation Configuration
    const navConfig = [
        {
            title: '视频创作中心',
            icon: <Video size={20} />,
            id: 'video-studio',
            items: [
                { id: 'video-t2v', label: '文生视频', icon: <Wand2 size={16} /> },
                { id: 'video-i2v', label: '图生视频', icon: <Film size={16} /> },
                { id: 'video-r2v', label: '参考生视频', icon: <Video size={16} /> },
                { id: 'video-edit', label: '视频编辑', icon: <Scissors size={16} /> },
            ]
        },
        {
            title: '图像创作中心',
            icon: <ImageIcon size={20} />,
            id: 'image-studio',
            items: [
                { id: 'image-t2i', label: '文生图', icon: <Palette size={16} /> },
                { id: 'image-edit', label: '图像指令编辑', icon: <Wand2 size={16} /> },
                { id: 'image-stylization', label: '图像风格迁移', icon: <Palette size={16} /> },
                { id: 'image-inpainting', label: '图像修复重绘', icon: <Eraser size={16} /> },
                { id: 'image-enhancement', label: '图像增强', icon: <Maximize size={16} /> },
                { id: 'sketch-to-image', label: '草图生图', icon: <PenTool size={16} /> },
                { id: 'cartoon-generator', label: '卡通形象生成', icon: <Smile size={16} /> },
                { id: 'mk-bg-gen', label: '背景生成', icon: <ImageIcon size={16} /> },
                { id: 'image-translation', label: '图像翻译', icon: <Type size={16} /> },
                { id: 'image-creative', label: '创意文字/海报', icon: <Type size={16} /> },
            ]
        },
        {
            title: '数字人与动效',
            icon: <User size={20} />,
            id: 'digital-human',
            items: [
                { id: 'dh-talking', label: '数字人/说话', icon: <Music size={16} /> },
                { id: 'dh-motion', label: '动作生成', icon: <User size={16} /> },
                { id: 'dh-emoji', label: '表情包/风格', icon: <Smile size={16} /> },
                { id: 'video-swap', label: '视频换人', icon: <User size={16} /> },
            ]
        },
        {
            title: '电商应用',
            icon: <ShoppingBag size={20} />,
            id: 'ecommerce',
            items: [
                { id: 'ec-tryon', label: 'AI 试衣', icon: <Shirt size={16} /> },
            ]
        }
    ];

    // Helper to check if a group contains the active item
    const isGroupActive = (items) => items.some(i => i.id === activeMenu);

    // Expanded state for groups (auto-expand active group)
    const [expandedGroups, setExpandedGroups] = useState(() => {
        const activeGroup = navConfig.find(g => isGroupActive(g.items));
        return activeGroup ? [activeGroup.id] : ['video-studio'];
    });

    const toggleGroup = (groupId) => {
        setExpandedGroups(prev =>
            prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
        );
    };

    return (
        <div className={`flex flex-col h-full bg-white border-r border-gray-100 ${className}`}>
            {/* Header / Logo */}
            <div className="h-16 flex items-center px-6 border-b border-gray-50">
                <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md mr-3 text-white">
                    <Wand2 size={18} fill="currentColor" className="text-white/20" />
                </div>
                <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700">
                    通义万相
                </span>
            </div>

            {/* Navigation List */}
            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-2 scrollbar-thin scrollbar-thumb-gray-200">
                {navConfig.map(group => {
                    const isExpanded = expandedGroups.includes(group.id);
                    const isActive = isGroupActive(group.items);

                    return (
                        <div key={group.id} className="mb-2">
                            <button
                                onClick={() => toggleGroup(group.id)}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${isActive ? 'text-violet-700 bg-violet-50' : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    {group.icon}
                                    <span>{group.title}</span>
                                </div>
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>

                            {/* Sub-menu */}
                            {isExpanded && (
                                <div className="mt-1 ml-4 pl-3 border-l-2 border-gray-100 space-y-1">
                                    {group.items.map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => onSelectMenu(item.id)}
                                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${activeMenu === item.id
                                                    ? 'bg-violet-100 text-violet-700'
                                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                                }`}
                                        >
                                            {item.icon}
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer / Profile */}
            <div className="p-4 border-t border-gray-50 bg-gray-50/50">
                <div className="flex items-center gap-3 px-2 py-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-200 to-blue-200 flex items-center justify-center text-xs font-bold text-violet-700">
                        U
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-gray-900 truncate">用户的工作台</div>
                        <div className="text-[10px] text-gray-500 truncate">阿里云 DashScope</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
