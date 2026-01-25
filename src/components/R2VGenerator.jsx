import React, { useState, useEffect } from 'react';
import { Video, Monitor, ChevronDown, Sparkles, Upload, Settings2, ShieldCheck, Hash, Users } from 'lucide-react';
import { R2V_MODELS, RESOLUTION_LABELS } from '../config/models';
import { uploadFileSimple } from '../hooks/useFileUpload';

const R2VGenerator = ({ onGenerate, isGenerating, apiKey }) => {
    const defaultModel = R2V_MODELS[0];
    const [prompt, setPrompt] = useState('');
    const [referenceVideos, setReferenceVideos] = useState([
        { value: '', file: null, preview: '', character: 'character1', uploading: false }
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

    // Handle video file selection for a specific reference slot - 使用 OSS 上传
    const handleVideoFileChange = async (index, e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type.startsWith('video/') || file.name.toLowerCase().endsWith('.mp4') || file.name.toLowerCase().endsWith('.mov')) {
                try {
                    // 设置上传中状态
                    const newReferences = [...referenceVideos];
                    newReferences[index] = {
                        ...newReferences[index],
                        uploading: true,
                        preview: URL.createObjectURL(file)
                    };
                    setReferenceVideos(newReferences);

                    // 上传到 OSS（r2v API 必须使用 URL）
                    const url = await uploadFileSimple(file, apiKey, selectedModelId, { requireUrl: true });
                    console.log('✅ 参考视频上传成功:', url);
                    
                    // 更新状态
                    const updatedReferences = [...referenceVideos];
                    updatedReferences[index] = {
                        ...updatedReferences[index],
                        file: file,
                        value: url,
                        preview: URL.createObjectURL(file),
                        uploading: false
                    };
                    setReferenceVideos(updatedReferences);
                } catch (error) {
                    console.error('Error uploading video:', error);
                    alert('视频上传失败: ' + error.message);
                    // 重置上传状态
                    const resetReferences = [...referenceVideos];
                    resetReferences[index] = {
                        ...resetReferences[index],
                        uploading: false
                    };
                    setReferenceVideos(resetReferences);
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
                { value: '', file: null, preview: '', character: `character${referenceVideos.length + 1}`, uploading: false }
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

    // Remove unused functions
    // updateReferenceType and updateReferenceValue are no longer needed

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        // Prepare reference video URLs (all from file upload)
        const referenceUrls = [];
        for (const ref of referenceVideos) {
            if (ref.value) {
                referenceUrls.push(ref.value); // Base64 encoded file
            }
        }

        if (referenceUrls.length === 0) return;

        onGenerate({
            model: selectedModelId,
            input: {
                prompt: prompt.trim(),
                reference_video_urls: referenceUrls,
                // negative_prompt 应该在 input 里
                negative_prompt: negativePrompt.trim() || undefined
            },
            parameters: {
                size: resolution,
                duration: parseInt(duration),
                shot_type: currentModelConfig.capabilities?.shot_type ? shotType : undefined,
                seed: currentModelConfig.capabilities?.seed && seed ? parseInt(seed) : undefined,
                watermark: currentModelConfig.capabilities?.watermark ? watermark : undefined
            }
        });
    };

    return (
        <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
    
                {/* Main Interaction Area */}
                <div className="space-y-4">
                    {/* Prompt Input */}
                    <div className="relative">
                        <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 mb-2">
                            <Sparkles size={14} className="text-violet-500" />
                            动作描述
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="描述视频内容，使用 character1, character2 等标识引用参考角色..."
                            className="w-full min-h-[100px] bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all resize-none"
                            required
                        />
                    </div>
    
                    {/* Control Bar - Model, Resolution, Duration */}
                    <div className="grid grid-cols-3 gap-3">
                        {/* Model Selector */}
                        <div>
                            <label className="text-xs font-medium text-gray-600 mb-1.5 block">模型版本</label>
                            <div className="relative">
                                <select
                                    value={selectedModelId}
                                    onChange={(e) => setSelectedModelId(e.target.value)}
                                    className="w-full appearance-none bg-gradient-to-br from-white to-gray-50 border border-gray-200 pl-3 pr-10 py-3 rounded-xl text-sm font-semibold text-gray-800 outline-none hover:border-violet-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all cursor-pointer shadow-sm hover:shadow"
                                >
                                    {R2V_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
    
                        {/* Resolution Selector */}
                        <div>
                            <label className="text-xs font-medium text-gray-600 mb-1.5 block">分辨率</label>
                            <div className="relative">
                                <select
                                    value={resolution}
                                    onChange={(e) => setResolution(e.target.value)}
                                    className="w-full appearance-none bg-gradient-to-br from-white to-gray-50 border border-gray-200 pl-3 pr-10 py-3 rounded-xl text-sm font-semibold text-gray-800 outline-none hover:border-violet-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all cursor-pointer shadow-sm hover:shadow"
                                >
                                    {currentModelConfig.resolutions.map(res => (
                                        <option key={res} value={res}>{RESOLUTION_LABELS[res] || res}</option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
    
                        {/* Duration Selector */}
                        <div>
                            <label className="text-xs font-medium text-gray-600 mb-1.5 block">时长</label>
                            <div className="relative">
                                <select
                                    value={duration}
                                    onChange={(e) => setDuration(parseInt(e.target.value))}
                                    className="w-full appearance-none bg-gradient-to-br from-white to-gray-50 border border-gray-200 pl-3 pr-10 py-3 rounded-xl text-sm font-semibold text-gray-800 outline-none hover:border-violet-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all cursor-pointer shadow-sm hover:shadow"
                                >
                                    <option value={5}>5秒</option>
                                    <option value={10}>10秒</option>
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>
    
                    {/* Reference Videos Upload Section */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3 flex-wrap">
                            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 whitespace-nowrap">
                                <Video className="text-violet-600" size={14} />
                                参考视频 ({referenceVideos.filter(v => v.preview).length}/{referenceVideos.length})
                            </label>
                    
                            {referenceVideos.map((ref, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <input
                                        type="file"
                                        accept="video/mp4,video/mov,video/*"
                                        onChange={(e) => handleVideoFileChange(index, e)}
                                        className="hidden"
                                        id={`video-upload-${index}`}
                                    />
                                    {ref.preview ? (
                                        <div className="relative group">
                                            <video 
                                                src={ref.preview} 
                                                className="h-8 w-auto object-cover rounded cursor-pointer"
                                                onClick={() => {
                                                    const modal = document.createElement('div');
                                                    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
                                                    modal.onclick = () => modal.remove();
                                                    const video = document.createElement('video');
                                                    video.src = ref.preview;
                                                    video.controls = true;
                                                    video.className = 'max-w-full max-h-full rounded-lg';
                                                    video.onclick = (e) => e.stopPropagation();
                                                    modal.appendChild(video);
                                                    document.body.appendChild(modal);
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (referenceVideos.length > 1) {
                                                        removeReferenceVideo(index);
                                                    } else {
                                                        const newReferences = [...referenceVideos];
                                                        newReferences[index] = { ...newReferences[index], value: '', file: null, preview: '' };
                                                        setReferenceVideos(newReferences);
                                                    }
                                                }}
                                                className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                ✕
                                            </button>
                                            {/* Character badge */}
                                            <div className="absolute -bottom-1 left-0 right-0 text-[10px] bg-white/90 border border-gray-200 rounded px-1 py-0.5 text-center">
                                                {ref.character}
                                            </div>
                                        </div>
                                    ) : (
                                        <label 
                                            htmlFor={`video-upload-${index}`}
                                            className="h-8 px-3 flex items-center gap-2 border border-dashed border-gray-300 rounded bg-white hover:bg-gray-50 cursor-pointer transition-all"
                                        >
                                            <Upload className="text-gray-400" size={14} />
                                            <span className="text-xs text-gray-500">{ref.character}</span>
                                        </label>
                                    )}
                                </div>
                            ))}
                    
                            {/* 添加参考视频按钮 */}
                            {referenceVideos.length < 3 && (
                                <button
                                    type="button"
                                    onClick={addReferenceVideo}
                                    className="h-8 px-3 flex items-center gap-1.5 border border-dashed border-violet-300 rounded bg-violet-50 hover:bg-violet-100 text-violet-600 cursor-pointer transition-all"
                                >
                                    <Users size={14} />
                                    <span className="text-xs font-medium">+角色</span>
                                </button>
                            )}
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                            提示：使用 character1, character2 等标识引用参考角色。支持 2-30s, ≤10  0MB, mp4/mov
                        </div>
                    </div>
                </div>
    
                {/* Action Buttons */}
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
                        disabled={isGenerating || !prompt.trim() || referenceVideos.every(ref => !ref.value.trim())}
                        className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold py-2.5 px-6 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-violet-500/30"
                    >
                        {isGenerating ? (
                            <>
                                <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                                <span>生成中...</span>
                            </>
                        ) : (
                            <>
                                <Video size={18} />
                                <span>参考生视频</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Advanced Settings */}
                {showAdvanced && (
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border border-gray-200 space-y-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Shot Type - if supported */}
                            {currentModelConfig.capabilities?.shot_type && (
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">镜头类型</label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShotType('single')}
                                            className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${shotType === 'single' ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                        >单镜头</button>
                                        <button
                                            type="button"
                                            onClick={() => setShotType('multi')}
                                            className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${shotType === 'multi' ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                        >多镜头</button>
                                    </div>
                                </div>
                            )}

                            {/* Seed - if supported */}
                            {currentModelConfig.capabilities?.seed && (
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">随机种子</label>
                                    <input
                                        type="number"
                                        value={seed}
                                        onChange={(e) => setSeed(e.target.value)}
                                        placeholder="保持生成一致性"
                                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                                    />
                                </div>
                            )}

                            {/* Watermark - if supported */}
                            {currentModelConfig.capabilities?.watermark && (
                                <div className="flex items-center">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={watermark}
                                            onChange={(e) => setWatermark(e.target.checked)}
                                            className="w-4 h-4 text-violet-600 bg-gray-100 border-gray-300 rounded focus:ring-violet-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">添加水印</span>
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* Negative Prompt - if supported */}
                        {currentModelConfig.capabilities?.negative_prompt && (
                            <div>
                                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">反向提示词</label>
                                <textarea
                                    value={negativePrompt}
                                    onChange={(e) => setNegativePrompt(e.target.value)}
                                    placeholder="过滤不想要的场景..."
                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none"
                                    rows={3}
                                />
                            </div>
                        )}
                    </div>
                )}
            </form>
        </div>
    );
};

export default R2VGenerator;
