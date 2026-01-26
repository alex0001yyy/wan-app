import React, { useState, useEffect } from 'react';
import { Wand2, Image as ImageIcon, Sparkles, Palette, Monitor, ChevronDown, Type, Settings2, ShieldCheck, Hash, Trash2 } from 'lucide-react';
import { IMAGE_MODELS, RESOLUTION_LABELS, STYLES, MODEL_CATEGORIES } from '../config/models';

// Filter only text-to-image models
const TEXT_TO_IMAGE_MODELS = IMAGE_MODELS.filter(m => m.category === MODEL_CATEGORIES.TEXT_TO_IMAGE);

const ImageGenerator = ({ onGenerate, isGenerating }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
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
        // 如果模型不支持批量生成，重置为1
        if (!currentModelConfig.capabilities?.n) {
            setNumImages(1);
        }
    }, [selectedModelId]);

    const getEstimatedCost = () => {
        return (currentModelConfig.price * numImages).toFixed(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        setIsSubmitting(true);
        try {
            await onGenerate({
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
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* 提示词输入 */}
                <div className="relative">
                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 mb-2">
                        <Sparkles size={14} className="text-violet-500" />
                        画面描述 (Prompt)
                    </label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={currentModelConfig.family === 'qwen'
                            ? "输入文本设计要求，例如：一张'阿里云'字样的极氪风格海报..."
                            : "输入写实场景描述，建议包含主体、场景、光影、镜头等细节..."}
                        className="w-full min-h-[120px] bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all resize-none"
                        required
                    />
                    <span className="absolute bottom-3 right-4 text-xs text-gray-400">{prompt.length} / 2000</span>
                </div>
    
                {/* 模型参数行 */}
                <div className="grid grid-cols-3 gap-3">
                    {/* 模型选择 */}
                    <div className="relative">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-2">
                            <Palette size={14} className="text-violet-500" />
                            模型内核
                        </label>
                        <div className="relative">
                            <select
                                value={selectedModelId}
                                onChange={(e) => setSelectedModelId(e.target.value)}
                                className="w-full appearance-none bg-gradient-to-br from-white to-gray-50 border border-gray-200 pl-3 pr-10 py-3 rounded-xl text-sm text-gray-900 font-medium outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all cursor-pointer"
                            >
                                {TEXT_TO_IMAGE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
    
                    {/* 画幅/风格（动态显示） */}
                    {currentModelConfig.capabilities?.style ? (
                        <div className="relative">
                            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-2">
                                <Palette size={14} className="text-orange-500" />
                                艺术风格
                            </label>
                            <div className="relative">
                                <select
                                    value={style}
                                    onChange={(e) => setStyle(e.target.value)}
                                    className="w-full appearance-none bg-gradient-to-br from-white to-gray-50 border border-gray-200 pl-3 pr-10 py-3 rounded-xl text-sm text-gray-900 font-medium outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all cursor-pointer"
                                >
                                    {STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    ) : (
                        <div className="relative">
                            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-2">
                                <Monitor size={14} className="text-blue-500" />
                                画幅比例
                            </label>
                            <div className="relative">
                                <select
                                    value={resolution}
                                    onChange={(e) => setResolution(e.target.value)}
                                    className="w-full appearance-none bg-gradient-to-br from-white to-gray-50 border border-gray-200 pl-3 pr-10 py-3 rounded-xl text-sm text-gray-900 font-medium outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all cursor-pointer"
                                >
                                    {currentModelConfig.resolutions.map(res => (
                                        <option key={res} value={res}>{RESOLUTION_LABELS[res] || res}</option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    )}
    
                    {/* 生成张数 - 只有支持n参数的模型才显示选择器 */}
                    <div className="relative">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-2">
                            <ImageIcon size={14} className="text-green-500" />
                            生成张数
                        </label>
                        {currentModelConfig.capabilities?.n ? (
                            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200 gap-1 h-[48px] items-center justify-center">
                                {[1, 2, 4].map(n => (
                                    <button
                                        key={n}
                                        type="button"
                                        onClick={() => setNumImages(n)}
                                        className={`flex-1 h-9 text-sm font-semibold rounded-lg transition-all ${
                                            numImages === n
                                                ? 'bg-violet-600 text-white shadow-sm'
                                                : 'text-gray-500 hover:bg-gray-100'
                                        }`}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 h-[48px] items-center justify-center">
                                <span className="text-sm font-medium text-gray-500">1张（固定）</span>
                            </div>
                        )}
                    </div>
                </div>
    
                {/* 第二参数行（条件显示） */}
                {currentModelConfig.capabilities?.style && (
                    <div className="grid grid-cols-3 gap-3">
                        <div className="relative">
                            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-2">
                                <Monitor size={14} className="text-blue-500" />
                                画幅比例
                            </label>
                            <div className="relative">
                                <select
                                    value={resolution}
                                    onChange={(e) => setResolution(e.target.value)}
                                    className="w-full appearance-none bg-gradient-to-br from-white to-gray-50 border border-gray-200 pl-3 pr-10 py-3 rounded-xl text-sm text-gray-900 font-medium outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all cursor-pointer"
                                >
                                    {currentModelConfig.resolutions.map(res => (
                                        <option key={res} value={res}>{RESOLUTION_LABELS[res] || res}</option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
    
                        {/* 智能改写开关 */}
                        <div className="col-span-2 flex items-end">
                            <div className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-xs font-semibold text-gray-700">智能改写 (AI Extend)</span>
                                    <span className="text-xs text-gray-500">自动补全丰富细节</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setUsePromptExtend(!usePromptExtend)}
                                    className={`w-11 h-6 rounded-full relative transition-colors ${usePromptExtend ? 'bg-violet-600' : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${usePromptExtend ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
    
                {/* 智能改写开关（没有style时显示在这里） */}
                {!currentModelConfig.capabilities?.style && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-gray-700">智能改写 (AI Extend)</span>
                            <span className="text-xs text-gray-500">自动补全丰富细节</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setUsePromptExtend(!usePromptExtend)}
                            className={`w-11 h-6 rounded-full relative transition-colors ${usePromptExtend ? 'bg-violet-600' : 'bg-gray-300'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${usePromptExtend ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                )}
    
                {/* 操作按钮 */}
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${showAdvanced ? 'bg-violet-100 text-violet-700 border border-violet-200' : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-150'}`}
                    >
                        <Settings2 size={16} className="inline mr-2" />
                        {showAdvanced ? '收起设置' : '高级设置'}
                    </button>
                        
                    <button
                        type="submit"
                        disabled={isSubmitting || !prompt.trim()}
                        className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold py-2.5 px-6 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-violet-500/30"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                                <span>生成中...</span>
                            </>
                        ) : (
                            <>
                                <Wand2 size={18} />
                                <span>立即生成（¥{getEstimatedCost()}）</span>
                            </>
                        )}
                    </button>
                </div>
    
                {/* 高级设置 */}
                {showAdvanced && (
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border border-gray-200 space-y-4 animate-in slide-in-from-top-2 duration-200">

                        {currentModelConfig.capabilities?.negative_prompt && (
                            <div>
                                <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 mb-2">
                                    <ShieldCheck size={14} className="text-red-500" />
                                    反向提示词 (Negative Prompt)
                                </label>
                                <textarea
                                    value={negativePrompt}
                                    onChange={(e) => setNegativePrompt(e.target.value)}
                                    placeholder="不希望在画中出现的内容，如：模糊、畸形、文字扭曲等"
                                    className="w-full min-h-[80px] bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all resize-none"
                                />
                            </div>
                        )}

                        {currentModelConfig.capabilities?.seed && (
                            <div>
                                <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 mb-2">
                                    <Hash size={14} className="text-blue-500" />
                                    随机种子 (Seed)
                                </label>
                                <input
                                    type="number"
                                    value={seed}
                                    onChange={(e) => setSeed(e.target.value)}
                                    placeholder="留空则随机生成，固定种子可保持一致性"
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all font-mono"
                                />
                            </div>
                        )}
                    </div>
                )}
            </form>
        </div>
    );
};

export default ImageGenerator;
