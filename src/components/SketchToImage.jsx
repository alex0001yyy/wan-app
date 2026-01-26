import React, { useState, useEffect } from 'react';
import { PenTool, Upload, Settings2, Sparkles, X, Wand2, Hash, ChevronDown, ChevronUp, Palette } from 'lucide-react';
import { uploadFileSimple } from '../hooks/useFileUpload';

const SKETCH_MODELS = [
    {
        id: 'wanx2.1-imageedit',
        name: '万相2.1-线稿生图',
        description: '提取输入图像的线稿，再参考线稿生成图像'
    },
    {
        id: 'wanx-sketch-to-image-lite',
        name: '草图生图模型',
        description: '基于草图或涂鸦生成精美图像'
    }
];

const STYLES = [
    { value: '<auto>', label: '自动' },
    { value: '<3d cartoon>', label: '3D卡通' },
    { value: '<anime>', label: '动漫' },
    { value: '<oil painting>', label: '油画' },
    { value: '<watercolor>', label: '水彩' },
    { value: '<sketch>', label: '素描' },
    { value: '<chinese painting>', label: '国画' },
    { value: '<flat illustration>', label: '扁平插画' }
];

const RESOLUTIONS = ['768*768', '1024*1024', '1280*1280'];

export const SketchToImage = ({ onGenerate, isGenerating, apiKey }) => {
    const [uploading, setUploading] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [inputImage, setInputImage] = useState(null);
    const [inputImageUrl, setInputImageUrl] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [prompt, setPrompt] = useState('');
    const [selectedModel, setSelectedModel] = useState('wanx2.1-imageedit');
    const [resolution, setResolution] = useState('1024*1024');
    const [n, setN] = useState(1);
    const [style, setStyle] = useState('<auto>');
    const [sketchWeight, setSketchWeight] = useState(10);
    const [sketchExtraction, setSketchExtraction] = useState(false);
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
            alert('请上传草图或线稿图像');
            return;
        }

        if (!prompt) {
            alert('请输入提示词');
            return;
        }

        let taskData;

        if (selectedModel === 'wanx-sketch-to-image-lite') {
            // wanx-sketch-to-image-lite 草图生图模型
            taskData = {
                model: selectedModel,
                input: {
                    messages: [{
                        role: 'user',
                        content: [
                            { text: prompt },
                            { image_url: inputImageUrl }
                        ]
                    }]
                },
                parameters: {
                    size: resolution,
                    n: n,
                    style: style,
                    sketch_weight: sketchWeight,
                    sketch_extraction: sketchExtraction,
                    sketch_color: []
                }
            };
        } else {
            // wanx2.1-imageedit 线稿生图
            taskData = {
                model: selectedModel,
                input: {
                    function: 'doodle',
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
        }

        if (onGenerate) {
            onGenerate(taskData, 'sketch-to-image');
        }
    };

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
                        placeholder="描述想要生成的图像，例如：北欧极简风格的客厅"
                        className="w-full min-h-[100px] bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all resize-none"
                        required
                    />
                </div>

                {/* 模型选择 */}
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="text-xs font-medium text-gray-600 mb-1.5 block">模型版本</label>
                        <div className="relative">
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="w-full appearance-none bg-gradient-to-br from-white to-gray-50 border border-gray-200 pl-3 pr-10 py-3 rounded-xl text-sm font-semibold text-gray-800 outline-none hover:border-violet-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all cursor-pointer shadow-sm hover:shadow"
                            >
                                {SKETCH_MODELS.map(model => (
                                    <option key={model.id} value={model.id}>
                                        {model.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-gray-600 mb-1.5 block">分辨率</label>
                        <div className="relative">
                            <select
                                value={resolution}
                                onChange={(e) => setResolution(e.target.value)}
                                className="w-full appearance-none bg-gradient-to-br from-white to-gray-50 border border-gray-200 pl-3 pr-10 py-3 rounded-xl text-sm font-semibold text-gray-800 outline-none hover:border-violet-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all cursor-pointer shadow-sm hover:shadow"
                            >
                                {RESOLUTIONS.map(res => (
                                    <option key={res} value={res}>{res}</option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

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
                    <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 whitespace-nowrap">
                            <Upload className="text-blue-600" size={14} />
                            {selectedModel === 'wanx2.1-imageedit' ? '输入图像' : '草图图像'}
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
                                    alt="草图"
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
                                <span>生成中...</span>
                            </>
                        ) : (
                            <>
                                <PenTool size={18} />
                                <span>生成图像</span>
                            </>
                        )}
                    </button>
                </div>

                {/* 高级设置 */}
                {showAdvanced && (
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border border-gray-200 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                {selectedModel === 'wanx-sketch-to-image-lite' ? (
                                    <>
                                        <div>
                                            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                                                <Palette className="text-gray-500" size={12} />
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
                                                <PenTool className="text-gray-500" size={12} />
                                                草图权重 (1-20)
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="20"
                                                value={sketchWeight}
                                                onChange={(e) => setSketchWeight(parseInt(e.target.value) || 10)}
                                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 transition-all"
                                            />
                                            <p className="text-xs text-gray-400 mt-1">值越大，生成图像越接近草图结构</p>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <label className="flex items-center gap-2 text-sm text-gray-600">
                                                <input
                                                    type="checkbox"
                                                    checked={sketchExtraction}
                                                    onChange={(e) => setSketchExtraction(e.target.checked)}
                                                    className="rounded border-gray-300"
                                                />
                                                自动提取线稿
                                            </label>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                                                <PenTool className="text-gray-500" size={12} />
                                                线稿强度 ({strength.toFixed(1)})
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
                                            <p className="text-xs text-gray-400 mt-1">值越大，生成图像越接近线稿结构</p>
                                        </div>

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
