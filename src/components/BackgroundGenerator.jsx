import React, { useState, useEffect } from 'react';
import { Image, Upload, X, Settings2, Sparkles, Hash, ChevronDown, ChevronUp, Layers, Plus, Trash2 } from 'lucide-react';
import { uploadFileToTempServer } from '../utils/fileUpload';

export const BackgroundGenerator = ({ onGenerate, isGenerating }) => {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [baseImage, setBaseImage] = useState(null);
    const [baseImageUrl, setBaseImageUrl] = useState(null);
    const [refImage, setRefImage] = useState(null);
    const [refImageUrl, setRefImageUrl] = useState(null);
    const [refPrompt, setRefPrompt] = useState('');
    const [negRefPrompt, setNegRefPrompt] = useState('');
    const [n, setN] = useState(1);
    const [modelVersion, setModelVersion] = useState('v3');
    const [noiseLevel, setNoiseLevel] = useState(300);
    const [refPromptWeight, setRefPromptWeight] = useState(0.5);
    
    // Edge guidance states
    const [foregroundEdges, setForegroundEdges] = useState([]);
    const [backgroundEdges, setBackgroundEdges] = useState([]);

    const handleBaseImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setBaseImage(e.target.result);
            reader.readAsDataURL(file);
            
            try {
                const url = await uploadFileToTempServer(file);
                setBaseImageUrl(url);
            } catch (error) {
                alert('图像上传失败: ' + error.message);
            }
        }
    };

    const handleRefImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setRefImage(e.target.result);
            reader.readAsDataURL(file);
            
            try {
                const url = await uploadFileToTempServer(file);
                setRefImageUrl(url);
            } catch (error) {
                alert('图像上传失败: ' + error.message);
            }
        }
    };

    const handleEdgeUpload = async (e, type) => {
        const files = Array.from(e.target.files);
        for (const file of files) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const url = await uploadFileToTempServer(file);
                    const edgeData = { preview: event.target.result, url, prompt: '' };
                    if (type === 'foreground') {
                        setForegroundEdges(prev => [...prev, edgeData]);
                    } else {
                        setBackgroundEdges(prev => [...prev, edgeData]);
                    }
                } catch (error) {
                    alert('边缘图像上传失败: ' + error.message);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const removeEdge = (type, index) => {
        if (type === 'foreground') {
            setForegroundEdges(prev => prev.filter((_, i) => i !== index));
        } else {
            setBackgroundEdges(prev => prev.filter((_, i) => i !== index));
        }
    };

    const updateEdgePrompt = (type, index, value) => {
        if (type === 'foreground') {
            setForegroundEdges(prev => prev.map((edge, i) => i === index ? { ...edge, prompt: value } : edge));
        } else {
            setBackgroundEdges(prev => prev.map((edge, i) => i === index ? { ...edge, prompt: value } : edge));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!baseImageUrl) {
            alert('请上传主体图像（带透明背景的PNG）');
            return;
        }

        if (!refPrompt && !refImageUrl && foregroundEdges.length === 0 && backgroundEdges.length === 0) {
            alert('请提供参考图像、参考提示词或边缘引导元素中的至少一项');
            return;
        }

        const taskData = {
            model: 'wanx-background-generation-v2',
            input: {
                base_image_url: baseImageUrl
            },
            parameters: {
                n: parseInt(n),
                model_version: modelVersion
            }
        };

        if (refImageUrl) {
            taskData.input.ref_image_url = refImageUrl;
            taskData.parameters.noise_level = parseInt(noiseLevel);
        }

        if (refPrompt) {
            taskData.input.ref_prompt = refPrompt;
        }

        if (negRefPrompt) {
            taskData.input.neg_ref_prompt = negRefPrompt;
        }

        if (refImageUrl && refPrompt) {
            taskData.parameters.ref_prompt_weight = parseFloat(refPromptWeight);
        }

        if (foregroundEdges.length > 0 || backgroundEdges.length > 0) {
            taskData.input.reference_edge = {};
            
            if (foregroundEdges.length > 0) {
                taskData.input.reference_edge.foreground_edge = foregroundEdges.map(e => e.url);
                taskData.input.reference_edge.foreground_edge_prompt = foregroundEdges.map(e => e.prompt);
            }
            
            if (backgroundEdges.length > 0) {
                taskData.input.reference_edge.background_edge = backgroundEdges.map(e => e.url);
                taskData.input.reference_edge.background_edge_prompt = backgroundEdges.map(e => e.prompt);
            }
        }

        if (onGenerate) {
            onGenerate(taskData, 'mk-bg-gen');
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* 图像上传区域 */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* 主体图像 */}
                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                                <Image className="text-gray-500" size={12} />
                                主体图像 (必选)
                            </label>
                            <div className="relative">
                                {baseImage ? (
                                    <div className="relative group">
                                        <img src={baseImage} alt="主体图像" className="w-full h-32 object-contain rounded-lg border-2 border-violet-400 bg-gray-50" />
                                        <button
                                            type="button"
                                            onClick={() => { setBaseImage(null); setBaseImageUrl(null); }}
                                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-violet-400 hover:bg-violet-50/30 transition-colors">
                                        <Upload size={20} className="text-gray-400 mb-1" />
                                        <span className="text-xs text-gray-500">上传PNG透明图</span>
                                        <input type="file" accept="image/png" onChange={handleBaseImageUpload} className="hidden" />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* 参考图像 */}
                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                                <Layers className="text-gray-500" size={12} />
                                参考图像 (可选)
                            </label>
                            <div className="relative">
                                {refImage ? (
                                    <div className="relative group">
                                        <img src={refImage} alt="参考图像" className="w-full h-32 object-contain rounded-lg border-2 border-green-400 bg-gray-50" />
                                        <button
                                            type="button"
                                            onClick={() => { setRefImage(null); setRefImageUrl(null); }}
                                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-400 hover:bg-green-50/30 transition-colors">
                                        <Upload size={20} className="text-gray-400 mb-1" />
                                        <span className="text-xs text-gray-500">参考风格图</span>
                                        <input type="file" accept="image/*" onChange={handleRefImageUpload} className="hidden" />
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 参考提示词 */}
                    <div>
                        <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                            <Sparkles className="text-gray-500" size={12} />
                            背景描述
                        </label>
                        <textarea
                            value={refPrompt}
                            onChange={(e) => setRefPrompt(e.target.value)}
                            placeholder="描述期望的背景，如：山脉和晚霞、森林和阳光、城市夜景..."
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 transition-all resize-none h-16"
                        />
                    </div>

                    {/* 基础参数 */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                                <Hash className="text-gray-500" size={12} />
                                生成数量
                            </label>
                            <select
                                value={n}
                                onChange={(e) => setN(e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 transition-all"
                            >
                                {[1, 2, 3, 4].map(num => (
                                    <option key={num} value={num}>{num}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                                <Sparkles className="text-gray-500" size={12} />
                                模型版本
                            </label>
                            <select
                                value={modelVersion}
                                onChange={(e) => setModelVersion(e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 transition-all"
                            >
                                <option value="v2">v2 (速度快)</option>
                                <option value="v3">v3 (效果好)</option>
                            </select>
                        </div>

                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                                噪声等级
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="999"
                                value={noiseLevel}
                                onChange={(e) => setNoiseLevel(e.target.value)}
                                disabled={!refImageUrl}
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 transition-all disabled:bg-gray-100 disabled:text-gray-400"
                            />
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
                                {/* 负向提示词 */}
                                <div>
                                    <label className="text-xs font-medium text-gray-600 mb-1 block">负向提示词</label>
                                    <textarea
                                        value={negRefPrompt}
                                        onChange={(e) => setNegRefPrompt(e.target.value)}
                                        placeholder="描述不希望出现的内容..."
                                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 transition-all resize-none h-12"
                                    />
                                </div>

                                {/* 提示词权重 */}
                                {refImageUrl && refPrompt && (
                                    <div>
                                        <label className="text-xs font-medium text-gray-600 mb-1 block">
                                            提示词权重: {refPromptWeight}
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={refPromptWeight}
                                            onChange={(e) => setRefPromptWeight(e.target.value)}
                                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-500"
                                        />
                                    </div>
                                )}

                                {/* 前景边缘引导 */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-xs font-medium text-gray-600">前景边缘引导</label>
                                        <label className="flex items-center gap-1 text-xs text-violet-600 cursor-pointer hover:text-violet-700">
                                            <Plus size={12} />
                                            添加
                                            <input type="file" accept="image/png" multiple onChange={(e) => handleEdgeUpload(e, 'foreground')} className="hidden" />
                                        </label>
                                    </div>
                                    {foregroundEdges.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {foregroundEdges.map((edge, index) => (
                                                <div key={index} className="relative group">
                                                    <img src={edge.preview} alt={`前景${index + 1}`} className="w-14 h-14 object-cover rounded border border-purple-300" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeEdge('foreground', index)}
                                                        className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X size={10} />
                                                    </button>
                                                    <input
                                                        type="text"
                                                        value={edge.prompt}
                                                        onChange={(e) => updateEdgePrompt('foreground', index, e.target.value)}
                                                        placeholder="描述"
                                                        className="w-14 text-[10px] mt-0.5 p-0.5 border rounded"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* 背景边缘引导 */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-xs font-medium text-gray-600">背景边缘引导</label>
                                        <label className="flex items-center gap-1 text-xs text-violet-600 cursor-pointer hover:text-violet-700">
                                            <Plus size={12} />
                                            添加
                                            <input type="file" accept="image/png" multiple onChange={(e) => handleEdgeUpload(e, 'background')} className="hidden" />
                                        </label>
                                    </div>
                                    {backgroundEdges.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {backgroundEdges.map((edge, index) => (
                                                <div key={index} className="relative group">
                                                    <img src={edge.preview} alt={`背景${index + 1}`} className="w-14 h-14 object-cover rounded border border-orange-300" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeEdge('background', index)}
                                                        className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X size={10} />
                                                    </button>
                                                    <input
                                                        type="text"
                                                        value={edge.prompt}
                                                        onChange={(e) => updateEdgePrompt('background', index, e.target.value)}
                                                        placeholder="描述"
                                                        className="w-14 text-[10px] mt-0.5 p-0.5 border rounded"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 提交按钮 */}
                    <button
                        type="submit"
                        disabled={isGenerating || !baseImageUrl}
                        className="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white py-2.5 px-4 rounded-lg font-medium hover:from-violet-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                生成中...
                            </>
                        ) : (
                            <>
                                <Sparkles size={16} />
                                生成背景
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default BackgroundGenerator;
