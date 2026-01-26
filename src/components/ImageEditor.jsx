import React, { useState, useEffect } from 'react';
import { useTasks } from '../hooks/useTasks';
import { IMAGE_MODELS } from '../config/models';
import { uploadFileSimple } from '../hooks/useFileUpload';
import { Sparkles, Image as ImageIcon, Settings2, Upload, Wand2, Palette, ChevronDown, ChevronUp, Hash, ShieldCheck, X } from 'lucide-react';

// Filter models that support instruction-based image editing
const EDITING_MODELS = IMAGE_MODELS.filter(model => 
    model.id.startsWith('qwen-image-edit') || 
    model.id === 'wan2.6-image' || 
    model.id === 'wan2.5-i2i-preview' ||
    (model.id === 'wanx2.1-imageedit' && model.functions) // Only description_edit function
);

export const ImageEditor = ({ onGenerate, isGenerating, apiKey }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploading, setUploading] = useState({ input: false, ref: false, mask: false, styleRef: false });
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [inputImage, setInputImage] = useState(null);
    const [inputImageUrl, setInputImageUrl] = useState(null);
    const [referenceImages, setReferenceImages] = useState([]);
    const [referenceImageUrls, setReferenceImageUrls] = useState([]);
    const [previewImage, setPreviewImage] = useState(null); // 弹窗预览
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [selectedModel, setSelectedModel] = useState('qwen-image-edit-max');
    const [resolution, setResolution] = useState('1024*1024');
    const [enableInterleave, setEnableInterleave] = useState(false);
    const [maxImages, setMaxImages] = useState(1);
    const [promptExtend, setPromptExtend] = useState(true);
    const [watermark, setWatermark] = useState(false);
    const [seed, setSeed] = useState('');
    const [n, setN] = useState(1); // Output image count for qwen models
    const [maskImage, setMaskImage] = useState(null); // For image inpainting models
    const [maskImageUrl, setMaskImageUrl] = useState(null); // For image inpainting models
    const [style, setStyle] = useState('<auto>'); // For models that support style selection
    const [strength, setStrength] = useState(0.5); // For wanx2.1-imageedit strength control
    const [sketchWeight, setSketchWeight] = useState(10); // For sketch models
    const [sketchExtraction, setSketchExtraction] = useState(false); // For sketch models
    const [maskColor, setMaskColor] = useState([]); // For mask color specification
    const [sketchColor, setSketchColor] = useState([]); // For sketch color specification
    const [selectedFunction, setSelectedFunction] = useState('description_edit'); // For wanx2.1-imageedit model
    const [styleIndex, setStyleIndex] = useState(0); // For wanx-style-repaint-v1 model
    const [styleRefImage, setStyleRefImage] = useState(null); // For wanx-style-repaint-v1 model when style_index=-1
    const [styleRefImageUrl, setStyleRefImageUrl] = useState(null); // For wanx-style-repaint-v1 model when style_index=-1
    const [angle, setAngle] = useState(0); // For image-out-painting model
    const [outputRatio, setOutputRatio] = useState(''); // For image-out-painting model
    const [xScale, setXScale] = useState(1.0); // For image-out-painting model
    const [yScale, setYScale] = useState(1.0); // For image-out-painting model
    const [topOffset, setTopOffset] = useState(0); // For image-out-painting model
    const [bottomOffset, setBottomOffset] = useState(0); // For image-out-painting model
    const [leftOffset, setLeftOffset] = useState(0); // For image-out-painting model
    const [rightOffset, setRightOffset] = useState(0); // For image-out-painting model
    const [bestQuality, setBestQuality] = useState(false); // For image-out-painting model
    const [limitImageSize, setLimitImageSize] = useState(true); // For image-out-painting model
    const [addWatermark, setAddWatermark] = useState(true); // For image-out-painting model

    const { tasks, isGenerating: hookIsGenerating, runTask } = useTasks();

    // 获取当前模型的最大参考图数量
    const getMaxReferenceImages = () => {
        // 根据模型类型返回最大参考图数量
        if (selectedModel === 'wan2.6-image') {
            return 5; // wan2.6-image 支持多图输入
        } else if (selectedModel.startsWith('qwen-image-edit')) {
            return 4; // qwen 系列支持4张参考图
        } else if (selectedModel === 'wan2.5-i2i-preview') {
            return 3; // wan2.5 支持3张
        } else {
            return 1; // 其他模型默认1张
        }
    };

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

    // Update resolutions when model changes
    useEffect(() => {
        const model = IMAGE_MODELS.find(m => m.id === selectedModel);
        if (model && model.resolutions.length > 0) {
            setResolution(model.resolutions[0]);
        }
    }, [selectedModel]);

    const handleImageUpload = async (e, isReference = false, isMask = false) => {
        const file = e.target.files[0];
        if (file) {
            const maxRefImages = getMaxReferenceImages();
            
            // 检查参考图数量限制
            if (isReference && referenceImages.length >= maxRefImages) {
                alert(`当前模型最多支持 ${maxRefImages} 张参考图`);
                return;
            }
            
            // 设置本地预览
            const preview = URL.createObjectURL(file);
            if (isMask) {
                setMaskImage(preview);
            } else if (isReference) {
                setReferenceImages(prev => {
                    if (!prev.includes(preview)) {
                        return [...prev, preview];
                    }
                    return prev;
                });
            } else {
                setInputImage(preview);
            }
            
            // 上传到 OSS
            try {
                const uploadKey = isMask ? 'mask' : (isReference ? 'ref' : 'input');
                setUploading(prev => ({ ...prev, [uploadKey]: true }));
                
                const url = await uploadFileSimple(file, apiKey, selectedModel);
                if (isMask) {
                    setMaskImageUrl(url);
                } else if (isReference) {
                    setReferenceImageUrls(prev => {
                        if (!prev.includes(url)) {
                            return [...prev, url];
                        }
                        return prev;
                    });
                } else {
                    setInputImageUrl(url);
                }
            } catch (error) {
                alert('图像上传失败: ' + error.message);
            } finally {
                const uploadKey = isMask ? 'mask' : (isReference ? 'ref' : 'input');
                setUploading(prev => ({ ...prev, [uploadKey]: false }));
            }
        }
    };

    const removeReferenceImage = (index) => {
        setReferenceImages(prev => prev.filter((_, i) => i !== index));
        setReferenceImageUrls(prev => prev.filter((_, i) => i !== index));
    };

    const removeInputImage = () => {
        setInputImage(null);
        setInputImageUrl(null);
    };

    const removeMaskImage = () => {
        setMaskImage(null);
        setMaskImageUrl(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!inputImageUrl) {
            alert('请上传输入图像');
            return;
        }

        setIsSubmitting(true);
        const modelConfig = IMAGE_MODELS.find(m => m.id === selectedModel);
        
        let taskData;
        if (selectedModel === 'wanx2.1-imageedit') {
            // wanx2.1-imageedit simple instruction editing
            taskData = {
                model: selectedModel,
                input: {
                    function: 'description_edit',
                    prompt: prompt,
                    base_image_url: inputImageUrl
                },
                parameters: {
                    n: n,
                    watermark: watermark,
                    strength: strength,
                    ...(seed && { seed: parseInt(seed) })
                }
            };
        } else if (selectedModel === 'wan2.5-i2i-preview' || selectedModel === 'wan2.6-image') {
            // Wan系列图像编辑模型 - 使用 imageArraySynthesis 格式
            // API格式：input.prompt + input.images数组
            const images = [inputImageUrl, ...referenceImageUrls].filter(Boolean);
            
            taskData = {
                model: selectedModel,
                input: {
                    prompt: prompt,
                    images: images
                },
                parameters: {
                    n: Math.min(n, 4),  // wan系列最多4张
                    negative_prompt: negativePrompt,
                    size: resolution,
                    prompt_extend: promptExtend,
                    watermark: watermark,
                    ...(seed && { seed: parseInt(seed) })
                }
            };
        } else {
            // Qwen系列图像编辑模型 - 使用 multimodalMessages 格式
            // API格式：input.messages.content数组，图片在前、文本在后
            const contentArray = [];
            
            // 1. 先添加输入图像
            if (inputImageUrl) {
                contentArray.push({ image: inputImageUrl });
            }
            
            // 2. 再添加参考图像
            referenceImageUrls.forEach(imgUrl => {
                contentArray.push({ image: imgUrl });
            });
            
            // 3. 最后添加文本编辑指令（必须放在最后）
            contentArray.push({ text: prompt });
            
            taskData = {
                model: selectedModel,
                input: {
                    messages: [{
                        role: 'user',
                        content: contentArray
                    }]
                },
                parameters: {
                    n: Math.min(n, selectedModel === 'qwen-image-edit' ? 1 : 6),
                    negative_prompt: negativePrompt,
                    size: resolution,
                    prompt_extend: promptExtend,
                    watermark: watermark,
                    ...(seed && { seed: parseInt(seed) })
                }
            };

            // Add model-specific parameters
            if (modelConfig?.capabilities.enable_interleave && enableInterleave) {
                taskData.parameters.enable_interleave = true;
                taskData.parameters.max_images = maxImages;
            }

            if (modelConfig?.capabilities.style) {
                taskData.parameters.style = style;
            }
        }

        if (onGenerate) {
            try {
                await onGenerate(taskData, 'image-edit');
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const selectedModelConfig = EDITING_MODELS.find(m => m.id === selectedModel);

    return (
        <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">

                {/* Main Interaction Area */}
                <div className="space-y-4">
                    {/* Prompt Input */}
                    <div className="relative">
                        <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 mb-2">
                            <Sparkles size={14} className="text-violet-500" />
                            提示词
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="描述您期望的编辑效果…"
                            className="w-full min-h-[100px] bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all resize-none"
                            required
                        />
                    </div>

                    {/* Control Bar - Model, Resolution, Count in one row */}
                    <div className="grid grid-cols-3 gap-3">
                        {/* Model Selection */}
                        <div>
                            <label className="text-xs font-medium text-gray-600 mb-1.5 block">模型版本</label>
                            <div className="relative">
                                <select
                                    value={selectedModel}
                                    onChange={(e) => setSelectedModel(e.target.value)}
                                    className="w-full appearance-none bg-gradient-to-br from-white to-gray-50 border border-gray-200 pl-3 pr-10 py-3 rounded-xl text-sm font-semibold text-gray-800 outline-none hover:border-violet-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all cursor-pointer shadow-sm hover:shadow"
                                >
                                    {EDITING_MODELS.map(model => (
                                        <option key={model.id} value={model.id}>
                                            {model.name}
                                        </option>
                                    ))}
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
                                    {selectedModelConfig?.resolutions.map(res => (
                                        <option key={res} value={res}>{res}</option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Output Count - if supported */}
                        {selectedModelConfig?.capabilities.n ? (
                            <div>
                                <label className="text-xs font-medium text-gray-600 mb-1.5 block">数量</label>
                                <input
                                    type="number"
                                    min="1"
                                    max={selectedModel === 'qwen-image-edit' ? 1 : 6}
                                    value={n}
                                    onChange={(e) => setN(parseInt(e.target.value) || 1)}
                                    className="w-full bg-gradient-to-br from-white to-gray-50 border border-gray-200 px-3 py-3 rounded-xl text-sm font-semibold text-gray-800 outline-none hover:border-violet-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all shadow-sm hover:shadow"
                                />
                            </div>
                        ) : <div></div>}
                    </div>

                    {/* Image Upload Section - 横向一行布局 */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
                        {/* 输入图像 + 参考图像 - 同一行 */}
                        <div className="flex items-center gap-3">
                            {/* 输入图像 */}
                            <div className="flex items-center gap-2">
                                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 whitespace-nowrap">
                                    <ImageIcon className="text-blue-600" size={14} />
                                    输入图像
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, false)}
                                    className="hidden"
                                    id="input-image-upload"
                                    required
                                />
                                {inputImage ? (
                                    <div className="relative group">
                                        <img 
                                            src={inputImage} 
                                            alt="输入预览" 
                                            className="h-8 w-auto object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() => setPreviewImage(inputImage)}
                                        />
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); removeInputImage(); }}
                                            className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={10} />
                                        </button>
                                        {uploading.input && (
                                            <div className="absolute inset-0 bg-black/30 rounded flex items-center justify-center">
                                                <div className="animate-spin h-3 w-3 border-2 border-white/30 border-t-white rounded-full" />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <label 
                                        htmlFor="input-image-upload"
                                        className="h-8 px-3 flex items-center gap-2 border border-dashed border-gray-300 rounded bg-white hover:bg-gray-50 cursor-pointer transition-all"
                                    >
                                        <Upload className="text-gray-400" size={14} />
                                        <span className="text-xs text-gray-500">点击上传</span>
                                    </label>
                                )}
                            </div>

                            {/* 分隔线 */}
                            <div className="h-6 w-px bg-gray-300"></div>
                        
                            {/* 参考图像 */}
                            <div className="flex items-center gap-2 flex-1">
                                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 whitespace-nowrap">
                                    <Palette className="text-green-600" size={14} />
                                    参考图像
                                    <span className="text-xs text-gray-400 font-normal">({referenceImages.length}/{getMaxReferenceImages()})</span>
                                </label>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, true)}
                                        className="hidden"
                                        id="reference-image-upload"
                                    />
                                    {referenceImages.map((img, index) => (
                                        <div key={index} className="relative group">
                                            <img 
                                                src={img} 
                                                alt={`参考${index + 1}`} 
                                                className="h-8 w-auto object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => setPreviewImage(img)}
                                            />
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); removeReferenceImage(index); }}
                                                className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={10} />
                                            </button>
                                        </div>
                                    ))}
                                    {referenceImages.length < getMaxReferenceImages() && (
                                        <label 
                                            htmlFor="reference-image-upload"
                                            className="h-8 px-3 flex items-center gap-2 border border-dashed border-gray-300 rounded bg-white hover:bg-gray-50 cursor-pointer transition-all"
                                        >
                                            <Upload className="text-gray-400" size={14} />
                                            <span className="text-xs text-gray-500">点击上传</span>
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mask Image - 特定模型才显示 */}
                    {selectedModel === 'wanx-x-painting' && (
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-2">
                                <Palette className="text-gray-500" size={14} />
                                遮罩图像
                            </label>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, false, true)}
                                    className="hidden"
                                    id="mask-image-upload"
                                />
                                <label 
                                    htmlFor="mask-image-upload"
                                    className="flex flex-col items-center justify-center w-full h-24 border border-dashed border-gray-300 rounded-lg bg-white hover:bg-gray-50 cursor-pointer transition-all group"
                                >
                                    {maskImage ? (
                                        <img 
                                            src={maskImage} 
                                            alt="遮罩预览" 
                                            className="max-h-20 rounded-md"
                                        />
                                    ) : (
                                        <>
                                            <Upload className="text-gray-400 group-hover:text-gray-600 transition-colors mb-1" size={20} />
                                            <span className="text-xs text-gray-500 group-hover:text-gray-700">点击上传</span>
                                        </>
                                    )}
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons - 高级设置和生成按钮 */}
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
                        disabled={isSubmitting}
                        className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                                <span>编辑中...</span>
                            </>
                        ) : (
                            <>
                                <Wand2 size={18} />
                                <span>开始编辑</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Advanced Settings Panel */}
                {showAdvanced && (
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Negative Prompt */}
                            {selectedModelConfig?.capabilities.negative_prompt && (
                                <div className="md:col-span-2">
                                    <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-1.5">
                                        <ShieldCheck size={13} className="text-red-500" />
                                        反向提示词
                                    </label>
                                    <textarea
                                        value={negativePrompt}
                                        onChange={(e) => setNegativePrompt(e.target.value)}
                                        placeholder="不希望出现的内容…"
                                        className="w-full h-20 bg-white border border-gray-200 rounded-lg p-3 text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all resize-none"
                                    />
                                </div>
                            )}

                            {/* Seed - 已移到高级设置 */}
                            {selectedModelConfig?.capabilities.seed && (
                                <div>
                                    <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-1.5">
                                        <Hash size={13} className="text-blue-500" />
                                        随机种子
                                    </label>
                                    <input
                                        type="number"
                                        value={seed}
                                        onChange={(e) => setSeed(e.target.value)}
                                        placeholder="输入数字固定结果"
                                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
                                    />
                                </div>
                            )}
                            
                            {/* Strength for wanx2.1-imageedit */}
                            {selectedModel === 'wanx2.1-imageedit' && (
                                <div>
                                    <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-1.5">
                                        编辑强度 ({strength.toFixed(1)})
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={strength}
                                        onChange={(e) => setStrength(parseFloat(e.target.value))}
                                        className="w-full"
                                    />
                                </div>
                            )}
                            
                            {/* Interleave Mode */}
                            {selectedModelConfig?.capabilities.enable_interleave && (
                                <div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={enableInterleave}
                                            onChange={(e) => setEnableInterleave(e.target.checked)}
                                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                        />
                                        <span className="text-xs text-gray-700">启用图文混排输出</span>
                                    </label>
                                    {enableInterleave && (
                                        <input
                                            type="number"
                                            min="1"
                                            max="5"
                                            value={maxImages}
                                            onChange={(e) => setMaxImages(parseInt(e.target.value))}
                                            placeholder="最大图像数"
                                            className="mt-2 w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
                                        />
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Toggle Options */}
                        <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-200">
                            {selectedModelConfig?.capabilities.prompt_extend && (
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={promptExtend}
                                        onChange={(e) => setPromptExtend(e.target.checked)}
                                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                    />
                                    <span className="text-xs text-gray-700">智能改写提示词</span>
                                </label>
                            )}
                            {selectedModelConfig?.capabilities.watermark && (
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={watermark}
                                        onChange={(e) => setWatermark(e.target.checked)}
                                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                    />
                                    <span className="text-xs text-gray-700">添加水印</span>
                                </label>
                            )}
                        </div>
                    </div>
                )}

                {/* 特殊模型功能 */}
                {showAdvanced && (selectedModel === 'wanx-x-painting' || selectedModel === 'wanx-sketch-to-image-lite' || selectedModel === 'wanx-style-repaint-v1' || selectedModel === 'image-out-painting') && (
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 space-y-4">
                        <h4 className="text-sm font-semibold text-gray-700">特殊功能参数</h4>
                        
                        {selectedModel === 'wanx-x-painting' && (
                            <>
                                {/* 局部重绘 - 掩码图像上传 */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium">掩码图像 (局部重绘区域)</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, false, true)}
                                        className="w-full p-2 border rounded-md"
                                    />
                                    {maskImage && (
                                        <div className="mt-2">
                                            <img 
                                                src={maskImage} 
                                                alt="掩码预览" 
                                                className="max-w-xs h-auto rounded-md border-2 border-blue-500"
                                            />
                                        </div>
                                    )}
                                </div>
                                
                                {/* 风格选择 */}
                                <div>
                                    <label className="block text-sm font-medium">输出风格</label>
                                    <select
                                        value={style}
                                        onChange={(e) => setStyle(e.target.value)}
                                        className="w-full p-2 border rounded-md"
                                    >
                                        <option value="<auto>">智能匹配</option>
                                        <option value="<3d cartoon>">3D卡通</option>
                                        <option value="<anime>">动画</option>
                                        <option value="<oil painting>">油画</option>
                                        <option value="<watercolor>">水彩</option>
                                        <option value="<sketch>">素描</option>
                                        <option value="<chinese painting>">中国画</option>
                                        <option value="<flat illustration>">扁平插画</option>
                                    </select>
                                </div>
                                
                                {/* 掩码颜色 */}
                                <div>
                                    <label className="block text-sm font-medium">掩码颜色 (RGB数组, 如 [[0,0,0]])</label>
                                    <input
                                        type="text"
                                        value={JSON.stringify(maskColor)}
                                        onChange={(e) => {
                                            try {
                                                const parsed = JSON.parse(e.target.value);
                                                setMaskColor(Array.isArray(parsed) ? parsed : []);
                                            } catch {
                                                // 如果解析失败，保持原值
                                            }
                                        }}
                                        placeholder="例如: [[0,0,0]] 或 [[0,0,0],[134,134,134]]"
                                        className="w-full p-2 border rounded-md"
                                    />
                                </div>
                            </>
                        )}
                        
                        {selectedModel === 'wanx-sketch-to-image-lite' && (
                            <>
                                {/* 风格选择 */}
                                <div>
                                    <label className="block text-sm font-medium">输出风格</label>
                                    <select
                                        value={style}
                                        onChange={(e) => setStyle(e.target.value)}
                                        className="w-full p-2 border rounded-md"
                                    >
                                        <option value="<auto>">智能匹配</option>
                                        <option value="<3d cartoon>">3D卡通</option>
                                        <option value="<anime>">动漫</option>
                                        <option value="<oil painting>">油画</option>
                                        <option value="<watercolor>">水彩</option>
                                        <option value="<sketch>">素描</option>
                                        <option value="<chinese painting>">中国画</option>
                                        <option value="<flat illustration>">扁平插画</option>
                                    </select>
                                </div>
                                
                                {/* 草图权重 */}
                                <div>
                                    <label className="block text-sm font-medium">草图权重 (0-10)</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="10"
                                        value={sketchWeight}
                                        onChange={(e) => setSketchWeight(parseInt(e.target.value))}
                                        className="w-full"
                                    />
                                    <div className="text-sm text-gray-600">{sketchWeight} (数值越大表示输出图像跟输入草图越相似)</div>
                                </div>
                                
                                {/* 草图提取 */}
                                <div>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={sketchExtraction}
                                            onChange={(e) => setSketchExtraction(e.target.checked)}
                                            className="rounded"
                                        />
                                        <span className="text-sm">启用草图提取 (当上传的不是线稿时)</span>
                                    </label>
                                </div>
                                
                                {/* 草图颜色 */}
                                <div>
                                    <label className="block text-sm font-medium">草图颜色 (RGB数组, 如 [[134,134,134],[0,0,0]])</label>
                                    <input
                                        type="text"
                                        value={JSON.stringify(sketchColor)}
                                        onChange={(e) => {
                                            try {
                                                const parsed = JSON.parse(e.target.value);
                                                setSketchColor(Array.isArray(parsed) ? parsed : []);
                                            } catch {
                                                // 如果解析失败，保持原值
                                            }
                                        }}
                                        placeholder="例如: [[134,134,134],[0,0,0]]"
                                        className="w-full p-2 border rounded-md"
                                    />
                                </div>
                            </>
                        )}

                        {selectedModel === 'wanx-style-repaint-v1' && (
                            <>
                                {/* 风格选择 */}
                                <div>
                                    <label className="block text-sm font-medium">人像风格</label>
                                    <select
                                        value={styleIndex}
                                        onChange={(e) => setStyleIndex(parseInt(e.target.value))}
                                        className="w-full p-2 border rounded-md"
                                    >
                                        <option value="-1">使用参考图像风格</option>
                                        <option value="0">复古漫画</option>
                                        <option value="1">3D童话</option>
                                        <option value="2">二次元</option>
                                        <option value="3">小清新</option>
                                        <option value="4">未来科技</option>
                                        <option value="5">国画古风</option>
                                        <option value="6">将军百战</option>
                                        <option value="7">炫彩卡通</option>
                                        <option value="8">清雅国风</option>
                                        <option value="9">喜迎新年</option>
                                        <option value="14">国风工笔</option>
                                        <option value="15">恭贺新禧</option>
                                        <option value="30">童话世界</option>
                                        <option value="31">黏土世界</option>
                                        <option value="32">像素世界</option>
                                        <option value="33">冒险世界</option>
                                        <option value="34">日漫世界</option>
                                        <option value="35">3D世界</option>
                                        <option value="36">二次元世界</option>
                                        <option value="37">手绘世界</option>
                                        <option value="38">蜡笔世界</option>
                                        <option value="39">冰箱贴世界</option>
                                        <option value="40">吧唧世界</option>
                                    </select>
                                </div>

                                {/* 风格参考图像上传 - 仅当选择使用参考图像风格时显示 */}
                                {styleIndex === -1 && (
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium">风格参考图像 (用于自定义风格)</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    // 设置本地预览
                                                    setStyleRefImage(URL.createObjectURL(file));
                                                    
                                                    // 上传到 OSS
                                                    try {
                                                        setUploading(prev => ({ ...prev, styleRef: true }));
                                                        const url = await uploadFileSimple(file, apiKey, selectedModel);
                                                        setStyleRefImageUrl(url);
                                                    } catch (error) {
                                                        alert('风格参考图像上传失败: ' + error.message);
                                                    } finally {
                                                        setUploading(prev => ({ ...prev, styleRef: false }));
                                                    }
                                                }
                                            }}
                                            className="w-full p-2 border rounded-md"
                                        />
                                        {styleRefImage && (
                                            <div className="mt-2 relative inline-block">
                                                <img 
                                                    src={styleRefImage} 
                                                    alt="风格参考预览" 
                                                    className="max-w-xs h-auto rounded-md border-2 border-green-500"
                                                />
                                                {uploading.styleRef && (
                                                    <div className="absolute inset-0 bg-black/30 rounded-md flex items-center justify-center">
                                                        <div className="animate-spin h-6 w-6 border-2 border-white/30 border-t-white rounded-full" />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}

                        {selectedModel === 'image-out-painting' && (
                            <div className="space-y-4">
                                {/* 旋转角度 */}
                                <div>
                                    <label className="block text-sm font-medium">旋转角度 (0-359度)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="359"
                                        value={angle}
                                        onChange={(e) => setAngle(parseInt(e.target.value) || 0)}
                                        className="w-full p-2 border rounded-md"
                                    />
                                    <div className="text-xs text-gray-500 mt-1">逆时针旋转角度，0表示不旋转</div>
                                </div>

                                {/* 输出宽高比 */}
                                <div>
                                    <label className="block text-sm font-medium">输出宽高比</label>
                                    <select
                                        value={outputRatio}
                                        onChange={(e) => setOutputRatio(e.target.value)}
                                        className="w-full p-2 border rounded-md"
                                    >
                                        <option value="">不设置宽高比 (保持原图比例)</option>
                                        <option value="1:1">1:1 (正方形)</option>
                                        <option value="3:4">3:4 (竖直矩形)</option>
                                        <option value="4:3">4:3 (水平矩形)</option>
                                        <option value="9:16">9:16 (手机屏幕)</option>
                                        <option value="16:9">16:9 (宽屏)</option>
                                    </select>
                                </div>

                                {/* 比例扩展 */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium">水平扩展比例 (1.0-3.0)</label>
                                        <input
                                            type="number"
                                            min="1.0"
                                            max="3.0"
                                            step="0.1"
                                            value={xScale}
                                            onChange={(e) => setXScale(parseFloat(e.target.value) || 1.0)}
                                            className="w-full p-2 border rounded-md"
                                        />
                                        <div className="text-xs text-gray-500 mt-1">1.0表示不扩展，2.0表示扩展到2倍宽度</div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium">垂直扩展比例 (1.0-3.0)</label>
                                        <input
                                            type="number"
                                            min="1.0"
                                            max="3.0"
                                            step="0.1"
                                            value={yScale}
                                            onChange={(e) => setYScale(parseFloat(e.target.value) || 1.0)}
                                            className="w-full p-2 border rounded-md"
                                        />
                                        <div className="text-xs text-gray-500 mt-1">1.0表示不扩展，2.0表示扩展到2倍高度</div>
                                    </div>
                                </div>

                                {/* 方向偏移扩展 */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium">方向偏移扩展 (像素)</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        <div>
                                            <label className="text-xs block">上</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={topOffset}
                                                onChange={(e) => setTopOffset(parseInt(e.target.value) || 0)}
                                                className="w-full p-1 border rounded text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs block">下</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={bottomOffset}
                                                onChange={(e) => setBottomOffset(parseInt(e.target.value) || 0)}
                                                className="w-full p-1 border rounded text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs block">左</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={leftOffset}
                                                onChange={(e) => setLeftOffset(parseInt(e.target.value) || 0)}
                                                className="w-full p-1 border rounded text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs block">右</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={rightOffset}
                                                onChange={(e) => setRightOffset(parseInt(e.target.value) || 0)}
                                                className="w-full p-1 border rounded text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-500">在指定方向添加像素进行扩展</div>
                                </div>

                                {/* 质量选项 */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={bestQuality}
                                                onChange={(e) => setBestQuality(e.target.checked)}
                                                className="rounded"
                                            />
                                            <span className="text-sm">开启最佳质量模式</span>
                                        </label>
                                        <div className="text-xs text-gray-500">提高图像细节，但处理时间会增加</div>
                                    </div>
                                    <div>
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={limitImageSize}
                                                onChange={(e) => setLimitImageSize(e.target.checked)}
                                                className="rounded"
                                            />
                                            <span className="text-sm">限制图像文件大小</span>
                                        </label>
                                        <div className="text-xs text-gray-500">确保输出图像小于5MB</div>
                                    </div>
                                </div>

                                {/* 水印选项 */}
                                <div>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={addWatermark}
                                            onChange={(e) => setAddWatermark(e.target.checked)}
                                            className="rounded"
                                        />
                                        <span className="text-sm">添加Generated by AI水印</span>
                                    </label>
                                    <div className="text-xs text-gray-500">在输出图像左下角添加水印</div>
                                </div>

                                <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800">
                                    <strong>参数优先级：</strong><br/>
                                    1. 按宽高比扩展 (output_ratio)<br/>
                                    2. 按比例扩展 (x_scale, y_scale)<br/>
                                    3. 方向偏移扩展 (top_offset等)<br/>
                                    先旋转 → 再扩展，优先级高的参数会覆盖低优先级参数
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

export default ImageEditor;
