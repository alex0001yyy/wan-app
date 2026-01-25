import React, { useState, useEffect } from 'react';
import { Wand2, Image as ImageIcon, Sparkles, Palette, Monitor, ChevronDown, Type, Settings2, ShieldCheck, Hash, Trash2 } from 'lucide-react';
import { IMAGE_MODELS, RESOLUTION_LABELS, STYLES, MODEL_CATEGORIES } from '../config/models';

// Filter only text-to-image models
const TEXT_TO_IMAGE_MODELS = IMAGE_MODELS.filter(m => m.category === MODEL_CATEGORIES.TEXT_TO_IMAGE);

const ImageGenerator = ({ onGenerate, isGenerating }) => {
    const defaultModel = TEXT_TO_IMAGE_MODELS[0];
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [seed, setSeed] = useState('');
    const [selectedModelId, setSelectedModelId] = useState(defaultModel.id);
    const [resolution, setResolution] = useState(defaultModel.defaultRes);
    const [usePromptExtend, setUsePromptExtend] = useState(true);
    const [numImages, setNumImages] = useState(1);
    const [style, setStyle] = useState('<auto>');
    const [showAdvanced, setShowAdvanced] = useState(false);

    const currentModelConfig = TEXT_TO_IMAGE_MODELS.find(m => m.id === selectedModelId) || defaultModel;

    useEffect(() => {
        if (!currentModelConfig.resolutions.includes(resolution)) {
            setResolution(currentModelConfig.defaultRes);
        }
    }, [selectedModelId]);

    const getEstimatedCost = () => {
        return (currentModelConfig.price * numImages).toFixed(2);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        onGenerate({
            model: selectedModelId,
            input: { prompt: prompt.trim() },
            parameters: {
                size: resolution,
                n: numImages,
                prompt_extend: usePromptExtend,
                negative_prompt: currentModelConfig.capabilities?.negative_prompt ? negativePrompt : undefined,
                seed: currentModelConfig.capabilities?.seed && seed ? parseInt(seed) : undefined,
                style: currentModelConfig.capabilities?.style ? style : undefined
            }
        });
    };

    return (
        <div className="fade-in-up h-full">
            <div className="max-w-full mx-auto h-full p-1">
                <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-6 h-full items-start">

                    {/* Input Section */}
                    <div className="flex-1 flex flex-col gap-4 w-full">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden p-1 relative hover:border-violet-200 transition-all min-h-[400px]">
                            <div className="absolute top-5 left-6 z-10 font-bold text-gray-400 flex items-center gap-2">
                                <Sparkles size={16} className="text-blue-500" />
                                画面描述 (Prompt)
                            </div>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder={currentModelConfig.family === 'qwen'
                                    ? "输入文本设计要求，例如：一张‘阿里云’字样的极氪风格海报..."
                                    : "输入写实场景描述，建议包含主体、场景、光影、镜头等细节..."}
                                className="w-full h-full min-h-[340px] px-6 pt-16 pb-12 bg-transparent outline-none text-gray-900 text-xl leading-relaxed placeholder-gray-200 resize-none font-medium"
                            />

                            {/* Toolbar */}
                            <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between border-t border-gray-50 pt-3">
                                <div className="flex items-center gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowAdvanced(!showAdvanced)}
                                        className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${showAdvanced ? 'text-violet-600' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        <Settings2 size={14} />
                                        高级参数 {showAdvanced ? '已开启' : ''}
                                    </button>
                                </div>
                                <span className="text-[10px] font-mono text-gray-300 uppercase tracking-widest">{prompt.length} / 2000</span>
                            </div>
                        </div>

                        {/* Advanced Panel */}
                        {showAdvanced && (
                            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-violet-100 p-6 flex flex-col gap-6 animate-in slide-in-from-top-2 duration-300">
                                {currentModelConfig.capabilities?.negative_prompt && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider flex items-center gap-2">
                                            <ShieldCheck size={14} className="text-red-400" />
                                            反向提示词 (Negative Prompt)
                                        </label>
                                        <textarea
                                            value={negativePrompt}
                                            onChange={(e) => setNegativePrompt(e.target.value)}
                                            placeholder="不希望在画中出现的内容，如：模糊、畸形、文字扭曲等"
                                            className="w-full h-20 bg-white/50 border border-gray-100 rounded-xl p-3 outline-none text-sm text-gray-700 placeholder-gray-300 focus:border-violet-300 transition-all font-medium"
                                        />
                                    </div>
                                )}

                                {currentModelConfig.capabilities?.seed && (
                                    <div className="w-full sm:w-1/2">
                                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider flex items-center gap-2">
                                            <Hash size={14} className="text-blue-400" />
                                            随机种子 (Seed)
                                        </label>
                                        <input
                                            type="number"
                                            value={seed}
                                            onChange={(e) => setSeed(e.target.value)}
                                            placeholder="固定种子以保持一致性"
                                            className="w-full bg-white/50 border border-gray-100 rounded-xl px-4 py-2.5 outline-none text-sm text-gray-700 placeholder-gray-300 focus:border-violet-300 transition-all font-mono"
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Controls */}
                    <div className="w-full lg:w-[360px] flex flex-col gap-4">
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-6">

                            {/* Model Selector */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest flex items-center gap-2">
                                    <Palette size={14} className="text-violet-500" /> 模型内核
                                </label>
                                <div className="relative group">
                                    <select
                                        value={selectedModelId}
                                        onChange={(e) => setSelectedModelId(e.target.value)}
                                        className="w-full appearance-none bg-gray-50 border border-gray-100 px-4 py-4 rounded-2xl text-sm font-bold text-gray-900 outline-none group-hover:bg-gray-100 transition-all cursor-pointer border-l-4 border-l-violet-500"
                                    >
                                        {TEXT_TO_IMAGE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </select>
                                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none group-hover:text-violet-500 transition-colors" />
                                </div>
                                <p className="mt-2 text-[10px] text-gray-400 px-1 leading-relaxed">{currentModelConfig.desc}</p>
                            </div>

                            {/* Art Style */}
                            {currentModelConfig.capabilities?.style && (
                                <div className="animate-in fade-in slide-in-from-right-2">
                                    <label className="block text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest flex items-center gap-2">
                                        <Palette size={14} className="text-orange-400" /> 艺术风格
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <select
                                            value={style}
                                            onChange={(e) => setStyle(e.target.value)}
                                            className="col-span-2 appearance-none bg-gray-50 border border-gray-100 px-4 py-4 rounded-2xl text-sm font-bold text-gray-900 outline-none hover:bg-gray-100 transition-all"
                                        >
                                            {STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Resolution */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest flex items-center gap-2">
                                    <Monitor size={14} className="text-blue-500" /> 全球画幅
                                </label>
                                <div className="relative group">
                                    <select
                                        value={resolution}
                                        onChange={(e) => setResolution(e.target.value)}
                                        className="w-full appearance-none bg-gray-50 border border-gray-100 px-4 py-4 rounded-2xl text-sm font-bold text-gray-900 outline-none group-hover:bg-gray-100 transition-all cursor-pointer"
                                    >
                                        {currentModelConfig.resolutions.map(res => (
                                            <option key={res} value={res}>{RESOLUTION_LABELS[res] || res}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                                </div>
                            </div>

                            <div className="h-px bg-gray-50" />

                            {/* Settings Row */}
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-gray-700">智能改写 (AI Extend)</span>
                                        <span className="text-[10px] text-gray-400">自动补全丰富细节</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setUsePromptExtend(!usePromptExtend)}
                                        className={`w-11 h-6 rounded-full relative transition-colors ${usePromptExtend ? 'bg-violet-600' : 'bg-gray-200'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${usePromptExtend ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-700">生成张数</span>
                                    <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100 gap-1">
                                        {[1, 2, 4].map(n => (
                                            <button
                                                key={n}
                                                type="button"
                                                onClick={() => setNumImages(n)}
                                                className={`w-10 h-8 text-xs font-bold rounded-lg transition-all ${numImages === n ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-400'}`}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isGenerating || !prompt.trim()}
                                className="w-full h-16 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-3xl shadow-xl shadow-violet-200 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all group"
                            >
                                {isGenerating ? (
                                    <div className="animate-spin h-5 w-5 border-2 border-white/20 border-t-white rounded-full" />
                                ) : (
                                    <>
                                        <Wand2 size={20} className="group-hover:rotate-12 transition-transform" />
                                        <span className="text-lg">立即生成</span>
                                    </>
                                )}
                            </button>
                            <div className="text-center mt-4">
                                <span className="text-[11px] text-gray-400 font-medium">
                                    预计消耗 <span className="font-bold text-gray-600">¥ {getEstimatedCost()}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ImageGenerator;
