import React, { useState, useEffect, memo, useCallback } from 'react';
import {
    Video, Image as ImageIcon, Upload, X, Wand2, Settings2,
    Hash, ShieldCheck, Sparkles
} from 'lucide-react';
import { KF2V_MODELS, RESOLUTION_LABELS } from '../config/models';
import { uploadFileSimple } from '../hooks/useFileUpload';

const KF2VGenerator = memo(({ onGenerate, isGenerating, apiKey }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Get current model config with fallback
    const defaultModel = KF2V_MODELS[0] || { id: '', defaultRes: '720P', resolutions: ['720P'], capabilities: {} };
    
    // Model & Basic Settings
    const [selectedModel, setSelectedModel] = useState(defaultModel.id);
    const [resolution, setResolution] = useState(defaultModel.defaultRes);
    const [prompt, setPrompt] = useState('');
    const [promptExtend, setPromptExtend] = useState(true);
    
    // Image Inputs
    const [firstFrameInput, setFirstFrameInput] = useState({ value: '', file: null });
    const [lastFrameInput, setLastFrameInput] = useState({ value: '', file: null });
    const [firstFramePreview, setFirstFramePreview] = useState('');
    const [lastFramePreview, setLastFramePreview] = useState('');
    const [previewImage, setPreviewImage] = useState(null); // 弹窗预览
    const [uploadingFirst, setUploadingFirst] = useState(false);
    const [uploadingLast, setUploadingLast] = useState(false);
    
    // Advanced Settings
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [negativePrompt, setNegativePrompt] = useState('');
    const [seed, setSeed] = useState('');

    // Get current model config
    const currentModelConfig = KF2V_MODELS.find(m => m.id === selectedModel) || defaultModel;

    // ESC键关闭预览
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && previewImage) {
                setPreviewImage(null);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [previewImage]);

    // Update resolution when model changes
    useEffect(() => {
        if (currentModelConfig) {
            setResolution(currentModelConfig.defaultRes);
        }
    }, [selectedModel, currentModelConfig]);

    // Handle first frame file upload - 使用 OSS 上传
    const handleFirstFrameChange = useCallback(async (e) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                setUploadingFirst(true);
                setFirstFramePreview(URL.createObjectURL(file));
                // kf2v API 必须使用 URL
                const url = await uploadFileSimple(file, apiKey, selectedModel, { requireUrl: true });
                console.log('✅ 首帧上传成功:', url);
                setFirstFrameInput({ value: url, file });
            } catch (error) {
                console.error('Error uploading first frame:', error);
                alert('首帧上传失败: ' + error.message);
                setFirstFramePreview('');
            } finally {
                setUploadingFirst(false);
            }
        }
    }, [apiKey, selectedModel]);

    // Handle last frame file upload - 使用 OSS 上传
    const handleLastFrameChange = useCallback(async (e) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                setUploadingLast(true);
                setLastFramePreview(URL.createObjectURL(file));
                // kf2v API 必须使用 URL
                const url = await uploadFileSimple(file, apiKey, selectedModel, { requireUrl: true });
                console.log('✅ 尾帧上传成功:', url);
                setLastFrameInput({ value: url, file });
            } catch (error) {
                console.error('Error uploading last frame:', error);
                alert('尾帧上传失败: ' + error.message);
                setLastFramePreview('');
            } finally {
                setUploadingLast(false);
            }
        }
    }, [apiKey, selectedModel]);

    // Clear first frame
    const clearFirstFrame = useCallback(() => {
        setFirstFrameInput({ value: '', file: null });
        setFirstFramePreview('');
    }, []);

    // Clear last frame
    const clearLastFrame = useCallback(() => {
        setLastFrameInput({ value: '', file: null });
        setLastFramePreview('');
    }, []);

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!firstFrameInput.value) return;

        setIsSubmitting(true);
        try {
            const taskData = {
                model: selectedModel,
                modelConfig: currentModelConfig,
                input: {
                    first_frame_url: firstFrameInput.value,
                    ...(lastFrameInput.value && { last_frame_url: lastFrameInput.value }),
                    ...(prompt.trim() && { prompt: prompt.trim() }),
                    ...(negativePrompt.trim() && { negative_prompt: negativePrompt.trim() })
                },
                parameters: {
                    resolution,
                    prompt_extend: promptExtend,
                    ...(seed && { seed: parseInt(seed) })
                }
            };

            await onGenerate(taskData);
        } catch (error) {
            console.error('Submit failed:', error);
            alert('提交失败: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Prompt Input */}
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <Sparkles size={14} className="text-violet-500" />
                            动作描述
                            <span className="text-gray-400 text-xs font-normal">(可选)</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-gray-500">
                            <input
                                type="checkbox"
                                checked={promptExtend}
                                onChange={(e) => setPromptExtend(e.target.checked)}
                                className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                            />
                            智能改写
                        </label>
                    </div>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="描述从首帧到尾帧的运动过程，例如：镜头从平视逐渐上升，最后俯拍..."
                        className="w-full min-h-[80px] bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all resize-none"
                    />
                </div>

                {/* Control Bar */}
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Model Selection */}
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-gray-600">模型</label>
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm font-medium outline-none focus:border-violet-400"
                            >
                                {KF2V_MODELS.map(model => (
                                    <option key={model.id} value={model.id}>{model.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="h-6 w-px bg-gray-300"></div>

                        {/* Resolution */}
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-gray-600">分辨率</label>
                            <select
                                value={resolution}
                                onChange={(e) => setResolution(e.target.value)}
                                className="bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm font-medium outline-none focus:border-violet-400"
                            >
                                {currentModelConfig.resolutions?.map(res => (
                                    <option key={res} value={res}>{RESOLUTION_LABELS[res] || res}</option>
                                ))}
                            </select>
                        </div>

                        <div className="h-6 w-px bg-gray-300"></div>

                        {/* Duration - Fixed 5s */}
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-gray-600">时长</label>
                            <div className="bg-gray-100 border border-gray-200 px-3 py-2 rounded-lg text-sm font-medium text-gray-500">
                                5秒（固定）
                            </div>
                        </div>
                    </div>
                </div>

                {/* Image Upload Section - Compact Style */}
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex flex-wrap items-center gap-4">
                        {/* First Frame */}
                        <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 whitespace-nowrap">
                                <ImageIcon className="text-blue-600" size={14} />
                                首帧图片 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFirstFrameChange}
                                className="hidden"
                                id="first-frame-upload"
                            />
                            {firstFramePreview ? (
                                <div className="relative group">
                                    <img 
                                        src={firstFramePreview} 
                                        alt="首帧预览" 
                                        className="h-8 w-auto object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => setPreviewImage(firstFramePreview)}
                                    />
                                    <button
                                        type="button"
                                        onClick={clearFirstFrame}
                                        className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={10} />
                                    </button>
                                </div>
                            ) : (
                                <label 
                                    htmlFor="first-frame-upload"
                                    className="h-8 px-3 flex items-center gap-2 border border-dashed border-gray-300 rounded bg-white hover:bg-gray-50 cursor-pointer transition-all"
                                >
                                    <Upload className="text-gray-400" size={14} />
                                    <span className="text-xs text-gray-500">点击上传图片</span>
                                </label>
                            )}
                        </div>

                        <div className="h-6 w-px bg-gray-300"></div>

                        {/* Last Frame */}
                        <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 whitespace-nowrap">
                                <ImageIcon className="text-purple-600" size={14} />
                                尾帧图片 <span className="text-gray-400 text-xs font-normal">(可选)</span>
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleLastFrameChange}
                                className="hidden"
                                id="last-frame-upload"
                            />
                            {lastFramePreview ? (
                                <div className="relative group">
                                    <img 
                                        src={lastFramePreview} 
                                        alt="尾帧预览" 
                                        className="h-8 w-auto object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => setPreviewImage(lastFramePreview)}
                                    />
                                    <button
                                        type="button"
                                        onClick={clearLastFrame}
                                        className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={10} />
                                    </button>
                                </div>
                            ) : (
                                <label 
                                    htmlFor="last-frame-upload"
                                    className="h-8 px-3 flex items-center gap-2 border border-dashed border-gray-300 rounded bg-white hover:bg-gray-50 cursor-pointer transition-all"
                                >
                                    <Upload className="text-gray-400" size={14} />
                                    <span className="text-xs text-gray-500">点击上传图片</span>
                                </label>
                            )}
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
                        disabled={isSubmitting || !firstFrameInput.value}
                        className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                                <span>生成中...</span>
                            </>
                        ) : (
                            <>
                                <Video size={18} />
                                <span>生成过渡视频</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Advanced Settings */}
                {showAdvanced && (
                    <div className="bg-white/50 backdrop-blur rounded-xl p-5 border border-gray-100 animate-in slide-in-from-top-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Seed */}
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
                                        className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-mono outline-none focus:border-violet-300"
                                    />
                                </div>
                            )}

                            {/* Negative Prompt */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    <ShieldCheck size={12} className="text-red-400" /> 反向提示词
                                </label>
                                <input
                                    value={negativePrompt}
                                    onChange={(e) => setNegativePrompt(e.target.value)}
                                    placeholder="过滤不想要的元素..."
                                    className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-300"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </form>

            {/* 图片预览弹窗 */}
            {previewImage && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative w-full h-full flex items-center justify-center p-8">
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-6 right-6 bg-white/90 hover:bg-white text-gray-800 rounded-full w-10 h-10 flex items-center justify-center shadow-lg z-10 transition-all"
                        >
                            <X size={24} />
                        </button>
                        <div className="text-xs text-white/60 absolute top-6 left-6">ESC 关闭</div>
                        <img
                            src={previewImage}
                            alt="预览"
                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </div>
    );
});

KF2VGenerator.displayName = 'KF2VGenerator';

export default KF2VGenerator;
