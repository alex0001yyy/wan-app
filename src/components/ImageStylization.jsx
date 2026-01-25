import React, { useState, useEffect } from 'react';
import { Palette, Upload, Settings2, Sparkles, X, Wand2, Hash, ChevronDown, ChevronUp } from 'lucide-react';
import { uploadFileSimple } from '../hooks/useFileUpload';

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

export const ImageStylization = ({ onGenerate, isGenerating, apiKey }) => {
    const [uploading, setUploading] = useState({ input: false, styleRef: false });
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
            const preview = URL.createObjectURL(file);
            if (isStyleRef) {
                setStyleRefImage(preview);
            } else {
                setInputImage(preview);
            }
            
            try {
                const uploadKey = isStyleRef ? 'styleRef' : 'input';
                setUploading(prev => ({ ...prev, [uploadKey]: true }));
                const url = await uploadFileSimple(file, apiKey, selectedModel);
                if (isStyleRef) {
                    setStyleRefImageUrl(url);
                } else {
                    setInputImageUrl(url);
                }
            } catch (error) {
                alert('图像上传失败: ' + error.message);
            } finally {
                const uploadKey = isStyleRef ? 'styleRef' : 'input';
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
        <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Main Interaction Area */}
                <div className="space-y-4">
                    {/* 提示词输入 */}
                    <div className="relative">
                        <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 mb-2">
                            <Wand2 size={14} className="text-violet-500" />
                            提示词
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="描述想要的风格效果，例如：转换成法国绘本风格"
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
                                    {STYLIZATION_MODELS.map(model => (
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
                                        {STYLIZATION_MODELS[0].functions.map(func => (
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
                        <div className="flex items-center gap-3">
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

                            {/* 风格参考图（仅人像风格重绘且自定义风格时显示） */}
                            {selectedModel === 'wanx-style-repaint-v1' && styleIndex === -1 && (
                                <>
                                    <div className="h-6 w-px bg-gray-300"></div>
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
                                                className="h-8 w-auto object-cover rounded cursor-pointer"
                                                onClick={() => setPreviewImage(styleRefImage)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setStyleRefImage(null);
                                                    setStyleRefImageUrl(null);
                                                }}
                                                className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ) : (
                                        <label
                                            htmlFor="style-ref-upload"
                                            className="h-8 px-3 flex items-center gap-2 border border-dashed border-gray-300 rounded bg-white hover:bg-gray-50 cursor-pointer transition-all"
                                        >
                                            <Upload className="text-gray-400" size={14} />
                                            <span className="text-xs text-gray-500">点击上传</span>
                                        </label>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* 风格选择（仅人像风格重绘） */}
                    {selectedModel === 'wanx-style-repaint-v1' && (
                        <div>
                            <label className="text-xs font-medium text-gray-600 mb-1.5 block">风格选择</label>
                            <div className="relative">
                                <select
                                    value={styleIndex}
                                    onChange={(e) => setStyleIndex(parseInt(e.target.value))}
                                    className="w-full appearance-none bg-gradient-to-br from-white to-gray-50 border border-gray-200 pl-3 pr-10 py-3 rounded-xl text-sm font-semibold text-gray-800 outline-none hover:border-violet-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all cursor-pointer shadow-sm hover:shadow"
                                >
                                    {PORTRAIT_STYLES.map(style => (
                                        <option key={style.index} value={style.index}>
                                            {style.name} - {style.description}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
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
                                <span>风格化中...</span>
                            </>
                        ) : (
                            <>
                                <Palette size={18} />
                                <span>开始风格化</span>
                            </>
                        )}
                    </button>
                </div>

                {/* 高级设置 */}
                {selectedModel === 'wanx2.1-imageedit' && showAdvanced && (
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border border-gray-200 space-y-4 animate-in slide-in-from-top-2 duration-200">
                        {currentStyleOptions.length > 0 && (
                            <div>
                                <label className="text-xs font-medium text-gray-600 mb-1.5 block">风格预设</label>
                                <div className="relative">
                                    <select
                                        value={style}
                                        onChange={(e) => setStyle(e.target.value)}
                                        className="w-full appearance-none bg-white border border-gray-200 pl-3 pr-10 py-2.5 rounded-lg text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                                    >
                                        {currentStyleOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
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
                            <label className="text-xs font-medium text-gray-600 mb-1.5 block">随机种子</label>
                            <input
                                type="number"
                                value={seed}
                                onChange={(e) => setSeed(e.target.value)}
                                placeholder="留空则随机生成"
                                className="w-full bg-white border border-gray-200 px-3 py-2.5 rounded-lg text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                            />
                        </div>
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
