import React, { useState, useEffect } from 'react';
import { Wand2, Monitor, ChevronDown, Sparkles, Video, Settings2, ShieldCheck, Hash, Layers, Volume2, Mic, Upload } from 'lucide-react';
import { VIDEO_MODELS, RESOLUTION_LABELS } from '../config/models';
import { isValidUrl } from '../utils/fileUpload';
import { uploadFileSimple } from '../hooks/useFileUpload';

const VideoGenerator = ({ onGenerate, isGenerating, apiKey }) => {
    const [uploadingAudio, setUploadingAudio] = useState(false);
    const defaultModel = VIDEO_MODELS[0];
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [seed, setSeed] = useState('');
    const [selectedModelId, setSelectedModelId] = useState(defaultModel.id);
    const [resolution, setResolution] = useState(defaultModel.defaultRes);
    const [duration, setDuration] = useState(5);
    const [promptExtend, setPromptExtend] = useState(true);
    const [watermark, setWatermark] = useState(false);
    const [shotType, setShotType] = useState('single');
    const [audioInput, setAudioInput] = useState({ type: 'url', value: '', file: null }); // Support URL and file
    const [showAdvanced, setShowAdvanced] = useState(false);

    const currentModelConfig = VIDEO_MODELS.find(m => m.id === selectedModelId) || defaultModel;

    // Auto-adjust duration when model changes if current duration is not supported
    useEffect(() => {
        const availableDurations = getAvailableDurations();
        if (!availableDurations.includes(duration)) {
            setDuration(availableDurations[0]); // Reset to first available duration
        }
    }, [selectedModelId]);

    // Determine available durations based on model
    const getAvailableDurations = () => {
        switch(selectedModelId) {
            case 'wan2.6-t2v':
                return [5, 10, 15];
            case 'wan2.5-t2v-preview':
                return [5, 10];
            case 'wan2.2-t2v-plus':
            case 'wanx2.1-t2v-turbo':
            case 'wanx2.1-t2v-plus':
                return [5]; // Fixed 5 seconds for older models
            default:
                return [5]; // Default to 5 seconds
        }
    };

    // Handle audio file selection
    const handleAudioFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type.startsWith('audio/') || file.name.toLowerCase().endsWith('.mp3') || file.name.toLowerCase().endsWith('.wav')) {
                try {
                    setUploadingAudio(true);
                    setAudioInput({ type: 'file', value: '', file });
                    // 视频生成 API 必须使用 URL
                    const url = await uploadFileSimple(file, apiKey, selectedModelId, { requireUrl: true });
                    console.log('✅ 音频上传成功:', url);
                    setAudioInput({ type: 'file', value: url, file });
                } catch (error) {
                    console.error('Error uploading audio:', error);
                    alert('音频上传失败: ' + error.message);
                } finally {
                    setUploadingAudio(false);
                }
            } else {
                alert('请选择有效的音频文件 (mp3, wav等)');
            }
        }
    };

    // Handle URL input
    const handleAudioUrlChange = (e) => {
        const url = e.target.value.trim();
        if (url && !isValidUrl(url)) {
            alert('请输入有效的音频URL地址');
            return;
        }
        setAudioInput({ type: 'url', value: url, file: null });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        // Get audio value if provided
        const audioValue = audioInput.value.trim();

        const params = {
            model: selectedModelId,
            input: {
                prompt: prompt.trim()
            },
            parameters: {
                size: resolution,
                prompt_extend: promptExtend,
                duration: duration,
                watermark: watermark,
                negative_prompt: currentModelConfig.capabilities?.negative_prompt ? negativePrompt : undefined,
                seed: currentModelConfig.capabilities?.seed && seed ? parseInt(seed) : undefined
            }
        };

        // Add shot_type for models that support it (only wan2.6-t2v)
        if (currentModelConfig.capabilities?.shot_type && promptExtend) {
            params.parameters.shot_type = shotType;
        }

        // Add audio_url if provided and model supports it
        if (audioValue && currentModelConfig.capabilities?.audio) {
            params.input.audio_url = audioValue;
        }

        onGenerate(params);
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
                            视频创意描述
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="一只在雪地驰骋的赛博狼，4K，慢动作摄影，霓虹灯效..."
                            className="w-full min-h-[100px] bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all resize-none"
                        />
                    </div>

                    {/* Control Bar */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {/* Model Selector */}
                        <div className="col-span-2">
                            <label className="text-xs font-medium text-gray-600 mb-1.5 block">模型版本</label>
                            <div className="relative">
                                <select
                                    value={selectedModelId}
                                    onChange={(e) => setSelectedModelId(e.target.value)}
                                    className="w-full appearance-none bg-gradient-to-br from-white to-gray-50 border border-gray-200 pl-3 pr-10 py-3 rounded-xl text-sm font-semibold text-gray-800 outline-none hover:border-violet-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all cursor-pointer shadow-sm hover:shadow"
                                >
                                    {VIDEO_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
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
                                    {getAvailableDurations().map(d => (
                                        <option key={d} value={d}>{d}秒</option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
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
                            disabled={isGenerating || !prompt.trim()}
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
                                    <span>生成视频</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Advanced Settings Panel */}
                {showAdvanced && (
                    <div className="bg-gray-50/50 rounded-xl p-5 border border-gray-200 space-y-4 animate-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Left Column */}
                            <div className="space-y-4">
                                {currentModelConfig.capabilities?.negative_prompt && (
                                    <div>
                                        <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-1.5">
                                            <ShieldCheck size={13} className="text-red-500" />
                                            排除内容
                                        </label>
                                        <textarea
                                            value={negativePrompt}
                                            onChange={(e) => setNegativePrompt(e.target.value)}
                                            placeholder="不希望出现的场景..."
                                            className="w-full h-20 bg-white border border-gray-200 rounded-lg p-3 text-xs outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all resize-none"
                                        />
                                    </div>
                                )}

                                {currentModelConfig.capabilities?.seed && (
                                    <div>
                                        <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-1.5">
                                            <Hash size={13} className="text-blue-500" />
                                            固定种子
                                        </label>
                                        <input
                                            type="number"
                                            value={seed}
                                            onChange={(e) => setSeed(e.target.value)}
                                            placeholder="输入数字固定结果"
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Right Column */}
                            <div className="space-y-4">

                                {currentModelConfig.capabilities?.shot_type && (
                                    <div>
                                        <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-1.5">
                                            <Layers size={13} />
                                            镜头类型
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShotType('single')}
                                                className={`py-2 text-xs font-medium rounded-lg border transition-all ${shotType === 'single' ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
                                            >
                                                单镜头
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShotType('multi')}
                                                className={`py-2 text-xs font-medium rounded-lg border transition-all ${shotType === 'multi' ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
                                            >
                                                多镜头
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {currentModelConfig.capabilities?.audio && (
                                    <div>
                                        <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-1.5">
                                            <Mic size={13} />
                                            音频输入
                                        </label>
                                        
                                        {/* URL Input */}
                                        <input
                                            type="text"
                                            value={audioInput.type === 'url' ? audioInput.value : ''}
                                            onChange={handleAudioUrlChange}
                                            placeholder="输入音频URL..."
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all mb-2"
                                        />
                                        
                                        {/* File Upload */}
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept="audio/*,.mp3,.wav"
                                                onChange={handleAudioFileChange}
                                                className="hidden"
                                                id="audio-upload-advanced"
                                            />
                                            <label 
                                                htmlFor="audio-upload-advanced" 
                                                className="flex items-center justify-center gap-2 w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-xs font-medium text-gray-600 cursor-pointer transition-colors"
                                            >
                                                <Upload size={14} />
                                                {audioInput.type === 'file' && audioInput.file 
                                                    ? audioInput.file.name 
                                                    : '或上传音频文件'}
                                            </label>
                                        </div>
                                    </div>
                                )}  
                            </div>
                        </div>

                        {/* Toggle Options */}
                        <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-200">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={promptExtend}
                                    onChange={(e) => setPromptExtend(e.target.checked)}
                                    className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                                />
                                <span className="text-xs text-gray-700">智能改写提示词</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={watermark}
                                    onChange={(e) => setWatermark(e.target.checked)}
                                    className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                                />
                                <span className="text-xs text-gray-700">添加水印</span>
                            </label>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};

export default VideoGenerator;
