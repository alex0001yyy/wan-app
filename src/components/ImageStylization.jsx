import React, { useState, useEffect } from 'react';
import { Palette, Upload, Settings2, Sparkles, X, Wand2, Hash, ChevronDown, ChevronUp } from 'lucide-react';
import { uploadFileToTempServer } from '../utils/fileUpload';

const STYLIZATION_MODELS = [
    {
        id: 'wanx2.1-imageedit',
        name: '万相2.1-图像风格化',
        functions: [
            { id: 'stylization_all', name: '全局风格化', description: '转换整张图片的风格' },
            { id: 'stylization_local', name: '局部风格化', description: '转换图片局部区域的风格' }
        ]
    },
    {
        id: 'wanx-style-repaint-v1',
        name: '人像风格重绘',
        description: '为人像照片应用各种风格效果'
    }
];

const STYLE_OPTIONS = {
    'stylization_all': [
        { value: '<auto>', label: '自动' },
        { value: 'french_picture_book', label: '法国绘本风格' },
        { value: 'surrealism', label: '超现实主义' }
    ],
    'stylization_local': [
        { value: '<auto>', label: '自动' },
        { value: 'wood_board', label: '木板风格' },
        { value: 'metal', label: '金属风格' },
        { value: 'glass', label: '玻璃风格' },
        { value: 'ceramic', label: '陶瓷风格' },
        { value: 'cloth', label: '布料风格' },
        { value: 'fur', label: '毛皮风格' },
        { value: 'stone', label: '石头风格' },
        { value: 'plastic', label: '塑料风格' }
    ]
};

const PORTRAIT_STYLES = [
    { index: 0, name: '风格0', description: '自然人像' },
    { index: 1, name: '风格1', description: '艺术风格1' },
    { index: 2, name: '风格2', description: '艺术风格2' },
    { index: 3, name: '风格3', description: '艺术风格3' },
    { index: 4, name: '风格4', description: '艺术风格4' },
    { index: -1, name: '自定义风格', description: '使用参考图片的风格' }
];

export const ImageStylization = ({ onGenerate, isGenerating }) => {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [inputImage, setInputImage] = useState(null);
    const [inputImageUrl, setInputImageUrl] = useState(null);
    const [styleRefImage, setStyleRefImage] = useState(null);
    const [styleRefImageUrl, setStyleRefImageUrl] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [prompt, setPrompt] = useState('');
    const [selectedModel, setSelectedModel] = useState('wanx2.1-imageedit');
    const [selectedFunction, setSelectedFunction] = useState('stylization_all');
    const [style, setStyle] = useState('<auto>');
    const [styleIndex, setStyleIndex] = useState(0);
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
        if (selectedModel === 'wanx-style-repaint-v1') {
            setSelectedFunction('');
        } else {
            setSelectedFunction('stylization_all');
        }
    }, [selectedModel]);

    const handleImageUpload = async (e, isStyleRef = false) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target.result;
                if (isStyleRef) {
                    setStyleRefImage(base64);
                } else {
                    setInputImage(base64);
                }
            };
            reader.readAsDataURL(file);
            
            try {
                const url = await uploadFileToTempServer(file);
                if (isStyleRef) {
                    setStyleRefImageUrl(url);
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
            alert('请输入提示词描述风格效果');
            return;
        }

        let taskData;

        if (selectedModel === 'wanx-style-repaint-v1') {
            // 人像风格重绘模型
            if (styleIndex === -1 && !styleRefImageUrl) {
                alert('自定义风格需要上传参考图片');
                return;
            }

            taskData = {
                model: selectedModel,
                input: {
                    image_url: inputImageUrl,
                    style_index: styleIndex
                },
                parameters: {
                    size: resolution,
                    n: n
                }
            };

            if (styleIndex === -1 && styleRefImageUrl) {
                taskData.input.style_ref_url = styleRefImageUrl;
            }
        } else {
            // wanx2.1-imageedit 风格化模型
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

            if (style !== '<auto>') {
                taskData.parameters.style = style;
            }
        }

        if (onGenerate) {
            onGenerate(taskData, 'image-stylization');
        }
    };

    const currentStyleOptions = selectedFunction ? STYLE_OPTIONS[selectedFunction] : [];

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
                                {STYLIZATION_MODELS.map(model => (
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
                                    {STYLIZATION_MODELS[0].functions.map(func => (
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
                        {selectedModel === 'wanx-style-repaint-v1' 
                            ? '为人像照片应用各种风格效果' 
                            : STYLIZATION_MODELS[0].functions.find(f => f.id === selectedFunction)?.description}
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

                            {/* 风格参考图（仅人像风格重绘且自定义风格时显示） */}
                            {selectedModel === 'wanx-style-repaint-v1' && styleIndex === -1 && (
                                <div className="flex items-center gap-2">
                                    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 whitespace-nowrap">
                                        <Palette className="text-purple-600" size={14} />
                                        参考风格
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, true)}
                                        className="hidden"
                                        id="style-ref-upload"
                                    />
                                    {styleRefImage ? (
                                        <div className="relative group">
                                            <img
                                                src={styleRefImage}
                                                alt="风格参考"
                                                className="h-16 w-16 object-cover rounded-lg border-2 border-purple-200 cursor-pointer hover:border-purple-400 transition-colors"
                                                onClick={() => setPreviewImage(styleRefImage)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setStyleRefImage(null);
                                                    setStyleRefImageUrl(null);
                                                }}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ) : (
                                        <label
                                            htmlFor="style-ref-upload"
                                            className="h-16 w-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all"
                                        >
                                            <Upload className="text-gray-400" size={20} />
                                        </label>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 提示词（wanx2.1-imageedit）或风格选择（人像风格重绘） */}
                    {selectedModel === 'wanx-style-repaint-v1' ? (
                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                                <Palette className="text-gray-500" size={12} />
                                风格选择
                            </label>
                            <select
                                value={styleIndex}
                                onChange={(e) => setStyleIndex(parseInt(e.target.value))}
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 transition-all"
                            >
                                {PORTRAIT_STYLES.map(style => (
                                    <option key={style.index} value={style.index}>
                                        {style.name} - {style.description}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                                <Wand2 className="text-gray-500" size={12} />
                                提示词
                            </label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="描述想要的风格效果，例如：转换成法国绘本风格"
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 transition-all"
                                rows="3"
                                required
                            />
                        </div>
                    )}

                    {/* 高级设置 */}
                    {selectedModel === 'wanx2.1-imageedit' && (
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
                                    {currentStyleOptions.length > 0 && (
                                        <div>
                                            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                                                <Palette className="text-gray-500" size={12} />
                                                风格预设
                                            </label>
                                            <select
                                                value={style}
                                                onChange={(e) => setStyle(e.target.value)}
                                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 transition-all"
                                            >
                                                {currentStyleOptions.map(opt => (
                                                    <option key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

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
                                </div>
                            )}
                        </div>
                    )}

                    {/* 提交按钮 */}
                    <button
                        type="submit"
                        disabled={isGenerating}
                        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-3 rounded-lg font-medium hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    >
                        <Palette size={18} />
                        {isGenerating ? '风格化中...' : '开始风格化'}
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
