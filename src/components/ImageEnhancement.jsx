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

// 扩图比例选项
const EXPAND_RATIOS = [
    { value: '1:1', label: '1:1 → 保持比例扩展' },
    { value: '16:9', label: '16:9 → 横向扩展' },
    { value: '9:16', label: '9:16 → 纵向扩展' },
    { value: '4:3', label: '4:3 → 轻微横向' },
    { value: '3:4', label: '3:4 → 轻微纵向' }
];

// 超分倍数选项
const UPSCALE_FACTORS = [
    { value: 2, label: '2x (推荐)' },
    { value: 3, label: '3x' },
    { value: 4, label: '4x (最大)' }
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
    const [strength, setStrength] = useState(0.5);
    const [upscaleFactor, setUpscaleFactor] = useState(2);
    const [expandRatio, setExpandRatio] = useState('1:1');
    
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
                    strength: strength,
                    ...(selectedFunction === 'expand' && { output_ratio: expandRatio }),
                    ...(selectedFunction === 'super_resolution' && { upscale_factor: parseInt(upscaleFactor) }),
                    ...(seed && { seed: parseInt(seed) })
                }
            };
        }

        // 调试日志
        if (import.meta.env.DEV) {
            console.log('📷 图像增强参数:', {
                模型: selectedModel,
                功能: selectedFunction,
                参数: taskData.parameters
            });
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

                    {/* 功能特有参数 - 扩图比例 / 超分倍数 */}
                    {selectedModel === 'wanx2.1-imageedit' && selectedFunction === 'expand' && (
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-2">
                                <Maximize className="text-blue-500" size={14} />
                                输出图像比例
                            </label>
                            <div className="grid grid-cols-5 gap-2">
                                {EXPAND_RATIOS.map(ratio => (
                                    <button
                                        key={ratio.value}
                                        type="button"
                                        onClick={() => setExpandRatio(ratio.value)}
                                        className={`px-2 py-1.5 rounded text-xs font-medium transition-all ${
                                            expandRatio === ratio.value
                                                ? 'bg-blue-500 text-white shadow-sm'
                                                : 'bg-white text-gray-600 hover:bg-blue-100 border border-gray-200'
                                        }`}
                                    >
                                        {ratio.value}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-blue-600 mt-2">
                                当前: {expandRatio} → AI将扩展图像边缘使输出符合此比例
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                提示词描述扩展区域内容，如“继续原场景”“添加蓝天白云”
                            </p>
                        </div>
                    )}

                    {selectedModel === 'wanx2.1-imageedit' && selectedFunction === 'super_resolution' && (
                        <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-2">
                                <Sparkles className="text-green-500" size={14} />
                                超分倍数
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {UPSCALE_FACTORS.map(factor => (
                                    <button
                                        key={factor.value}
                                        type="button"
                                        onClick={() => setUpscaleFactor(factor.value)}
                                        className={`px-3 py-2 rounded text-sm font-medium transition-all ${
                                            upscaleFactor === factor.value
                                                ? 'bg-green-500 text-white shadow-sm'
                                                : 'bg-white text-gray-600 hover:bg-green-100 border border-gray-200'
                                        }`}
                                    >
                                        {factor.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

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
                                        {/* 参数优先级说明 */}
                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                                            <p className="font-medium mb-1">参数优先级（高→低）：</p>
                                            <p>1. 输出比例 → 2. 整体缩放 → 3. 方向偏移</p>
                                            <p className="text-amber-600 mt-1">高优先级参数会覆盖低优先级参数的效果</p>
                                        </div>

                                        {/* 方式一：按比例扩展 */}
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                            <h4 className="text-xs font-semibold text-blue-700 mb-2">方式一：按宽高比扩展（优先级最高）</h4>
                                            <p className="text-xs text-blue-600 mb-2">设置输出图像的目标宽高比，AI会自动扩展边缘内容</p>
                                            <select
                                                value={outputRatio}
                                                onChange={(e) => setOutputRatio(e.target.value)}
                                                className="w-full bg-white border border-blue-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all"
                                            >
                                                {OUTPUT_RATIOS.map(ratio => (
                                                    <option key={ratio.value} value={ratio.value}>
                                                        {ratio.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* 方式二：整体缩放扩展 */}
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                            <h4 className="text-xs font-semibold text-green-700 mb-2">方式二：整体缩放扩展</h4>
                                            <p className="text-xs text-green-600 mb-2">按倍数扩展画布，1.0=不变，2.0=扩展到2倍</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-xs font-medium text-green-700 mb-1 block">水平扩展倍数</label>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        min="1.0"
                                                        max="3.0"
                                                        value={xScale}
                                                        onChange={(e) => setXScale(parseFloat(e.target.value) || 1.0)}
                                                        className="w-full bg-white border border-green-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400 focus:ring-1 focus:ring-green-100"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-green-700 mb-1 block">垂直扩展倍数</label>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        min="1.0"
                                                        max="3.0"
                                                        value={yScale}
                                                        onChange={(e) => setYScale(parseFloat(e.target.value) || 1.0)}
                                                        className="w-full bg-white border border-green-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400 focus:ring-1 focus:ring-green-100"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* 方式三：方向偏移扩展 */}
                                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                            <h4 className="text-xs font-semibold text-purple-700 mb-2">方式三：方向偏移扩展（精确控制）</h4>
                                            <p className="text-xs text-purple-600 mb-2">在指定方向添加像素，0=不扩展</p>
                                            <div className="grid grid-cols-4 gap-2">
                                                <div>
                                                    <label className="text-xs font-medium text-purple-700 mb-1 block text-center">↑ 上</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={topOffset}
                                                        onChange={(e) => setTopOffset(parseInt(e.target.value) || 0)}
                                                        className="w-full bg-white border border-purple-300 rounded-lg px-2 py-1.5 text-sm text-center outline-none focus:border-purple-400"
                                                        placeholder="px"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-purple-700 mb-1 block text-center">↓ 下</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={bottomOffset}
                                                        onChange={(e) => setBottomOffset(parseInt(e.target.value) || 0)}
                                                        className="w-full bg-white border border-purple-300 rounded-lg px-2 py-1.5 text-sm text-center outline-none focus:border-purple-400"
                                                        placeholder="px"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-purple-700 mb-1 block text-center">← 左</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={leftOffset}
                                                        onChange={(e) => setLeftOffset(parseInt(e.target.value) || 0)}
                                                        className="w-full bg-white border border-purple-300 rounded-lg px-2 py-1.5 text-sm text-center outline-none focus:border-purple-400"
                                                        placeholder="px"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-purple-700 mb-1 block text-center">→ 右</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={rightOffset}
                                                        onChange={(e) => setRightOffset(parseInt(e.target.value) || 0)}
                                                        className="w-full bg-white border border-purple-300 rounded-lg px-2 py-1.5 text-sm text-center outline-none focus:border-purple-400"
                                                        placeholder="px"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* 其他选项 */}
                                        <div className="bg-gray-100 border border-gray-200 rounded-lg p-3">
                                            <h4 className="text-xs font-semibold text-gray-700 mb-2">其他选项</h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-xs font-medium text-gray-600 mb-1 block">旋转角度（扩展前先旋转）</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="359"
                                                        value={angle}
                                                        onChange={(e) => setAngle(parseInt(e.target.value) || 0)}
                                                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
                                                        placeholder="0-359度"
                                                    />
                                                </div>
                                                <div className="flex flex-col justify-end gap-1">
                                                    <label className="flex items-center gap-2 text-xs text-gray-600">
                                                        <input
                                                            type="checkbox"
                                                            checked={bestQuality}
                                                            onChange={(e) => setBestQuality(e.target.checked)}
                                                            className="rounded border-gray-300"
                                                        />
                                                        最佳质量（更慢但更清晰）
                                                    </label>
                                                    <label className="flex items-center gap-2 text-xs text-gray-600">
                                                        <input
                                                            type="checkbox"
                                                            checked={limitImageSize}
                                                            onChange={(e) => setLimitImageSize(e.target.checked)}
                                                            className="rounded border-gray-300"
                                                        />
                                                        限制输出大小（&lt;5MB）
                                                    </label>
                                                    <label className="flex items-center gap-2 text-xs text-gray-600">
                                                        <input
                                                            type="checkbox"
                                                            checked={addWatermark}
                                                            onChange={(e) => setAddWatermark(e.target.checked)}
                                                            className="rounded border-gray-300"
                                                        />
                                                        添加AI水印
                                                    </label>
                                                </div>
                                            </div>
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

                                        <div>
                                            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                                                处理强度 ({strength.toFixed(1)})
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

                                        {selectedModel === 'wanx2.1-imageedit' && selectedFunction === 'super_resolution' && (
                                            <div>
                                                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                                                    超分倍数
                                                </label>
                                                <select
                                                    value={upscaleFactor}
                                                    onChange={(e) => setUpscaleFactor(parseInt(e.target.value) || 2)}
                                                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 transition-all"
                                                >
                                                    <option value={2}>2x</option>
                                                    <option value={3}>3x</option>
                                                    <option value={4}>4x</option>
                                                </select>
                                            </div>
                                        )}
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
