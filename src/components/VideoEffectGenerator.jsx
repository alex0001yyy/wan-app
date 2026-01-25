import React, { useState, useEffect, memo, useCallback } from 'react';
import {
    Video, Image as ImageIcon, Upload, X, Sparkles
} from 'lucide-react';
import { VIDEO_EFFECT_MODELS, VIDEO_EFFECT_TEMPLATES } from '../config/models';
import { uploadFileSimple } from '../hooks/useFileUpload';

const VideoEffectGenerator = memo(({ onGenerate, isGenerating, apiKey }) => {
    // Model & Settings
    const defaultModel = VIDEO_EFFECT_MODELS[0];
    const [selectedModel, setSelectedModel] = useState(defaultModel?.id || '');
    
    // Image Input
    const [imgInput, setImgInput] = useState({ value: '', file: null });
    const [imgPreview, setImgPreview] = useState('');
    const [previewImage, setPreviewImage] = useState(null); // 弹窗预览
    const [uploading, setUploading] = useState(false);
    
    // Template Selection
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [templateCategory, setTemplateCategory] = useState('general');

    // Get current model config
    const currentModelConfig = VIDEO_EFFECT_MODELS.find(m => m.id === selectedModel) || defaultModel;

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

    // Handle image file upload - 使用 OSS 上传
    const handleImageChange = useCallback(async (e) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                setUploading(true);
                setImgPreview(URL.createObjectURL(file));
                // 视频特效 API 必须使用 URL
                const url = await uploadFileSimple(file, apiKey, selectedModel, { requireUrl: true });
                console.log('✅ 图片上传成功:', url);
                setImgInput({ value: url, file });
            } catch (error) {
                console.error('Error uploading image:', error);
                alert('图片上传失败: ' + error.message);
                setImgPreview('');
            } finally {
                setUploading(false);
            }
        }
    }, [apiKey, selectedModel]);

    // Clear image
    const clearImage = useCallback(() => {
        setImgInput({ value: '', file: null });
        setImgPreview('');
    }, []);

    // 根据模型类型获取可用的特效类别
    const getAvailableCategories = () => {
        if (currentModelConfig?.effectType === 'kf2v') {
            return [{ value: 'kf2v', label: '人物变装' }];
        }
        return [
            { value: 'general', label: '通用特效' },
            { value: 'single', label: '单人特效' },
            { value: 'singleAnimal', label: '单人/动物特效' },
            { value: 'couple', label: '双人特效' }
        ];
    };

    // 当模型变化时，重置特效类别和选中的特效
    useEffect(() => {
        const categories = getAvailableCategories();
        setTemplateCategory(categories[0].value);
        setSelectedTemplate('');
    }, [selectedModel]);

    // Get templates for current category
    const getTemplates = () => {
        const templates = VIDEO_EFFECT_TEMPLATES[templateCategory] || [];
        // 过滤出当前模型支持的特效
        const supportedTemplates = currentModelConfig?.capabilities?.supportedTemplates || [];
        if (supportedTemplates.length > 0) {
            return templates.filter(t => supportedTemplates.includes(t.value));
        }
        return templates;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!imgInput.value || !selectedTemplate) return;

        try {
            const taskData = {
                model: selectedModel,
                modelConfig: currentModelConfig,
                input: {
                    img_url: imgInput.value,
                    template: selectedTemplate
                },
                parameters: {
                    watermark: false
                }
            };

            onGenerate(taskData);
        } catch (error) {
            console.error('Submit failed:', error);
            alert('提交失败: ' + error.message);
        }
    };

    return (
        <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Control Bar */}
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Model Selection */}
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-gray-600">模型</label>
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm font-medium outline-none focus:border-violet-400"
                            >
                                {VIDEO_EFFECT_MODELS.map(model => (
                                    <option key={model.id} value={model.id}>{model.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="h-6 w-px bg-gray-300"></div>

                        {/* Template Category */}
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-gray-600">特效类型</label>
                            <select
                                value={templateCategory}
                                onChange={(e) => {
                                    setTemplateCategory(e.target.value);
                                    setSelectedTemplate('');
                                }}
                                className="bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm font-medium outline-none focus:border-violet-400"
                            >
                                {getAvailableCategories().map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="h-6 w-px bg-gray-300"></div>

                        {/* Image Upload - Compact */}
                        <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 whitespace-nowrap">
                                <ImageIcon className="text-blue-600" size={14} />
                                输入图片 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                                id="effect-image-upload"
                            />
                            {imgPreview ? (
                                <div className="relative group">
                                    <img 
                                        src={imgPreview} 
                                        alt="图片预览" 
                                        className="h-8 w-auto object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => setPreviewImage(imgPreview)}
                                    />
                                    <button
                                        type="button"
                                        onClick={clearImage}
                                        className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={10} />
                                    </button>
                                </div>
                            ) : (
                                <label 
                                    htmlFor="effect-image-upload"
                                    className="h-8 px-3 flex items-center gap-2 border border-dashed border-gray-300 rounded bg-white hover:bg-gray-50 cursor-pointer transition-all"
                                >
                                    <Upload className="text-gray-400" size={14} />
                                    <span className="text-xs text-gray-500">点击上传图片</span>
                                </label>
                            )}
                        </div>
                    </div>
                </div>

                {/* Template Selection */}
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                        <Sparkles className="text-purple-600" size={14} />
                        选择特效 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {getTemplates().map(template => (
                            <button
                                key={template.value}
                                type="button"
                                onClick={() => setSelectedTemplate(template.value)}
                                className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                                    selectedTemplate === template.value
                                        ? 'bg-purple-100 border-purple-300 text-purple-700'
                                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                {template.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isGenerating || !imgInput.value || !selectedTemplate}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-semibold px-6 py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isGenerating ? (
                        <>
                            <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                            <span>生成中...</span>
                        </>
                    ) : (
                        <>
                            <Sparkles size={18} />
                            <span>生成特效视频</span>
                        </>
                    )}
                </button>
            </form>

            {/* 图片预览弹窗 */}
            {previewImage && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative w-full h-full flex items-center justify-center p-8">
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-6 right-6 bg-white/90 hover:bg-white text-gray-800 rounded-full w-10 h-10 flex items-center justify-center shadow-lg z-10 transition-all"
                        >
                            <X size={24} />
                        </button>
                        <div className="text-xs text-white/60 absolute top-6 left-6">ESC 关闭</div>
                        <img
                            src={previewImage}
                            alt="预览"
                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </div>
    );
});

VideoEffectGenerator.displayName = 'VideoEffectGenerator';

export default VideoEffectGenerator;
