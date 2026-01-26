import React, { useState, useEffect } from 'react';
import { Palette, Upload, X, Image as ImageIcon, Sparkles } from 'lucide-react';
import { uploadFileSimple } from '../hooks/useFileUpload';

// 预设风格列表（根据API文档）
const PRESET_STYLES = [
    { index: 0, name: '复古漫画', emoji: '🎭', desc: '复古漫画风格' },
    { index: 1, name: '3D童话', emoji: '🧚', desc: '3D童话风格' },
    { index: 2, name: '二次元', emoji: '🌟', desc: '二次元动漫风格' },
    { index: 3, name: '小清新', emoji: '🌿', desc: '小清新风格' },
    { index: 4, name: '未来科技', emoji: '🚀', desc: '未来科技风格' },
    { index: 5, name: '国画古风', emoji: '🖼️', desc: '国画古风风格' },
    { index: 6, name: '将军百战', emoji: '⚔️', desc: '将军百战风格' },
    { index: 7, name: '炫彩卡通', emoji: '🎨', desc: '炫彩卡通风格' },
    { index: 8, name: '清雅国风', emoji: '🏯', desc: '清雅国风风格' },
    { index: 9, name: '喜迎新年', emoji: '🎊', desc: '喜迎新年风格' },
    { index: 14, name: '国风工笔', emoji: '🎐', desc: '国风工笔画风格' },
    { index: 15, name: '恭贺新禧', emoji: '🎆', desc: '恭贺新禧风格' },
    { index: 30, name: '童话世界', emoji: '🦄', desc: '童话世界风格' },
    { index: 31, name: '黏土世界', emoji: '🪨', desc: '黏土世界风格' },
    { index: 32, name: '像素世界', emoji: '🕹️', desc: '像素艺术风格' },
    { index: 33, name: '冒险世界', emoji: '🗺️', desc: '冒险世界风格' },
    { index: 34, name: '日漫世界', emoji: '🌸', desc: '日漫世界风格' },
    { index: 35, name: '3D世界', emoji: '🎬', desc: '3D世界风格' },
    { index: 36, name: '二次元世界', emoji: '✨', desc: '二次元世界风格' },
    { index: 37, name: '手绘世界', emoji: '✏️', desc: '手绘世界风格' },
    { index: 38, name: '蜡笔世界', emoji: '🖍️', desc: '蜡笔世界风格' },
    { index: 39, name: '冰箱贴世界', emoji: '🧲', desc: '冰箱贴风格' },
    { index: 40, name: '吧唧世界', emoji: '🎪', desc: '吧唧世界风格' }
];

