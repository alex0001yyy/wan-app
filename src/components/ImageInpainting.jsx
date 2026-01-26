import React, { useState, useEffect } from 'react';
import { Eraser, Upload, Settings2, Sparkles, X, Wand2, Hash, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { uploadFileSimple } from '../hooks/useFileUpload';

const INPAINTING_MODELS = [
    {
        id: 'wanx2.1-imageedit',
        name: '万相2.1-图像修复',
        functions: [
            { id: 'description_edit_with_mask', name: '局部重绘', description: '指定区域进行内容编辑' },
            { id: 'remove_watermark', name: '去水印', description: '移除图片中的文字水印' }
        ]
    },
    {
        id: 'wanx-x-painting',
        name: '局部重绘模型',
        description: '基于遮罩的局部图像重绘'
    }
];

const MASK_COLORS = [
    { value: '255,255,255', label: '白色遮罩' },
    { value: '255,0,0', label: '红色遮罩' },
    { value: '0,255,0', label: '绿色遮罩' },
    { value: '0,0,255', label: '蓝色遮罩' }
];

const STYLES = [
    { value: '<auto>', label: '自动' },
    { value: '<3d cartoon>', label: '3D卡通' },
    { value: '<anime>', label: '动漫' },
    { value: '<oil painting>', label: '油画' },
    { value: '<watercolor>', label: '水彩' },
    { value: '<sketch>', label: '素描' }
];

export const ImageInpainting = ({ onGenerate, isGenerating, apiKey }) => {
    const [uploading, setUploading] = useState({ input: false, mask: false });
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [inputImage, setInputImage] = useState(null);
    const [inputImageUrl, setInputImageUrl] = useState(null);
    const [maskImage, setMaskImage] = useState(null);
    const [maskImageUrl, setMaskImageUrl] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [prompt, setPrompt] = useState('');
    const [selectedModel, setSelectedModel] = useState('wanx2.1-imageedit');
    const [selectedFunction, setSelectedFunction] = useState('description_edit_with_mask');
    const [style, setStyle] = useState('<auto>');
    const [maskColor, setMaskColor] = useState('255,255,255');
    const [resolution, setResolution] = useState('1024*1024');
    const [n, setN] = useState(1);
    const [watermark, setWatermark] = useState(false);
    const [seed, setSeed] = useState('');
    const [strength, setStrength] = useState(0.5);

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

    // 切换模型时重置功能选择
    useEffect(() => {
        if (selectedModel === 'wanx-x-painting') {
            setSelectedFunction('');
        } else {
            setSelectedFunction('description_edit_with_mask');
        }
    }, [selectedModel]);

    const handleImageUpload = async (e, isMask = false) => {
        const file = e.target.files[0];
        if (file) {
            const preview = URL.createObjectURL(file);
            if (isMask) {
                setMaskImage(preview);
            } else {
                setInputImage(preview);
            }
            
            try {
                const uploadKey = isMask ? 'mask' : 'input';
                setUploading(prev => ({ ...prev, [uploadKey]: true }));
                const url = await uploadFileSimple(file, apiKey, selectedModel);
                if (isMask) {
                    setMaskImageUrl(url);
                } else {
                    setInputImageUrl(url);
                }
            } catch (error) {
                alert('图像上传失败: ' + error.message);
            } finally {
                const uploadKey = isMask ? 'mask' : 'input';
                setUploading(prev => ({ ...prev, [uploadKey]: false }));
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!inputImageUrl) {
            alert('请上传输入图像');
            return;
        }

        if (!prompt) {
            alert('请输入提示词');
            return;
        }

        let taskData;

        if (selectedModel === 'wanx-x-painting') {
            // wanx-x-painting 局部重绘模型
            if (!maskImageUrl) {
                alert('局部重绘需要上传遮罩图像');
                return;
            }

            taskData = {
                model: selectedModel,
                input: {
                    messages: [{
                        role: 'user',
                        content: [
                            { text: prompt },
                            { image_url: inputImageUrl },
                            { image_url: maskImageUrl }
                        ]
                    }]
                },
                parameters: {
                    size: resolution,
                    n: n,
                    style: style,
                    mask_color: maskColor.split(',').map(v => parseInt(v.trim()))
                }
            };
        } else {
            // wanx2.1-imageedit 修复模型
            if (selectedFunction === 'description_edit_with_mask' && !maskImageUrl) {
                alert('局部重绘需要上传遮罩图像');
                return;
            }

            taskData = {
                model: selectedModel,
                input: {
                    function: selectedFunction,
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

            // 添加遮罩图像（局部重绘功能需要）
            if (selectedFunction === 'description_edit_with_mask' && maskImageUrl) {
                taskData.input.mask_image_url = maskImageUrl;
            }
        }

        if (onGenerate) {
            onGenerate(taskData, 'image-inpainting');
        }
    };

    const needsMask = selectedModel === 'wanx-x-painting' || selectedFunction === 'description_edit_with_mask';

    return (
        <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* 提示词输入 */}
                <div className="relative">
                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 mb-2">
                        <Wand2 size={14} className="text-violet-500" />
                        提示词
                    </label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={selectedFunction === 'remove_watermark' 
                            ? "描述要去除的内容，例如：去除图像中的文字" 
                            : "描述想要生成的内容，例如：一只陶瓷兔子抱着一朵陶瓷花"}
                        className="w-full min-h-[100px] bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all resize-none"
                        required
                    />
                </div>

                {/* 模型和功能选择 */}
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="text-xs font-medium text-gray-600 mb-1.5 block">模型版本</label>
                        <div className="relative">
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="w-full appearance-none bg-gradient-to-br from-white to-gray-50 border border-gray-200 pl-3 pr-10 py-3 rounded-xl text-sm font-semibold text-gray-800 outline-none hover:border-violet-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all cursor-pointer shadow-sm hover:shadow"
                            >
                                {INPAINTING_MODELS.map(model => (
                                    <option key={model.id} value={model.id}>
                                        {model.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {selectedModel === 'wanx2.1-imageedit' && (
                        <div>
                            <label className="text-xs font-medium text-gray-600 mb-1.5 block">功能</label>
                            <div className="relative">
                                <select
                                    value={selectedFunction}
                                    onChange={(e) => setSelectedFunction(e.target.value)}
                                    className="w-full appearance-none bg-gradient-to-br from-white to-gray-50 border border-gray-200 pl-3 pr-10 py-3 rounded-xl text-sm font-semibold text-gray-800 outline-none hover:border-violet-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all cursor-pointer shadow-sm hover:shadow"
                                >
                                    {INPAINTING_MODELS[0].functions.map(func => (
                                        <option key={func.id} value={func.id}>
                                            {func.name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="text-xs font-medium text-gray-600 mb-1.5 block">数量</label>
                        <input
                            type="number"
                            min="1"
                            max="4"
                            value={n}
                            onChange={(e) => setN(parseInt(e.target.value) || 1)}
                            className="w-full bg-gradient-to-br from-white to-gray-50 border border-gray-200 px-3 py-3 rounded-xl text-sm font-semibold text-gray-800 outline-none hover:border-violet-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all shadow-sm hover:shadow"
                        />
                    </div>
                </div>

                {/* 图像上传区域 */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* 输入图像 */}
                        <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 whitespace-nowrap">
                            <Upload className="text-blue-600" size={14} />
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
                                    alt="输入图像"
                                    className="h-8 w-auto object-cover rounded cursor-pointer"
                                    onClick={() => setPreviewImage(inputImage)}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setInputImage(null);
                                        setInputImageUrl(null);
                                    }}
                                    className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    ✕
                                </button>
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

                        {/* 遮罩图像（需要时显示） */}
                        {needsMask && (
                            <>
                                <div className="h-6 w-px bg-gray-300"></div>
                                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 whitespace-nowrap">
                                    <Eraser className="text-green-600" size={14} />
                                    遮罩图像
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, true)}
                                    className="hidden"
                                    id="mask-image-upload"
                                />
                                {maskImage ? (
                                    <div className="relative group">
                                        <img
                                            src={maskImage}
                                            alt="遮罩图像"
                                            className="h-8 w-auto object-cover rounded cursor-pointer"
                                            onClick={() => setPreviewImage(maskImage)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMaskImage(null);
                                                setMaskImageUrl(null);
                                            }}
                                            className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ) : (
                                    <label
                                        htmlFor="mask-image-upload"
                                        className="h-8 px-3 flex items-center gap-2 border border-dashed border-gray-300 rounded bg-white hover:bg-gray-50 cursor-pointer transition-all"
                                    >
                                        <Upload className="text-gray-400" size={14} />
                                        <span className="text-xs text-gray-500">点击上传</span>
                                    </label>
                                )}
                            </>
                        )}
                    </div>

                    {/* 遮罩使用提示 */}
                    {needsMask && (
                        <div className="mt-2 text-xs text-gray-500">
                            <strong>遮罩图像要求：</strong>白色区域为需要编辑的部分，黑色区域为保持不变的部分
                        </div>
                    )}
                </div>

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
                        disabled={isGenerating}
                        className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold py-2.5 px-6 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-violet-500/30"
                    >
                        {isGenerating ? (
                            <>
                                <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                                <span>处理中...</span>
                            </>
                        ) : (
                            <>
                                <Eraser size={18} />
                                <span>开始修复</span>
                            </>
                        )}
                    </button>
                </div>

                {/* 高级设置 */}
                {showAdvanced && (
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border border-gray-200 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                {selectedModel === 'wanx-x-painting' && (
                                    <>
                                        <div>
                                            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                                                <Settings2 className="text-gray-500" size={12} />
                                                风格
                                            </label>
                                            <select
                                                value={style}
                                                onChange={(e) => setStyle(e.target.value)}
                                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 transition-all"
                                            >
                                                {STYLES.map(s => (
                                                    <option key={s.value} value={s.value}>
                                                        {s.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                                                <Eraser className="text-gray-500" size={12} />
                                                遮罩颜色
                                            </label>
                                            <select
                                                value={maskColor}
                                                onChange={(e) => setMaskColor(e.target.value)}
                                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 transition-all"
                                            >
                                                {MASK_COLORS.map(color => (
                                                    <option key={color.value} value={color.value}>
                                                        {color.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}

                                {selectedModel === 'wanx2.1-imageedit' && (
                                    <>
                                        <div className="flex items-center gap-3">
                                            <label className="flex items-center gap-2 text-sm text-gray-600">
                                                <input
                                                    type="checkbox"
                                                    checked={watermark}
                                                    onChange={(e) => setWatermark(e.target.checked)}
                                                    className="rounded border-gray-300"
                                                />
                                                添加水印
                                            </label>
                                        </div>

                                        <div>
                                            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                                                随机种子
                                            </label>
                                            <input
                                                type="number"
                                                value={seed}
                                                onChange={(e) => setSeed(e.target.value)}
                                                placeholder="留空则随机生成"
                                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
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
                                    </>
                                )}
                    </div>
                )}
            </form>

            {/* 图片预览弹窗 */}
            {previewImage && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="media-viewer-container relative" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={previewImage}
                            alt="预览"
                            className="rounded-lg shadow-2xl select-none"
                        />
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-4 right-4 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 transition-all"
                        >
                            <X className="text-gray-800" size={20} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
