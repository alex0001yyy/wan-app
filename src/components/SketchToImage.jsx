import React, { useState, useEffect } from 'react';
import { PenTool, Upload, Settings2, Sparkles, X, Wand2, Hash, ChevronDown, ChevronUp, Palette } from 'lucide-react';
import { uploadFileToTempServer } from '../utils/fileUpload';

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

export const SketchToImage = ({ onGenerate, isGenerating }) => {
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
            const reader = new FileReader();
            reader.onload = (e) => {
                setInputImage(e.target.result);
            };
            reader.readAsDataURL(file);
            
            try {
                const url = await uploadFileToTempServer(file);
                setInputImageUrl(url);
            } catch (error) {
                alert('图像上传失败: ' + error.message);
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
                    ...(seed && { seed: parseInt(seed) })
                }
            };
        }

        if (onGenerate) {
            onGenerate(taskData, 'sketch-to-image');
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5">
                <form onSubmit={handleSubmit} className="space-y-3">
                    {/* 模型选择 */}
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
                                {SKETCH_MODELS.map(model => (
                                    <option key={model.id} value={model.id}>
                                        {model.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                                <Settings2 className="text-gray-500" size={12} />
                                分辨率
                            </label>
                            <select
                                value={resolution}
                                onChange={(e) => setResolution(e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 transition-all"
                            >
                                {RESOLUTIONS.map(res => (
                                    <option key={res} value={res}>{res}</option>
                                ))}
                            </select>
                        </div>

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
                        {SKETCH_MODELS.find(m => m.id === selectedModel)?.description}
                    </p>

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
                            placeholder="描述想要生成的图像，例如：北欧极简风格的客厅"
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
                        <PenTool size={18} />
                        {isGenerating ? '生成中...' : '开始生成'}
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
