import React, { useState, useEffect } from 'react';
import { Wand2, Monitor, ChevronDown, Sparkles, Video, Image as ImageIcon, Music, Settings2, ShieldCheck, Hash, Layers } from 'lucide-react';
import { I2V_MODELS, RESOLUTION_LABELS, VIDEO_EFFECT_TEMPLATES } from '../config/models';

const I2VGenerator = ({ onGenerate, isGenerating }) => {
    const defaultModel = I2V_MODELS[0];
    const [prompt, setPrompt] = useState('');
    const [imgInput, setImgInput] = useState({ type: 'url', value: '', file: null }); // Changed to object for input type
    const [audioInput, setAudioInput] = useState({ type: 'url', value: '', file: null }); // Changed to object for input type
    const [imgPreview, setImgPreview] = useState(''); // For image preview
    const [audioPreview, setAudioPreview] = useState(''); // For audio preview
    const [negativePrompt, setNegativePrompt] = useState('');
    const [seed, setSeed] = useState('');
    const [selectedModelId, setSelectedModelId] = useState(defaultModel.id);
    const [resolution, setResolution] = useState(defaultModel.defaultRes);
    const [duration, setDuration] = useState(5);
    const [shotType, setShotType] = useState('single');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [imgFrameType, setImgFrameType] = useState('first'); // Added frame type state
    const [useEffectMode, setUseEffectMode] = useState(false); // Added effect mode state
    const [selectedTemplate, setSelectedTemplate] = useState(''); // Added template selection

    // Add effect: when switching to effect mode, force to first frame
    useEffect(() => {
        if (useEffectMode && imgFrameType === 'last') {
            setImgFrameType('first');
        }
    }, [useEffectMode]);

    // Add effect: when switching to last frame, force to smart animation mode
    useEffect(() => {
        if (imgFrameType === 'last' && useEffectMode) {
            setUseEffectMode(false);
            setSelectedTemplate('');
        }
    }, [imgFrameType]);

    // Determine which template categories to show based on model support
    const getAvailableTemplates = () => {
        const templates = [];
        const modelId = selectedModelId.toLowerCase();
        
        if (modelId.includes('kf2v') || modelId.includes('keyframe')) {
            templates.push(...VIDEO_EFFECT_TEMPLATES.kf2v);
        } else if (modelId.includes('2.1') || modelId.includes('2.2') || modelId.includes('2.5') || modelId.includes('2.6')) {
            // Include general templates for most I2V models
            templates.push(...VIDEO_EFFECT_TEMPLATES.general);
            templates.push(...VIDEO_EFFECT_TEMPLATES.single);
            templates.push(...VIDEO_EFFECT_TEMPLATES.singleAnimal);
            templates.push(...VIDEO_EFFECT_TEMPLATES.couple);
        } else {
            // Fallback to general templates for any I2V model
            templates.push(...VIDEO_EFFECT_TEMPLATES.general);
            templates.push(...VIDEO_EFFECT_TEMPLATES.single);
        }
        return templates;
    };

    const currentModelConfig = I2V_MODELS.find(m => m.id === selectedModelId) || defaultModel;

    useEffect(() => {
        if (!currentModelConfig.resolutions.includes(resolution)) {
            setResolution(currentModelConfig.defaultRes);
        }
    }, [selectedModelId]);

    // Convert file to base64
    const convertFileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    };

    // Handle image file selection
    const handleImageFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                try {
                    const base64 = await convertFileToBase64(file);
                    setImgInput({ type: 'file', value: base64, file });
                    setImgPreview(URL.createObjectURL(file));
                } catch (error) {
                    console.error('Error converting image to base64:', error);
                }
            } else {
                alert('请选择有效的图片文件 (jpg, png, gif等)');
            }
        }
    };

    // Handle audio file selection
    const handleAudioFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type.startsWith('audio/') || file.name.toLowerCase().endsWith('.mp3') || file.name.toLowerCase().endsWith('.wav')) {
                try {
                    const base64 = await convertFileToBase64(file);
                    setAudioInput({ type: 'file', value: base64, file });
                    setAudioPreview(URL.createObjectURL(file));
                } catch (error) {
                    console.error('Error converting audio to base64:', error);
                }
            } else {
                alert('请选择有效的音频文件 (mp3, wav等)');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!(imgInput.value.trim())) return; // Remove prompt requirement for effect mode

        let imgValue = '';
        let audioValue = '';

        // Prepare image value based on input type
        if (imgInput.type === 'url') {
            imgValue = imgInput.value.trim();
        } else if (imgInput.type === 'file') {
            imgValue = imgInput.value; // Already base64
        }

        // Prepare audio value based on input type
        if (audioInput.type === 'url') {
            audioValue = audioInput.value.trim() || undefined;
        } else if (audioInput.type === 'file') {
            audioValue = audioInput.value || undefined; // Already base64
        }

        // Prepare input object based on mode (effect or regular)
        let inputObj = {};
        if (useEffectMode && selectedTemplate) {
            // Effect mode: use template instead of prompt
            inputObj = {
                img_url: imgValue, // Template mode always uses img_url
                template: selectedTemplate
            };
        } else {
            // Regular mode: use prompt
            if (!prompt.trim()) return; // Still require prompt for regular mode
            
            inputObj = {
                prompt: prompt.trim()
            };

            if (imgFrameType === 'first') {
                // Traditional Image-to-Video: use img_url for regular I2V
                inputObj.img_url = imgValue;
            } else if (imgFrameType === 'last') {
                // Keyframe-to-Video: use first_frame_url for KF2V (keyframe-to-video)
                // In this mode, the user uploads one image which serves as the "first frame"
                // and the AI generates the transition to the "last frame" based on the prompt
                inputObj.first_frame_url = imgValue;
            }

            if (audioValue) {
                inputObj.audio_url = audioValue;
            }
        }

        onGenerate({
            model: selectedModelId,
            input: inputObj,
            parameters: {
                size: resolution,
                duration: parseInt(duration),
                shot_type: currentModelConfig.capabilities?.shot_type && !useEffectMode ? shotType : undefined, // Disable shot_type in effect mode
                negative_prompt: currentModelConfig.capabilities?.negative_prompt && !useEffectMode ? negativePrompt : undefined, // Disable negative prompt in effect mode
                seed: currentModelConfig.capabilities?.seed && !useEffectMode && seed ? parseInt(seed) : undefined, // Disable seed in effect mode
            }
        });
    };

    return (
        <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">

                {/* Main Interaction Area */}
                <div className="space-y-4">
                    {/* Prompt Input or Template Selector */}
                    <div className="relative">
                        <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 mb-2">
                            {!useEffectMode ? (
                                <>
                                    <Sparkles size={14} className="text-violet-500" />
                                    动作描述
                                </>
                            ) : (
                                <>
                                    <Video size={14} className="text-purple-500" />
                                    特效模板
                                </>
                            )}
                        </label>
                        
                        {!useEffectMode ? (
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="描述图像如何动起来，例如：角色缓慢转头看向镜头，背景中的树叶随风摇曳..."
                                className="w-full min-h-[100px] bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all resize-none"
                                required={!useEffectMode}
                            />
                        ) : (
                            <div className="w-full min-h-[120px] bg-white border border-gray-200 rounded-xl px-4 py-3">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-2">
                                    {getAvailableTemplates().map(template => (
                                        <button
                                            key={template.value}
                                            type="button"
                                            onClick={() => setSelectedTemplate(template.value)}
                                            className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all ${
                                                selectedTemplate === template.value
                                                    ? 'bg-purple-100 border-purple-300 text-purple-700 shadow-sm'
                                                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            {template.label}
                                        </button>
                                    ))}
                                </div>
                                
                                {selectedTemplate && (
                                    <div className="mt-3 p-2 bg-purple-50 rounded-lg border border-purple-100">
                                        <div className="text-xs text-purple-600 font-medium">
                                            已选择: {getAvailableTemplates().find(t => t.value === selectedTemplate)?.label}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Control Bar - Model, Resolution, Duration */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {/* Model Selection */}
                        <div>
                            <label className="text-xs font-medium text-gray-600 mb-1.5 block">模型版本</label>
                            <div className="relative">
                                <select
                                    value={selectedModelId}
                                    onChange={(e) => setSelectedModelId(e.target.value)}
                                    className="w-full appearance-none bg-gradient-to-br from-white to-gray-50 border border-gray-200 pl-3 pr-10 py-3 rounded-xl text-sm font-semibold text-gray-800 outline-none hover:border-violet-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all cursor-pointer shadow-sm hover:shadow"
                                >
                                    {I2V_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Resolution */}
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

                        {/* Duration */}
                        <div>
                            <label className="text-xs font-medium text-gray-600 mb-1.5 block">时长</label>
                            <div className="relative">
                                <select
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    className="w-full appearance-none bg-gradient-to-br from-white to-gray-50 border border-gray-200 pl-3 pr-10 py-3 rounded-xl text-sm font-semibold text-gray-800 outline-none hover:border-violet-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all cursor-pointer shadow-sm hover:shadow"
                                >
                                    {[2, 5, 10, 15].map(d => <option key={d} value={d}>{d}秒</option>)}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Image Upload Section */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-4 mb-3">
                            {/* Frame Selection - Only show if model supports frame selection */}
                            {currentModelConfig.capabilities?.frame_selection && (
                                <div className="flex items-center gap-2">
                                    <label className="text-xs font-medium text-gray-600">视频帧选择</label>
                                    <div className="flex bg-white p-1 rounded-lg border border-gray-200 gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setImgFrameType('first')}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${imgFrameType === 'first' ? 'bg-violet-100 text-violet-700' : 'text-gray-500'}`}
                                        >
                                            首帧
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setImgFrameType('last')}
                                            disabled={useEffectMode}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                                                useEffectMode 
                                                    ? 'text-gray-300 cursor-not-allowed' 
                                                    : imgFrameType === 'last' 
                                                        ? 'bg-violet-100 text-violet-700' 
                                                        : 'text-gray-500'
                                            }`}
                                            title={useEffectMode ? '视频特效模式不支持尾帧' : ''}
                                        >
                                            尾帧
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            {/* Image Input Type Toggle */}
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-medium text-gray-600">上传图片</label>
                                <div className="flex bg-white p-1 rounded-lg border border-gray-200 gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setImgInput({...imgInput, type: 'url'})}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${imgInput.type === 'url' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}
                                    >
                                        URL链接
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setImgInput({...imgInput, type: 'file'})}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${imgInput.type === 'file' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}
                                    >
                                        文件上传
                                    </button>
                                </div>
                            </div>

                            {/* Effect Mode Toggle */}
                            <div className="flex items-center gap-2 ml-auto">
                                <button
                                    type="button"
                                    onClick={() => setUseEffectMode(false)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${!useEffectMode ? 'bg-violet-100 text-violet-700' : 'text-gray-500'}`}
                                >
                                    <Sparkles size={12} className="inline mr-1" />
                                    智能动画
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUseEffectMode(true)}
                                    disabled={imgFrameType === 'last'}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                                        imgFrameType === 'last'
                                            ? 'text-gray-300 cursor-not-allowed'
                                            : useEffectMode 
                                                ? 'bg-purple-100 text-purple-700' 
                                                : 'text-gray-500'
                                    }`}
                                    title={imgFrameType === 'last' ? '尾帧模式不支持视频特效' : ''}
                                >
                                    <Video size={12} className="inline mr-1" />
                                    视频特效
                                </button>
                            </div>
                        </div>

                        {/* Image Input Field */}
                        {imgInput.type === 'url' ? (
                            <div className="relative">
                                <input
                                    type="text"
                                    value={imgInput.value}
                                    onChange={(e) => {
                                        const newValue = e.target.value;
                                        setImgInput({...imgInput, value: newValue});
                                        setImgPreview(newValue);
                                    }}
                                    placeholder="输入图片的公网 URL 地址..."
                                    className="w-full bg-white border border-gray-200 px-4 py-2.5 rounded-lg text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                                    required
                                />
                                {imgPreview && !imgInput.file && (
                                    <div className="mt-2 flex justify-center">
                                        <img 
                                            src={imgPreview} 
                                            alt="Preview" 
                                            className="max-h-20 max-w-full object-contain rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() => {
                                                const modal = document.createElement('div');
                                                modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
                                                modal.onclick = () => modal.remove();
                                                
                                                const img = document.createElement('img');
                                                img.src = imgPreview;
                                                img.className = 'max-w-full max-h-full object-contain rounded-lg';
                                                img.onclick = (e) => e.stopPropagation();
                                                
                                                modal.appendChild(img);
                                                document.body.appendChild(modal);
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="relative">
                                <label className="w-full bg-white border border-gray-200 rounded-lg px-4 py-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageFileChange}
                                        className="hidden"
                                    />
                                    <ImageIcon className="text-gray-400 mb-2" size={32} />
                                    <span className="text-sm font-medium text-gray-500">点击选择图片文件</span>
                                </label>
                                {imgPreview && (
                                    <div className="mt-2 flex justify-center">
                                        <img 
                                            src={imgPreview} 
                                            alt="Preview" 
                                            className="max-h-20 max-w-full object-contain rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() => {
                                                const modal = document.createElement('div');
                                                modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
                                                modal.onclick = () => modal.remove();
                                                
                                                const img = document.createElement('img');
                                                img.src = imgPreview;
                                                img.className = 'max-w-full max-h-full object-contain rounded-lg';
                                                img.onclick = (e) => e.stopPropagation();
                                                
                                                modal.appendChild(img);
                                                document.body.appendChild(modal);
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
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
                        disabled={isGenerating || (useEffectMode ? !selectedTemplate : !prompt.trim()) || !(imgInput.value.trim())}
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
                                <span>{useEffectMode ? '生成特效' : '生图视频'}</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Advanced Settings */}
                {showAdvanced && (
                        <div className="bg-white/50 backdrop-blur rounded-xl p-5 border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-5 animate-in slide-in-from-top-4 duration-500">
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
                                            <option key={res} value={res}>{RESOLUTION_LABELS[res] || res}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        <Layers size={12} /> 视频时长 (秒)
                                    </label>
                                    <select
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                        className="w-full bg-white border border-gray-50 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                                    >
                                        {[2, 5, 10, 15].map(d => <option key={d} value={d}>{d}秒</option>)}
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
                                                className={`py-2 text-xs font-bold rounded-lg border transition-all ${shotType === 'single' ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white border-gray-100 text-gray-500'}`}
                                            >单镜头</button>
                                            <button
                                                type="button"
                                                onClick={() => setShotType('multi')}
                                                className={`py-2 text-xs font-bold rounded-lg border transition-all ${shotType === 'multi' ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white border-gray-100 text-gray-500'}`}
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
                                    className="w-full h-[110px] bg-white border border-gray-50 rounded-xl p-3 text-xs outline-none focus:border-violet-300"
                                />
                            </div>

                            {/* Audio URL (Optional) */}
                            {currentModelConfig.capabilities?.audio && (
                                <div className="space-y-2 col-span-full">
                                    <label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        <Music size={12} className="text-orange-500" /> 配音音频 (Optional)
                                    </label>
                                    
                                    {/* Input Type Toggle */}
                                    <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100 gap-1 mb-2 w-fit">
                                        <button
                                            type="button"
                                            onClick={() => setAudioInput({...audioInput, type: 'url'})}
                                            className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${audioInput.type === 'url' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400'}`}
                                        >
                                            URL链接
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAudioInput({...audioInput, type: 'file'})}
                                            className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${audioInput.type === 'file' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400'}`}
                                        >
                                            文件上传
                                        </button>
                                    </div>

                                    {audioInput.type === 'url' ? (
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                value={audioInput.value}
                                                onChange={(e) => setAudioInput({...audioInput, value: e.target.value})}
                                                placeholder="输入音频 URL (mp3/wav)..."
                                                className="w-full bg-white border border-gray-100 px-3 py-2 rounded-xl text-xs font-medium outline-none focus:border-orange-300 shadow-sm transition-all"
                                            />
                                            {audioInput.value && !audioInput.file && (
                                                <div className="mt-2 px-3 py-1.5 bg-orange-50 rounded-lg flex items-center gap-2 text-xs">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                                    <span className="text-orange-700 truncate">{audioInput.value}</span>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="relative group">
                                            <label className="w-full bg-white border border-gray-100 rounded-xl px-3 py-2 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-all shadow-sm text-xs">
                                                <input
                                                    type="file"
                                                    accept="audio/*,.mp3,.wav"
                                                    onChange={handleAudioFileChange}
                                                    className="hidden"
                                                />
                                                <span className="text-gray-500">选择音频文件</span>
                                            </label>
                                            {audioPreview && (
                                                <div className="mt-2 px-3 py-1.5 bg-orange-50 rounded-lg flex items-center gap-2 text-xs">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                                    <span className="text-orange-700 truncate">音频文件已选择</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </form>
        </div>
    );
};

export default I2VGenerator;
