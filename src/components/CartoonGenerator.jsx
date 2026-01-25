import React, { useState, useEffect } from 'react';
import { Smile, Upload, X, Wand2, Hash, Settings2, ChevronDown, ChevronUp } from 'lucide-react';
import { uploadFileSimple } from '../hooks/useFileUpload';

export const CartoonGenerator = ({ onGenerate, isGenerating, apiKey }) => {
    const MODEL_ID = 'wanx2.1-imageedit';
    const [uploading, setUploading] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [inputImage, setInputImage] = useState(null);
    const [inputImageUrl, setInputImageUrl] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [prompt, setPrompt] = useState('');
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

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setInputImage(URL.createObjectURL(file));
            
            try {
                setUploading(true);
                const url = await uploadFileSimple(file, apiKey, MODEL_ID);
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
            alert('请上传参考卡通形象图');
            return;
        }

        if (!prompt) {
            alert('请输入提示词');
            return;
        }

        const taskData = {
            model: 'wanx2.1-imageedit',
            input: {
                function: 'control_cartoon_feature',
                prompt: prompt,
                base_image_url: inputImageUrl
            },
            parameters: {
                n: n,
                watermark: watermark,
                ...(seed && { seed: parseInt(seed) })
            }
        };

        if (onGenerate) {
            onGenerate(taskData, 'cartoon-generator');
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5">
                <form onSubmit={handleSubmit} className="space-y-3">
                    {/* 标题和数量 */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-2">万相2.1-卡通形象生成</h3>
                            <p className="text-xs text-gray-400">参考卡通形象进行创作生成</p>
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

                    {/* 图像上传区域 */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 whitespace-nowrap">
                                <Upload className="text-blue-600" size={14} />
                                卡通形象参考图
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                id="cartoon-ref-upload"
                                required
                            />
                            {inputImage ? (
                                <div className="relative group">
                                    <img
                                        src={inputImage}
                                        alt="卡通参考"
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
                                    {uploading && (
                                        <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
                                            <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <label
                                    htmlFor="cartoon-ref-upload"
                                    className="h-16 w-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
                                >
                                    <Upload className="text-gray-400" size={20} />
                                </label>
                            )}
                        </div>

                        <div className="mt-2 text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded p-2">
                            <strong>提示：</strong>上传一张卡通形象图片作为参考，模型将根据提示词生成该形象在不同场景中的图像
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
                            placeholder="描述想要生成的场景，例如：卡通形象小心翼翼地探出头，窥视着房间内一颗璀璨的蓝色宝石"
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 transition-all"
                            rows="4"
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

                    {/* 提交按钮 */}
                    <button
                        type="submit"
                        disabled={isGenerating}
                        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-3 rounded-lg font-medium hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    >
                        <Smile size={18} />
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
