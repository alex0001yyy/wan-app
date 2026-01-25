import React, { useState, useEffect } from 'react';
import { Video, Monitor, ChevronDown, Sparkles, Upload, Settings2, ShieldCheck, Hash, Users } from 'lucide-react';
import { R2V_MODELS, RESOLUTION_LABELS } from '../config/models';

const R2VGenerator = ({ onGenerate, isGenerating }) => {
    const defaultModel = R2V_MODELS[0];
    const [prompt, setPrompt] = useState('');
    const [referenceVideos, setReferenceVideos] = useState([
        { type: 'url', value: '', file: null, preview: '', character: 'character1' }
    ]);
    const [negativePrompt, setNegativePrompt] = useState('');
    const [seed, setSeed] = useState('');
    const [selectedModelId, setSelectedModelId] = useState(defaultModel.id);
    const [resolution, setResolution] = useState(defaultModel.defaultRes);
    const [duration, setDuration] = useState(5);
    const [shotType, setShotType] = useState('single');
    const [watermark, setWatermark] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const currentModelConfig = R2V_MODELS.find(m => m.id === selectedModelId) || defaultModel;

    useEffect(() => {
        if (!currentModelConfig.resolutions.includes(resolution)) {
            setResolution(currentModelConfig.defaultRes);
        }
    }, [selectedModelId, currentModelConfig]);

    // Convert file to base64
    const convertFileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    };

    // Handle video file selection for a specific reference slot
    const handleVideoFileChange = async (index, e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type.startsWith('video/') || file.name.toLowerCase().endsWith('.mp4') || file.name.toLowerCase().endsWith('.mov')) {
                try {
                    const base64 = await convertFileToBase64(file);
                    const newReferences = [...referenceVideos];
                    newReferences[index] = {
                        ...newReferences[index],
                        file: file,
                        value: base64,
                        preview: URL.createObjectURL(file)
                    };
                    setReferenceVideos(newReferences);
                } catch (error) {
                    console.error('Error converting video to base64:', error);
                }
            } else {
                alert('请选择有效的视频文件 (mp4, mov等)');
            }
        }
    };

    // Add a new reference video slot
    const addReferenceVideo = () => {
        if (referenceVideos.length < 3) {
            setReferenceVideos([
                ...referenceVideos,
                { type: 'url', value: '', file: null, preview: '', character: `character${referenceVideos.length + 1}` }
            ]);
        }
    };

    // Remove a reference video slot
    const removeReferenceVideo = (index) => {
        if (referenceVideos.length > 1) {
            const newReferences = referenceVideos.filter((_, i) => i !== index);
            setReferenceVideos(newReferences);
        }
    };

    // Update reference video type (url/file)
    const updateReferenceType = (index, type) => {
        const newReferences = [...referenceVideos];
        newReferences[index] = { ...newReferences[index], type };
        setReferenceVideos(newReferences);
    };

    // Update reference video value
    const updateReferenceValue = (index, value) => {
        const newReferences = [...referenceVideos];
        newReferences[index] = { ...newReferences[index], value, preview: value };
        setReferenceVideos(newReferences);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        // Prepare reference video URLs
        const referenceUrls = [];
        for (const ref of referenceVideos) {
            if (ref.value.trim()) {
                if (ref.type === 'url') {
                    referenceUrls.push(ref.value.trim());
                } else if (ref.type === 'file' && ref.value) {
                    referenceUrls.push(ref.value); // Base64 encoded file
                }
            }
        }

        if (referenceUrls.length === 0) return;

        onGenerate({
            model: selectedModelId,
            input: {
                prompt: prompt.trim(),
                reference_video_urls: referenceUrls
            },
            parameters: {
                size: resolution,
                duration: parseInt(duration),
                shot_type: currentModelConfig.capabilities?.shot_type ? shotType : undefined,
                negative_prompt: currentModelConfig.capabilities?.negative_prompt ? negativePrompt : undefined,
                seed: currentModelConfig.capabilities?.seed && seed ? parseInt(seed) : undefined,
                watermark: currentModelConfig.capabilities?.watermark ? watermark : undefined
            }
        });
    };

    return (
        <div className="fade-in-up h-full">
            <div className="max-w-full mx-auto h-full p-1">
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                    {/* Reference Videos Section */}
                    <div className="flex flex-col gap-4">
                        <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                            <Video size={14} className="text-purple-500" />
                            参考视频 (最多3个)
                        </label>
                        
                        {referenceVideos.map((ref, index) => (
                            <div key={index} className="border border-gray-100 rounded-2xl p-4 bg-white/50 backdrop-blur-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <Users size={16} className="text-purple-500" />
                                    <span className="text-sm font-bold text-gray-700">{ref.character}</span>
                                    {referenceVideos.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeReferenceVideo(index)}
                                            className="ml-auto text-red-400 hover:text-red-600 text-sm font-bold"
                                        >
                                            删除
                                        </button>
                                    )}
                                </div>
                                
                                {/* Input Type Toggle */}
                                <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100 gap-1 mb-3 w-fit">
                                    <button
                                        type="button"
                                        onClick={() => updateReferenceType(index, 'url')}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${ref.type === 'url' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400'}`}
                                    >
                                        URL链接
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => updateReferenceType(index, 'file')}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${ref.type === 'file' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400'}`}
                                    >
                                        文件上传
                                    </button>
                                </div>

                                {ref.type === 'url' ? (
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            value={ref.value}
                                            onChange={(e) => updateReferenceValue(index, e.target.value)}
                                            placeholder="输入参考视频的公网 URL 地址... (mp4/mov)"
                                            className="w-full bg-white border border-gray-100 px-4 py-3 rounded-xl text-sm font-medium outline-none focus:border-purple-300 shadow-sm transition-all"
                                        />
                                        {ref.preview && !ref.file && (
                                            <div className="mt-2 text-xs text-gray-500 truncate">
                                                预览: {ref.preview.substring(0, 50)}...
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="relative group">
                                        <label className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-all shadow-sm">
                                            <input
                                                type="file"
                                                accept="video/mp4,video/mov,video/*"
                                                onChange={(e) => handleVideoFileChange(index, e)}
                                                className="hidden"
                                            />
                                            <span className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                                <Upload size={14} />
                                                选择视频文件 (2-30s, ≤100MB)
                                            </span>
                                        </label>
                                        {ref.preview && (
                                            <div className="mt-2 text-xs text-gray-500 truncate">
                                                已选择: {ref.file?.name || '视频文件'}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}

                        {referenceVideos.length < 3 && (
                            <button
                                type="button"
                                onClick={addReferenceVideo}
                                className="w-fit px-4 py-2 text-sm font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200 transition-all"
                            >
                                + 添加更多角色参考
                            </button>
                        )}
                    </div>

                    {/* Main Interaction Area */}
                    <div className="flex flex-col lg:flex-row gap-4 items-start">
                        {/* Prompt Input */}
                        <div className="flex-1 w-full relative group">
                            <div className="absolute top-3 left-4 flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest z-10 transition-colors group-focus-within:text-purple-500">
                                <Sparkles size={12} />
                                动作描述 (Motion Prompt)
                            </div>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="描述视频内容，使用 character1, character2 等标识引用参考角色，例如：character1一边喝奶茶，一边随着音乐即兴跳舞。"
                                className="w-full min-h-[120px] bg-white border border-gray-100 rounded-2xl px-5 pt-10 pb-4 text-gray-900 text-lg font-medium outline-none focus:border-purple-300 shadow-sm transition-all resize-none"
                            />

                            <button
                                type="button"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className={`absolute bottom-3 right-4 flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-md transition-all ${showAdvanced ? 'bg-purple-50 text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <Settings2 size={12} />
                                {showAdvanced ? '折叠参数' : '高级设置'}
                            </button>
                        </div>

                        {/* Controls */}
                        <div className="w-full lg:w-fit flex flex-col gap-3 self-stretch">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 h-full">
                                {/* Model */}
                                <div className="relative min-w-[200px]">
                                    <select
                                        value={selectedModelId}
                                        onChange={(e) => setSelectedModelId(e.target.value)}
                                        className="w-full h-full appearance-none bg-white border border-gray-100 px-4 py-3 rounded-2xl text-sm font-bold text-gray-700 shadow-sm outline-none hover:bg-gray-50 transition-all cursor-pointer border-l-4 border-l-purple-500"
                                    >
                                        {R2V_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </select>
                                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                                </div>

                                {/* Main Submit */}
                                <button
                                    type="submit"
                                    disabled={isGenerating || !prompt.trim() || referenceVideos.every(ref => !ref.value.trim())}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-30 shadow-xl shadow-purple-200 group"
                                >
                                    {isGenerating ? (
                                        <div className="animate-spin h-5 w-5 border-2 border-white/20 border-t-white rounded-full" />
                                    ) : (
                                        <>
                                            <Video size={18} />
                                            <span>参考生视频</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Advanced Settings */}
                    {showAdvanced && (
                        <div className="bg-white/40 backdrop-blur rounded-2xl p-6 border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-4 duration-500">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        <Monitor size={12} /> 画面分辨率
                                    </label>
                                    <select
                                        value={resolution}
                                        onChange={(e) => setResolution(e.target.value)}
                                        className="w-full bg-white border border-gray-50 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                                    >
                                        {currentModelConfig.resolutions.map(res => (
                                            <option key={res} value={`${res === '720P' ? '1280*720' : '1920*1080'}`}>{RESOLUTION_LABELS[res] || res}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        视频时长 (秒)
                                    </label>
                                    <select
                                        value={duration}
                                        onChange={(e) => setDuration(parseInt(e.target.value))}
                                        className="w-full bg-white border border-gray-50 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                                    >
                                        <option value={5}>5秒</option>
                                        <option value={10}>10秒</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {currentModelConfig.capabilities?.shot_type && (
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                            镜头叙事类型
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShotType('single')}
                                                className={`py-2 text-xs font-bold rounded-lg border transition-all ${shotType === 'single' ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-gray-100 text-gray-500'}`}
                                            >单镜头</button>
                                            <button
                                                type="button"
                                                onClick={() => setShotType('multi')}
                                                className={`py-2 text-xs font-bold rounded-lg border transition-all ${shotType === 'multi' ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-gray-100 text-gray-500'}`}
                                            >多镜头</button>
                                        </div>
                                    </div>
                                )}

                                {currentModelConfig.capabilities?.seed && (
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                            <Hash size={12} /> 随机种子
                                        </label>
                                        <input
                                            type="number"
                                            value={seed}
                                            onChange={(e) => setSeed(e.target.value)}
                                            placeholder="保持生成一致性"
                                            className="w-full bg-white border border-gray-50 rounded-xl px-4 py-3 text-sm font-mono outline-none"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    <ShieldCheck size={12} className="text-red-400" /> 反向提示词
                                </label>
                                <textarea
                                    value={negativePrompt}
                                    onChange={(e) => setNegativePrompt(e.target.value)}
                                    placeholder="过滤不想要的场景..."
                                    className="w-full h-[110px] bg-white border border-gray-50 rounded-xl p-3 text-xs outline-none focus:border-purple-300"
                                />
                            </div>

                            {/* Watermark Setting */}
                            {currentModelConfig.capabilities?.watermark && (
                                <div className="space-y-2 col-span-full">
                                    <label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        水印设置
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={watermark}
                                                onChange={(e) => setWatermark(e.target.checked)}
                                                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                            />
                                            <span className="text-sm font-medium text-gray-700">添加水印</span>
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default R2VGenerator;
