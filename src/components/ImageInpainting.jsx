import React, { useState, useEffect } from 'react';
import { Eraser, Upload, Settings2, Sparkles, X, Wand2, Hash, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { uploadFileToTempServer } from '../utils/fileUpload';

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

export const ImageInpainting = ({ onGenerate, isGenerating }) => {
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
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target.result;
                if (isMask) {
                    setMaskImage(base64);
                } else {
                    setInputImage(base64);
                }
            };
            reader.readAsDataURL(file);
            
            try {
                const url = await uploadFileToTempServer(file);
                if (isMask) {
                    setMaskImageUrl(url);
                } else {
                    setInputImageUrl(url);
                }
            } catch (error) {
                alert('图像上传失败: ' + error.message);
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5">
                <form onSubmit={handleSubmit} className="space-y-3">
                    {/* 模型和功能选择 */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                                <Sparkles className="text-gray-500" size={12} />
                                模型
                            </label>
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 transition-all"
                            >
                                {INPAINTING_MODELS.map(model => (
                                    <option key={model.id} value={model.id}>
                                        {model.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedModel === 'wanx2.1-imageedit' && (
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                                    <Wand2 className="text-gray-500" size={12} />
                                    功能
                                </label>
                                <select
                                    value={selectedFunction}
                                    onChange={(e) => setSelectedFunction(e.target.value)}
                                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 transition-all"
                                >
                                    {INPAINTING_MODELS[0].functions.map(func => (
                                        <option key={func.id} value={func.id}>
                                            {func.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                                <Hash className="text-gray-500" size={12} />
                                数量
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="4"
                                value={n}
                                onChange={(e) => setN(parseInt(e.target.value) || 1)}
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 transition-all"
                            />
                        </div>
                    </div>

                    {/* 模型描述 */}
                    <p className="text-xs text-gray-400 leading-relaxed -mt-1">
                        {selectedModel === 'wanx-x-painting' 
                            ? '基于遮罩的局部图像重绘' 
                            : INPAINTING_MODELS[0].functions.find(f => f.id === selectedFunction)?.description}
                    </p>

                    {/* 图像上传区域 */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
                        <div className="flex items-center gap-3">
                            {/* 输入图像 */}
                            <div className="flex items-center gap-2">
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
                                            className="h-16 w-16 object-cover rounded-lg border-2 border-blue-200 cursor-pointer hover:border-blue-400 transition-colors"
                                            onClick={() => setPreviewImage(inputImage)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setInputImage(null);
                                                setInputImageUrl(null);
                                            }}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ) : (
                                    <label
                                        htmlFor="input-image-upload"
                                        className="h-16 w-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
                                    >
                                        <Upload className="text-gray-400" size={20} />
                                    </label>
                                )}
                            </div>

                            {/* 遮罩图像（需要时显示） */}
                            {needsMask && (
                                <div className="flex items-center gap-2">
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
                                                className="h-16 w-16 object-cover rounded-lg border-2 border-green-200 cursor-pointer hover:border-green-400 transition-colors"
                                                onClick={() => setPreviewImage(maskImage)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setMaskImage(null);
                                                    setMaskImageUrl(null);
                                                }}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ) : (
                                        <label
                                            htmlFor="mask-image-upload"
                                            className="h-16 w-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-all"
                                        >
                                            <Upload className="text-gray-400" size={20} />
                                        </label>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* 遮罩使用提示 */}
                        {needsMask && (
                            <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded p-2">
                                <strong>遮罩图像要求：</strong>白色区域为需要编辑的部分，黑色区域为保持不变的部分
                            </div>
                        )}
                    </div>

                    {/* 提示词 */}
                    <div>
                        <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                            <Wand2 className="text-gray-500" size={12} />
                            提示词
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={selectedFunction === 'remove_watermark' 
                                ? "描述要去除的内容，例如：去除图像中的文字" 
                                : "描述想要生成的内容，例如：一只陶瓷兔子抱着一朵陶瓷花"}
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 transition-all"
                            rows="3"
                            required
                        />
                    </div>

                    {/* 高级设置 */}
                    <div className="border-t border-gray-200 pt-3">
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-violet-600 transition-colors"
                        >
                            <Settings2 size={14} />
                            高级设置
                            {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        {showAdvanced && (
                            <div className="mt-3 space-y-3">
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
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 提交按钮 */}
                    <button
                        type="submit"
                        disabled={isGenerating}
                        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-3 rounded-lg font-medium hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    >
                        <Eraser size={18} />
                        {isGenerating ? '处理中...' : '开始修复'}
                    </button>
                </form>
            </div>

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
