import React, { useState } from 'react';
import { Languages, Upload, X, Settings2, ChevronDown, ChevronUp, Sparkles, ArrowRight, Image } from 'lucide-react';
import { uploadFileSimple } from '../hooks/useFileUpload';
import { IMAGE_TRANSLATION_MODELS } from '../config/models';

const LANGUAGES = [
    { code: 'zh', name: '简体中文', flag: '🇨🇳' },
    { code: 'en', name: '英文', flag: '🇺🇸' },
    { code: 'ja', name: '日文', flag: '🇯🇵' },
    { code: 'ko', name: '韩语', flag: '🇰🇷' },
    { code: 'es', name: '西班牙语', flag: '🇪🇸' },
    { code: 'fr', name: '法语', flag: '🇫🇷' },
    { code: 'ru', name: '俄语', flag: '🇷🇺' },
    { code: 'pt', name: '葡萄牙语', flag: '🇵🇹' },
    { code: 'it', name: '意大利语', flag: '🇮🇹' },
    { code: 'vi', name: '越南语', flag: '🇻🇳' },
    { code: 'ms', name: '马来语', flag: '🇲🇾' },
    { code: 'th', name: '泰语', flag: '🇹🇭' },
    { code: 'id', name: '印尼语', flag: '🇮🇩' },
    { code: 'ar', name: '阿拉伯语', flag: '🇸🇦' }
];

export const ImageTranslator = ({ onGenerate, isGenerating, apiKey }) => {
    const [uploading, setUploading] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [inputImage, setInputImage] = useState(null);
    const [inputImageUrl, setInputImageUrl] = useState(null);
    const [selectedModel, setSelectedModel] = useState('qwen-mt-image');
    const [sourceLang, setSourceLang] = useState('zh');
    const [targetLang, setTargetLang] = useState('en');
    const [imageSegment, setImageSegment] = useState(false);
    const [domainHint, setDomainHint] = useState('');
    const [sensitives, setSensitives] = useState('');
    const [terminologies, setTerminologies] = useState('');

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

        // Parse sensitives and terminologies
        const sensitivesArray = sensitives.split(',').map(s => s.trim()).filter(s => s);
        const terminologiesArray = terminologies.split('\n')
            .map(line => {
                const [src, tgt] = line.split('=').map(s => s.trim());
                return src && tgt ? { src, tgt } : null;
            })
            .filter(t => t);

        const taskData = {
            model: selectedModel,
            input: {
                image_url: inputImageUrl,
                source_lang: sourceLang,
                target_lang: targetLang,
                ext: {
                    config: {
                        imageSegment: imageSegment
                    }
                }
            },
            parameters: {}
        };

        if (domainHint) {
            taskData.input.ext.domainHint = domainHint;
        }
        if (sensitivesArray.length > 0) {
            taskData.input.ext.sensitives = sensitivesArray;
        }
        if (terminologiesArray.length > 0) {
            taskData.input.ext.terminologies = terminologiesArray;
        }

        if (onGenerate) {
            onGenerate(taskData, 'image-translation');
        }
    };

    const swapLanguages = () => {
        if (sourceLang !== 'auto') {
            const temp = sourceLang;
            setSourceLang(targetLang);
            setTargetLang(temp);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* 图像上传 */}
                    <div>
                        <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                            <Image className="text-gray-500" size={12} />
                            输入图像
                        </label>
                        <div className="relative">
                            {inputImage ? (
                                <div className="relative group">
                                    <img 
                                        src={inputImage} 
                                        alt="输入图像" 
                                        className="w-full h-40 object-contain rounded-lg border-2 border-violet-400 bg-gray-50" 
                                    />
                                    <button
                                        type="button"
                                        onClick={() => { setInputImage(null); setInputImageUrl(null); }}
                                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-violet-400 hover:bg-violet-50/30 transition-colors">
                                    <Upload size={24} className="text-gray-400 mb-2" />
                                    <span className="text-sm text-gray-500">点击上传需要翻译的图像</span>
                                    <span className="text-xs text-gray-400 mt-1">支持 JPG、PNG、WEBP</span>
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* 语言选择 */}
                    <div className="flex items-end gap-2">
                        <div className="flex-1">
                            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                                源语言
                            </label>
                            <select
                                value={sourceLang}
                                onChange={(e) => setSourceLang(e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 transition-all"
                            >
                                <option value="auto">🔍 自动检测</option>
                                {LANGUAGES.map(lang => (
                                    <option key={lang.code} value={lang.code}>
                                        {lang.flag} {lang.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="button"
                            onClick={swapLanguages}
                            disabled={sourceLang === 'auto'}
                            className="p-2 mb-0.5 text-gray-400 hover:text-violet-500 hover:bg-violet-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ArrowRight size={18} />
                        </button>

                        <div className="flex-1">
                            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                                目标语言
                            </label>
                            <select
                                value={targetLang}
                                onChange={(e) => setTargetLang(e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 transition-all"
                            >
                                {LANGUAGES.map(lang => (
                                    <option key={lang.code} value={lang.code}>
                                        {lang.flag} {lang.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* 模型选择 & 主体分割 */}
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                                <Sparkles className="text-gray-500" size={12} />
                                翻译模型
                            </label>
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 transition-all"
                            >
                                {IMAGE_TRANSLATION_MODELS.map(model => (
                                    <option key={model.id} value={model.id}>
                                        {model.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center pt-5">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={imageSegment}
                                    onChange={(e) => setImageSegment(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-violet-500 focus:ring-violet-400"
                                />
                                <span className="text-xs text-gray-600">跳过主体文字</span>
                            </label>
                        </div>
                    </div>

                    {/* 高级设置折叠 */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                            <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                                <Settings2 size={12} />
                                高级设置
                            </span>
                            {showAdvanced ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                        </button>
                        
                        {showAdvanced && (
                            <div className="p-3 space-y-3 border-t border-gray-200">
                                {/* 领域提示 */}
                                <div>
                                    <label className="text-xs font-medium text-gray-600 mb-1 block">领域提示 (英文)</label>
                                    <textarea
                                        value={domainHint}
                                        onChange={(e) => setDomainHint(e.target.value)}
                                        placeholder="描述使用场景或译文风格，如：e-commerce product description"
                                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 transition-all resize-none h-14"
                                    />
                                </div>

                                {/* 敏感词过滤 */}
                                <div>
                                    <label className="text-xs font-medium text-gray-600 mb-1 block">敏感词过滤</label>
                                    <input
                                        type="text"
                                        value={sensitives}
                                        onChange={(e) => setSensitives(e.target.value)}
                                        placeholder="用逗号分隔，如：词1, 词2, 词3"
                                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 transition-all"
                                    />
                                </div>

                                {/* 术语干预 */}
                                <div>
                                    <label className="text-xs font-medium text-gray-600 mb-1 block">术语干预</label>
                                    <textarea
                                        value={terminologies}
                                        onChange={(e) => setTerminologies(e.target.value)}
                                        placeholder="每行一个，格式：原文=译文"
                                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 transition-all resize-none h-16"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 提交按钮 */}
                    <button
                        type="submit"
                        disabled={isGenerating || !inputImageUrl}
                        className="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white py-2.5 px-4 rounded-lg font-medium hover:from-violet-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                翻译中...
                            </>
                        ) : (
                            <>
                                <Languages size={16} />
                                开始翻译
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ImageTranslator;
