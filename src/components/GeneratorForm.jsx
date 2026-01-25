import React, { useState, useEffect } from 'react';
import { Wand2, Sparkles, Sliders, Monitor, Smartphone, Video } from 'lucide-react';

const GeneratorForm = ({ onGenerate, isGenerating }) => {
    const [prompt, setPrompt] = useState('');

    // Default to the recommended model
    const [model, setModel] = useState('wan2.5-t2v-preview');

    // Default resolution
    const [resolution, setResolution] = useState('1280*720');

    // Model Definitions from Documentation
    const models = [
        {
            id: 'wan2.6-t2v',
            name: 'Wan 2.6 (推荐)',
            desc: '有声/多镜头/720P/1080P/最长15s',
            resolutions: ['1280*720', '720*1280', '1920*1080', '1080*1920'],
            defaultRes: '1920*1080'
        },
        {
            id: 'wan2.5-t2v-preview',
            name: 'Wan 2.5 Preview',
            desc: '有声/480P/720P/1080P/最长10s',
            resolutions: ['832*480', '480*832', '1280*720', '720*1280', '1920*1080', '1080*1920'],
            defaultRes: '1920*1080'
        },
        {
            id: 'wanx2.1-t2v-turbo',
            name: 'Wanx 2.1 Turbo',
            desc: '极速/无声/480P/720P/5s',
            resolutions: ['832*480', '480*832', '1280*720', '720*1280'],
            defaultRes: '1280*720'
        },
        {
            id: 'wanx2.1-t2v-plus',
            name: 'Wanx 2.1 Plus',
            desc: '专业/无声/720P/5s',
            resolutions: ['1280*720', '720*1280'],
            defaultRes: '1280*720'
        },
    ];

    // Resolution Options Config
    const resolutionConfig = {
        '1280*720': { label: '720P 横屏', icon: <Monitor size={14} /> },
        '720*1280': { label: '720P 竖屏', icon: <Smartphone size={14} /> },
        '1920*1080': { label: '1080P 横屏', icon: <Monitor size={14} className="text-blue-500" /> },
        '1080*1920': { label: '1080P 竖屏', icon: <Smartphone size={14} className="text-blue-500" /> },
        '832*480': { label: '480P 横屏', icon: <Monitor size={14} className="opacity-70" /> },
        '480*832': { label: '480P 竖屏', icon: <Smartphone size={14} className="opacity-70" /> },
    };

    // Update resolution when model changes if current resolution is not supported
    useEffect(() => {
        const currentModelObj = models.find(m => m.id === model);
        if (currentModelObj && !currentModelObj.resolutions.includes(resolution)) {
            setResolution(currentModelObj.defaultRes);
        }
    }, [model]);

    // Get available resolutions for current model
    const currentResolutions = models.find(m => m.id === model)?.resolutions || [];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        onGenerate({
            model,
            input: { prompt: prompt.trim() },
            parameters: {
                size: resolution,
                n: 1
                // Note: duration defaults might need to be handled if user wants to change them, 
                // but keeping it simple for now based on model defaults.
            }
        });
    };

    return (
        <div className="fade-in-up">
            <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <form onSubmit={handleSubmit} className="p-0">
                    <div className="flex flex-col">

                        {/* Top Section: Prompt Input */}
                        <div className="relative group p-6 pb-2 bg-gradient-to-b from-white to-gray-50/30">
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
                                <Sparkles size={16} className="text-violet-500" />
                                创意描述
                            </label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="在此输入您的创意描述... 例如：一只可爱的小猫在阳光下的草地上奔跑，电影级光效，虚幻引擎渲染..."
                                className="w-full h-32 px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl 
                         focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-50/50 
                         outline-none text-gray-900 text-lg leading-relaxed placeholder-gray-400
                         resize-none transition-all duration-300 font-medium shadow-inner"
                            />
                            <div className="text-right mt-2 mr-2 flex justify-end items-center gap-4">
                                <span className={`text-xs font-mono px-2 py-0.5 rounded-full transition-colors ${prompt.length > 0 ? 'bg-violet-100 text-violet-600' : 'bg-gray-100 text-gray-400'}`}>
                                    {prompt.length} 字符
                                </span>
                            </div>
                        </div>

                        {/* Bottom Section: Controls Bar */}
                        <div className="px-6 py-5 bg-gray-50/80 border-t border-gray-100">
                            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">

                                {/* Controls Group */}
                                <div className="flex flex-col md:flex-row gap-6 w-full xl:w-auto">

                                    {/* Model Selector */}
                                    <div className="flex flex-col gap-2">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <Video size={12} />
                                            模型版本
                                        </span>
                                        <div className="flex flex-wrap gap-2">
                                            {models.map(m => (
                                                <button
                                                    key={m.id}
                                                    type="button"
                                                    onClick={() => setModel(m.id)}
                                                    className={`px-3 py-2 text-xs font-bold rounded-xl transition-all border text-left min-w-[140px] ${model === m.id
                                                            ? 'bg-violet-100 border-violet-300 text-violet-800 shadow-sm'
                                                            : 'bg-white border-gray-200 text-gray-600 hover:border-violet-200 hover:bg-white'
                                                        }`}
                                                >
                                                    <div className="text-sm mb-0.5">{m.name}</div>
                                                    <div className={`text-[10px] scale-95 origin-left ${model === m.id ? 'text-violet-600/80' : 'text-gray-400'}`}>
                                                        {m.desc}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Resolution Selector */}
                                    <div className="flex flex-col gap-2">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <Monitor size={12} />
                                            画面比例
                                        </span>
                                        <div className="flex flex-wrap gap-2">
                                            {currentResolutions.map(res => {
                                                const config = resolutionConfig[res] || { label: res, icon: <Monitor size={14} /> };
                                                return (
                                                    <button
                                                        key={res}
                                                        type="button"
                                                        onClick={() => setResolution(res)}
                                                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all shadow-sm ${resolution === res
                                                                ? 'bg-white border-violet-500 text-violet-700 ring-1 ring-violet-100'
                                                                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                                                            }`}
                                                    >
                                                        {config.icon}
                                                        {config.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Generate Button */}
                                <div className="w-full xl:w-auto mt-2 xl:mt-0">
                                    <button
                                        type="submit"
                                        disabled={isGenerating || !prompt.trim()}
                                        className="w-full xl:w-48 h-14 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500
                             text-white font-bold text-lg rounded-2xl shadow-lg shadow-violet-500/20 
                             disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
                             transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center gap-2 group"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span className="text-base">生成中...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Wand2 size={20} fill="currentColor" className="text-white/20 group-hover:rotate-12 transition-transform" />
                                                立即生成
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </form>
            </div>
        </div>
    );
};

export default GeneratorForm;