export const StyleRepaintGenerator = ({ onGenerate, apiKey }) => {
    const MODEL_ID = 'wanx-style-repaint-v1';
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploading, setUploading] = useState({ input: false, styleRef: false });
    
    // 基础参数
    const [inputImage, setInputImage] = useState(null);
    const [inputImageUrl, setInputImageUrl] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    
    // 风格选择
    const [useCustomStyle, setUseCustomStyle] = useState(false);
    const [selectedStyleIndex, setSelectedStyleIndex] = useState(3); // 默认"小清新"
    const [styleRefImage, setStyleRefImage] = useState(null);
    const [styleRefImageUrl, setStyleRefImageUrl] = useState(null);

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
                
                const url = await uploadFileSimple(file, apiKey, MODEL_ID);
                
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

    const removeImage = (isStyleRef = false) => {
        if (isStyleRef) {
            setStyleRefImage(null);
            setStyleRefImageUrl(null);
        } else {
            setInputImage(null);
            setInputImageUrl(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!inputImageUrl) {
            alert('请上传人像图片');
            return;
        }

        if (useCustomStyle && !styleRefImageUrl) {
            alert('使用自定义风格时，请上传风格参考图');
            return;
        }

        setIsSubmitting(true);

        const taskData = {
            model: MODEL_ID,
            input: {
                image_url: inputImageUrl,
                style_index: useCustomStyle ? -1 : selectedStyleIndex,
                ...(useCustomStyle && styleRefImageUrl && { style_ref_url: styleRefImageUrl })
            }
        };

        if (onGenerate) {
            try {
                await onGenerate(taskData, 'style-repaint');
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const selectedStyle = PRESET_STYLES.find(s => s.index === selectedStyleIndex);

    return (
        <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* 标题说明 */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                    <h3 className="text-base font-semibold text-gray-800 mb-1 flex items-center gap-2">
                        <Palette className="text-purple-600" size={18} />
                        人像风格重绘
                    </h3>
                    <p className="text-sm text-gray-600">将人物照片转换为多种艺术风格，支持23种预设风格或自定义风格参考图</p>
                </div>

                {/* 图像上传区域 */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 whitespace-nowrap">
                            <ImageIcon className="text-blue-600" size={14} />
                            人像图片
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, false)}
                            className="hidden"
                            id="portrait-upload"
                            required
                        />
                        {inputImage ? (
                            <div className="relative group">
                                <img
                                    src={inputImage}
                                    alt="人像预览"
                                    className="h-16 w-16 object-cover rounded-lg border-2 border-blue-200 cursor-pointer hover:border-blue-400 transition-colors"
                                    onClick={() => setPreviewImage(inputImage)}
                                />
                                <button
                                    type="button"
                                    onClick={() => removeImage(false)}
                                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={12} />
                                </button>
                                {uploading.input && (
                                    <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
                                        <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <label
                                htmlFor="portrait-upload"
                                className="h-16 w-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
                            >
                                <Upload className="text-gray-400" size={20} />
                            </label>
                        )}
                    </div>

                    <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded p-2">
                        <strong>提示：</strong>上传清晰的人像照片，人脸比例不宜过小，避免夸张姿势和表情，以获得最佳效果
                    </div>
                </div>

                {/* 风格选择模式 */}
                <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Sparkles className="text-purple-600" size={14} />
                        风格选择
                    </label>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setUseCustomStyle(false)}
                            className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all ${
                                !useCustomStyle
                                    ? 'bg-purple-600 text-white shadow-md'
                                    : 'bg-white text-gray-600 border border-gray-300 hover:border-purple-300'
                            }`}
                        >
                            预设风格
                        </button>
                        <button
                            type="button"
                            onClick={() => setUseCustomStyle(true)}
                            className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all ${
                                useCustomStyle
                                    ? 'bg-purple-600 text-white shadow-md'
                                    : 'bg-white text-gray-600 border border-gray-300 hover:border-purple-300'
                            }`}
                        >
                            自定义风格
                        </button>
                    </div>
                </div>

                {/* 预设风格选择器 */}
                {!useCustomStyle && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto p-2 bg-gray-50 rounded-lg border border-gray-200">
                            {PRESET_STYLES.map(style => (
                                <button
                                    key={style.index}
                                    type="button"
                                    onClick={() => setSelectedStyleIndex(style.index)}
                                    className={`p-3 rounded-lg text-center transition-all ${
                                        selectedStyleIndex === style.index
                                            ? 'bg-purple-600 text-white shadow-md scale-105'
                                            : 'bg-white text-gray-700 border border-gray-200 hover:border-purple-300 hover:scale-102'
                                    }`}
                                >
                                    <div className="text-2xl mb-1">{style.emoji}</div>
                                    <div className="text-xs font-medium">{style.name}</div>
                                </button>
                            ))}
                        </div>
                        
                        {selectedStyle && (
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                                <span className="text-sm text-gray-600">当前选择：</span>
                                <span className="text-sm font-semibold text-purple-700 ml-1">
                                    {selectedStyle.emoji} {selectedStyle.name}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* 自定义风格参考图上传 */}
                {useCustomStyle && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 whitespace-nowrap">
                                <Palette className="text-purple-600" size={14} />
                                风格参考图
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
                                        onClick={() => removeImage(true)}
                                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={12} />
                                    </button>
                                    {uploading.styleRef && (
                                        <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
                                            <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <label
                                    htmlFor="style-ref-upload"
                                    className="h-16 w-16 border-2 border-dashed border-purple-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all"
                                >
                                    <Upload className="text-purple-400" size={20} />
                                </label>
                            )}
                        </div>

                        <div className="text-xs text-gray-500 bg-purple-50 border border-purple-200 rounded p-2">
                            <strong>提示：</strong>上传一张具有你想要的艺术风格的图片，模型将提取其风格并应用到人像上
                        </div>
                    </div>
                )}

                {/* 提交按钮 */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
                            <span>生成中...</span>
                        </>
                    ) : (
                        <>
                            <Palette size={18} />
                            <span>开始风格重绘</span>
                        </>
                    )}
                </button>
            </form>

            {/* 图片预览弹窗 */}
            {previewImage && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={previewImage}
                            alt="预览"
                            className="rounded-lg shadow-2xl max-w-full max-h-[90vh] object-contain"
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
