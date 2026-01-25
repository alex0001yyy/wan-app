import React, { useState, useEffect } from 'react';
import { Wand2, Monitor, ChevronDown, Sparkles, Video, Image as ImageIcon, Music, Settings2, ShieldCheck, Hash, Layers, Upload, X } from 'lucide-react';
import { I2V_MODELS, RESOLUTION_LABELS } from '../config/models';
import { uploadFileSimple } from '../hooks/useFileUpload';

const I2VGenerator = ({ onGenerate, isGenerating, apiKey }) => {
    const defaultModel = I2V_MODELS[0];
    const [prompt, setPrompt] = useState('');
    const [imgInput, setImgInput] = useState({ value: '', file: null });
    const [audioInput, setAudioInput] = useState({ type: 'url', value: '', file: null });
    const [imgPreview, setImgPreview] = useState('');
    const [audioPreview, setAudioPreview] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [seed, setSeed] = useState('');
    const [selectedModelId, setSelectedModelId] = useState(defaultModel.id);
    const [resolution, setResolution] = useState(defaultModel.defaultRes);
    const [duration, setDuration] = useState(5);
    const [shotType, setShotType] = useState('single');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [previewImage, setPreviewImage] = useState(null); // 弹窗预览
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadingAudio, setUploadingAudio] = useState(false);

    const currentModelConfig = I2V_MODELS.find(m => m.id === selectedModelId) || defaultModel;

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

    useEffect(() => {
        if (!currentModelConfig.resolutions.includes(resolution)) {
            setResolution(currentModelConfig.defaultRes);
        }
    }, [selectedModelId]);

    // Handle image file selection - 使用 OSS 上传
    const handleImageFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                try {
                    setUploadingImage(true);
                    setImgPreview(URL.createObjectURL(file));
                    // i2v API 必须使用 URL
                    const url = await uploadFileSimple(file, apiKey, selectedModelId, { requireUrl: true });
                    console.log('✅ 首帧图片上传成功:', url);
                    setImgInput({ value: url, file });
                } catch (error) {
                    console.error('Error uploading image:', error);
                    alert('图片上传失败: ' + error.message);
                    setImgPreview('');
                } finally {
                    setUploadingImage(false);
                }
            } else {
                alert('请选择有效的图片文件 (jpg, png, gif等)');
            }
        }
    };

    // Handle audio file selection - 使用 OSS 上传
    const handleAudioFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type.startsWith('audio/') || file.name.toLowerCase().endsWith('.mp3') || file.name.toLowerCase().endsWith('.wav')) {
                try {
                    setUploadingAudio(true);
                    setAudioPreview(URL.createObjectURL(file));
                    // i2v API 必须使用 URL
                    const url = await uploadFileSimple(file, apiKey, selectedModelId, { requireUrl: true });
                    console.log('✅ 音频上传成功:', url);
                    setAudioInput({ type: 'file', value: url, file });
                } catch (error) {
                    console.error('Error uploading audio:', error);
                    alert('音频上传失败: ' + error.message);
                    setAudioPreview('');
                } finally {
                    setUploadingAudio(false);
                }
            } else {
                alert('请选择有效的音频文件 (mp3, wav等)');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!prompt.trim() || !imgInput.value.trim()) return;

        let imgValue = imgInput.value;
        let audioValue = '';

        // Prepare audio value based on input type
        if (audioInput.type === 'url') {
            audioValue = audioInput.value.trim() || undefined;
        } else if (audioInput.type === 'file') {
            audioValue = audioInput.value || undefined;
        }

        const inputObj = {
            prompt: prompt.trim(),
            img_url: imgValue
        };

        if (audioValue) {
            inputObj.audio_url = audioValue;
        }

        onGenerate({
            model: selectedModelId,
            input: inputObj,
            parameters: {
                size: resolution,
                duration: currentModelConfig.capabilities?.duration !== false ? parseInt(duration) : undefined,
                shot_type: currentModelConfig.capabilities?.shot_type ? shotType : undefined,
                negative_prompt: currentModelConfig.capabilities?.negative_prompt ? negativePrompt : undefined,
                seed: currentModelConfig.capabilities?.seed && seed ? parseInt(seed) : undefined,
            }
        });
    };

    return (
        <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Prompt Input */}
                <div className="relative">
                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 mb-2">
                        <Sparkles size={14} className="text-violet-500" />
                        动作描述
                    </label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="描述图像如何动起来，例如：角色缓慢转头看向镜头，背景中的树叶随风摇曳..."
                        className="w-full min-h-[100px] bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all resize-none"
                        required
                    />
                </div>

                {/* Control Bar - Model, Resolution, Duration, Image */}
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Model Selection */}
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-gray-600">模型</label>
                            <select
                                value={selectedModelId}
                                onChange={(e) => setSelectedModelId(e.target.value)}
                                className="bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm font-medium outline-none focus:border-violet-400"
                            >
                                {I2V_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
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
                                {currentModelConfig.resolutions.map(res => (
                                    <option key={res} value={res}>{RESOLUTION_LABELS[res] || res}</option>
                                ))}
                            </select>
                        </div>

                        <div className="h-6 w-px bg-gray-300"></div>

                        {/* Duration */}
                        {currentModelConfig.capabilities?.duration !== false ? (
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-medium text-gray-600">时长</label>
                                <select
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    className="bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm font-medium outline-none focus:border-violet-400"
                                >
                                    {[2, 5, 10, 15].map(d => <option key={d} value={d}>{d}秒</option>)}
                                </select>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-medium text-gray-600">时长</label>
                                <div className="bg-gray-100 border border-gray-200 px-3 py-2 rounded-lg text-sm font-medium text-gray-500">
                                    5秒（固定）
                                </div>
                            </div>
                        )}

                        <div className="h-6 w-px bg-gray-300"></div>

                        {/* Image Upload - Compact */}
                        <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 whitespace-nowrap">
                                <ImageIcon className="text-blue-600" size={14} />
                                首帧图片 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageFileChange}
                                className="hidden"
                                id="input-image-upload"
                                required
                            />
                            {imgPreview ? (
                                <div className="relative group">
                                    <img 
                                        src={imgPreview} 
                                        alt="输入预览" 
                                        className="h-8 w-auto object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => setPreviewImage(imgPreview)}
                                    />
                                    <button
                                        type="button"
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            setImgPreview('');
                                            setImgInput({ value: '', file: null });
                                        }}
                                        className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={10} />
                                    </button>
                                </div>
                            ) : (
                                <label 
                                    htmlFor="input-image-upload"
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
                        disabled={isGenerating || !prompt.trim() || !imgInput.value.trim()}
                        className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? (
                            <>
                                <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                                <span>生成中...</span>
                            </>
                        ) : (
                            <>
                                <Video size={18} />
                                <span>生成视频</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Advanced Settings */}
                {showAdvanced && (
                    <div className="bg-white/50 backdrop-blur rounded-xl p-5 border border-gray-100 animate-in slide-in-from-top-4 duration-500 space-y-4">
                        {/* 第一行：镜头类型 + 随机种子 + 反向提示词 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* 镜头叙事类型 */}
                            {currentModelConfig.capabilities?.shot_type && (
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        镜头叙事类型
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShotType('single')}
                                            className={`py-2.5 text-xs font-bold rounded-lg border transition-all ${shotType === 'single' ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white border-gray-100 text-gray-500'}`}
                                        >单镜头</button>
                                        <button
                                            type="button"
                                            onClick={() => setShotType('multi')}
                                            className={`py-2.5 text-xs font-bold rounded-lg border transition-all ${shotType === 'multi' ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white border-gray-100 text-gray-500'}`}
                                        >多镜头</button>
                                    </div>
                                </div>
                            )}

                            {/* 随机种子 */}
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

                            {/* 反向提示词 */}
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

                        {/* 配音音频 */}
                        {currentModelConfig.capabilities?.audio && (
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    <Music size={12} className="text-orange-500" /> 配音音频 (可选)
                                </label>
                                
                                <div className="flex items-center gap-3">
                                    {/* Input Type Toggle */}
                                    <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-100 gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setAudioInput({...audioInput, type: 'url'})}
                                            className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${audioInput.type === 'url' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400'}`}
                                        >
                                            URL链接
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAudioInput({...audioInput, type: 'file'})}
                                            className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${audioInput.type === 'file' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400'}`}
                                        >
                                            文件上传
                                        </button>
                                    </div>

                                    {/* Input Field */}
                                    <div className="flex-1">
                                        {audioInput.type === 'url' ? (
                                            <input
                                                type="text"
                                                value={audioInput.value}
                                                onChange={(e) => setAudioInput({...audioInput, value: e.target.value})}
                                                placeholder="输入音频 URL (mp3/wav)..."
                                                className="w-full bg-white border border-gray-100 px-4 py-2 rounded-xl text-sm outline-none focus:border-orange-300"
                                            />
                                        ) : (
                                            <label className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2 flex items-center cursor-pointer hover:bg-gray-50 transition-all text-sm">
                                                <input
                                                    type="file"
                                                    accept="audio/*,.mp3,.wav"
                                                    onChange={handleAudioFileChange}
                                                    className="hidden"
                                                />
                                                <span className="text-gray-500">{audioPreview ? '音频文件已选择' : '选择音频文件'}</span>
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
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
};

export default I2VGenerator;
