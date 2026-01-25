import React, { useState, useEffect } from 'react';
import { Maximize, Upload, Settings2, Sparkles, X, Wand2, Hash, ChevronDown, ChevronUp } from 'lucide-react';
import { uploadFileSimple } from '../hooks/useFileUpload';

const ENHANCEMENT_MODELS = [
    {
        id: 'wanx2.1-imageedit',
        name: '万相2.1-图像增强',
        functions: [
            { id: 'expand', name: '扩图', description: '按比例扩展图像尺寸' },
            { id: 'super_resolution', name: '超分辨率', description: '提升图像清晰度和分辨率' },
            { id: 'colorization', name: '图像上色', description: '为黑白或灰度图像添加色彩' }
        ]
    },
    {
        id: 'image-out-painting',
        name: '图像扩展模型',
        description: '智能扩展图像边缘内容'
    }
];

const OUTPUT_RATIOS = [
    { value: '', label: '自动' },
    { value: '16:9', label: '16:9 (宽屏)' },
    { value: '9:16', label: '9:16 (竖屏)' },
    { value: '4:3', label: '4:3' },
    { value: '3:4', label: '3:4' },
    { value: '1:1', label: '1:1 (正方形)' }
];

export const ImageEnhancement = ({ onGenerate, isGenerating, apiKey }) => {
    const [uploading, setUploading] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [inputImage, setInputImage] = useState(null);
    const [inputImageUrl, setInputImageUrl] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [prompt, setPrompt] = useState('');
    const [selectedModel, setSelectedModel] = useState('wanx2.1-imageedit');
    const [selectedFunction, setSelectedFunction] = useState('expand');
    const [n, setN] = useState(1);
    const [watermark, setWatermark] = useState(false);
    const [seed, setSeed] = useState('');
    
    // image-out-painting 特有参数
    const [angle, setAngle] = useState(0);
    const [outputRatio, setOutputRatio] = useState('');
    const [xScale, setXScale] = useState(1.0);
    const [yScale, setYScale] = useState(1.0);
    const [topOffset, setTopOffset] = useState(0);
    const [bottomOffset, setBottomOffset] = useState(0);
    const [leftOffset, setLeftOffset] = useState(0);
    const [rightOffset, setRightOffset] = useState(0);
    const [bestQuality, setBestQuality] = useState(false);
    const [limitImageSize, setLimitImageSize] = useState(true);
    const [addWatermark, setAddWatermark] = useState(true);

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
        if (selectedModel === 'image-out-painting') {
            setSelectedFunction('');
        } else {
            setSelectedFunction('expand');
        }
    }, [selectedModel]);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setInputImage(URL.createObjectURL(file));
            
            try {
                setUploading(true);
                const url = await uploadFileSimple(file, apiKey, selectedModel);
                setInputImageUrl(url);
            } catch (error) {
                alert('图像上传失败: ' + error.message);
            } finally {
                setUploading(false);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!inputImageUrl) {
            alert('请上传输入图像');
            return;
        }

        let taskData;

        if (selectedModel === 'image-out-painting') {
            // image-out-painting 扩图模型
            taskData = {
                model: selectedModel,
                input: {
                    image_url: inputImageUrl
                },
                parameters: {
                    angle: angle,
                    output_ratio: outputRatio,
                    x_scale: parseFloat(xScale),
                    y_scale: parseFloat(yScale),
                    top_offset: parseInt(topOffset),
                    bottom_offset: parseInt(bottomOffset),
                    left_offset: parseInt(leftOffset),
                    right_offset: parseInt(rightOffset),
                    best_quality: bestQuality,
                    limit_image_size: limitImageSize,
                    add_watermark: addWatermark
                }
            };
        } else {
            // wanx2.1-imageedit 增强模型
            if ((selectedFunction === 'expand' || selectedFunction === 'colorization') && !prompt) {
                alert('请输入提示词');
                return;
            }

            taskData = {
                model: selectedModel,
                input: {
                    function: selectedFunction,
                    prompt: prompt || '图像处理',
                    base_image_url: inputImageUrl
                },
                parameters: {
                    n: n,
                    watermark: watermark,
                    ...(seed && { seed: parseInt(seed) })
                }
            };
        }

        if (onGenerate) {
            onGenerate(taskData, 'image-enhancement');
        }
    };

    const needsPrompt = selectedFunction === 'expand' || selectedFunction === 'colorization';

    return (
        <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* 提示词输入 */}
                {(selectedModel === 'wanx2.1-imageedit' && needsPrompt) && (
                    <div className="relative">
                        <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 mb-2">
                            <Wand2 size={14} className="text-violet-500" />
                            提示词
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={selectedFunction === 'expand' 
                                ? "描述扩展区域应该生成什么内容，例如：继续原场景" 
                                : "描述想要的配色风格，例如：温暖自然的色彩"}
                            className="w-full min-h-[100px] bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all resize-none"
                            required
                        />
                    </div>
                )}

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
                                {ENHANCEMENT_MODELS.map(model => (
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
                                    {ENHANCEMENT_MODELS[0].functions.map(func => (
                                        <option key={func.id} value={func.id}>
                                            {func.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {selectedModel === 'wanx2.1-imageedit' && (
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
                        )}
                    </div>

                    {/* 模型描述 */}
                    <p className="text-xs text-gray-400 leading-relaxed -mt-1">
                        {selectedModel === 'image-out-painting' 
                            ? '智能扩展图像边缘内容' 
                            : ENHANCEMENT_MODELS[0].functions.find(f => f.id === selectedFunction)?.description}
                    </p>

                {/* 图像上传区域 */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 whitespace-nowrap">
                            <Upload className="text-blue-600" size={14} />
                            输入图像
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
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
                    </div>
                </div>

                {/* 提示词（部分功能需要） */}
                {selectedModel === 'wanx2.1-imageedit' && needsPrompt && (
                    <div>
                        <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 mb-2">
                            <Wand2 size={14} className="text-violet-500" />
                            提示词
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={selectedFunction === 'expand' 
                                ? "描述扩展区域应该生成什么内容，例如：继续原场景" 
                                : "描述想要的配色风格，例如：温暖自然的色彩"}
                            className="w-full min-h-[100px] bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all resize-none"
                            required
                        />
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
                                <Maximize size={18} />
                                <span>开始增强</span>
                            </>
                        )}
                    </button>
                </div>

                {/* 高级设置 */}
                {showAdvanced && (
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border border-gray-200 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                {selectedModel === 'image-out-painting' ? (
                                    <>
                                        <div>
                                            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                                                输出比例
                                            </label>
                                            <select
                                                value={outputRatio}
                                                onChange={(e) => setOutputRatio(e.target.value)}
                                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 transition-all"
                                            >
                                                {OUTPUT_RATIOS.map(ratio => (
                                                    <option key={ratio.value} value={ratio.value}>
                                                        {ratio.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                                                    旋转角度 (度)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={angle}
                                                    onChange={(e) => setAngle(parseInt(e.target.value) || 0)}
                                                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                                                    X轴缩放
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={xScale}
                                                    onChange={(e) => setXScale(parseFloat(e.target.value) || 1.0)}
                                                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                                                    Y轴缩放
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={yScale}
                                                    onChange={(e) => setYScale(parseFloat(e.target.value) || 1.0)}
                                                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                                                    上边偏移 (px)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={topOffset}
                                                    onChange={(e) => setTopOffset(parseInt(e.target.value) || 0)}
                                                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                                                    下边偏移 (px)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={bottomOffset}
                                                    onChange={(e) => setBottomOffset(parseInt(e.target.value) || 0)}
                                                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                                                    左边偏移 (px)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={leftOffset}
                                                    onChange={(e) => setLeftOffset(parseInt(e.target.value) || 0)}
                                                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                                                右边偏移 (px)
                                            </label>
                                            <input
                                                type="number"
                                                value={rightOffset}
                                                onChange={(e) => setRightOffset(parseInt(e.target.value) || 0)}
                                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100"
                                            />
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <label className="flex items-center gap-2 text-sm text-gray-600">
                                                <input
                                                    type="checkbox"
                                                    checked={bestQuality}
                                                    onChange={(e) => setBestQuality(e.target.checked)}
                                                    className="rounded border-gray-300"
                                                />
                                                最佳质量
                                            </label>

                                            <label className="flex items-center gap-2 text-sm text-gray-600">
                                                <input
                                                    type="checkbox"
                                                    checked={limitImageSize}
                                                    onChange={(e) => setLimitImageSize(e.target.checked)}
                                                    className="rounded border-gray-300"
                                                />
                                                限制图像大小
                                            </label>

                                            <label className="flex items-center gap-2 text-sm text-gray-600">
                                                <input
                                                    type="checkbox"
                                                    checked={addWatermark}
                                                    onChange={(e) => setAddWatermark(e.target.checked)}
                                                    className="rounded border-gray-300"
                                                />
                                                添加水印
                                            </label>
                                        </div>
                                    </>
                                ) : (
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
