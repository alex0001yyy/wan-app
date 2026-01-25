import React, { useState } from 'react';
import { Video, Image as ImageIcon, Scissors, Expand, Edit3, Camera, ChevronDown } from 'lucide-react';
import { VACE_PLUS_MODELS, RESOLUTION_LABELS } from '../config/models';
import { uploadFileSimple } from '../hooks/useFileUpload';

const VideoEditor = ({ onGenerate, isGenerating, apiKey }) => {
    const defaultModel = VACE_PLUS_MODELS[0];
    const [uploading, setUploading] = useState({ refImage: [], video: false, mask: false });
    const [selectedFunction, setSelectedFunction] = useState('image_reference');
    const [prompt, setPrompt] = useState('');
    const [refImages, setRefImages] = useState([{ value: '', file: null, preview: '', role: 'obj' }]);
    const [inputVideo, setInputVideo] = useState({ value: '', file: null, preview: '' });
    const [maskImage, setMaskImage] = useState({ value: '', file: null, preview: '' });
    const [selectedModelId, setSelectedModelId] = useState(defaultModel.id);
    const [resolution, setResolution] = useState(defaultModel.defaultRes);
    // duration 固定为 5 秒，API 不支持修改
    const [promptExtend, setPromptExtend] = useState(true);
    const [seed, setSeed] = useState('');
    const [watermark, setWatermark] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const currentModelConfig = VACE_PLUS_MODELS.find(m => m.id === selectedModelId) || defaultModel;

    // 检查是否已有图片被设为背景（最多只能有一个 bg）
    const hasBgSelected = refImages.some((img, idx) => img.role === 'bg' && img.preview);

    // Handle reference image file selection
    const handleRefImageFileChange = async (index, e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                try {
                    const preview = URL.createObjectURL(file);
                    const newRefImages = [...refImages];
                    newRefImages[index] = {
                        ...newRefImages[index],
                        value: '',
                        file,
                        preview
                    };
                    setRefImages(newRefImages);
                    
                    setUploading(prev => {
                        const newRefUploading = [...(prev.refImage || [])];
                        newRefUploading[index] = true;
                        return { ...prev, refImage: newRefUploading };
                    });
                    
                    const url = await uploadFileSimple(file, apiKey, selectedModelId, { requireUrl: true });
                    console.log('✅ 参考图片上传成功:', url);
                    setRefImages(prev => {
                        const updated = [...prev];
                        updated[index] = { ...updated[index], value: url };
                        return updated;
                    });
                } catch (error) {
                    console.error('Error uploading image:', error);
                    alert('图片上传失败: ' + error.message);
                } finally {
                    setUploading(prev => {
                        const newRefUploading = [...(prev.refImage || [])];
                        newRefUploading[index] = false;
                        return { ...prev, refImage: newRefUploading };
                    });
                }
            } else {
                alert('请选择有效的图片文件 (jpg, png, gif等)');
            }
        }
    };

    // Handle input video file selection
    const handleInputVideoFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type.startsWith('video/')) {
                try {
                    setInputVideo({
                        value: '',
                        file,
                        preview: URL.createObjectURL(file)
                    });
                    setUploading(prev => ({ ...prev, video: true }));
                    
                    const url = await uploadFileSimple(file, apiKey, selectedModelId, { requireUrl: true });
                    console.log('✅ 视频上传成功:', url);
                    setInputVideo(prev => ({ ...prev, value: url }));
                } catch (error) {
                    console.error('Error uploading video:', error);
                    alert('视频上传失败: ' + error.message);
                } finally {
                    setUploading(prev => ({ ...prev, video: false }));
                }
            } else {
                alert('请选择有效的视频文件 (mp4, mov等)');
            }
        }
    };

    // Handle mask image file selection
    const handleMaskImageFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                try {
                    setMaskImage({
                        value: '',
                        file,
                        preview: URL.createObjectURL(file)
                    });
                    setUploading(prev => ({ ...prev, mask: true }));
                    
                    const url = await uploadFileSimple(file, apiKey, selectedModelId, { requireUrl: true });
                    console.log('✅ 遮罩图片上传成功:', url);
                    setMaskImage(prev => ({ ...prev, value: url }));
                } catch (error) {
                    console.error('Error uploading mask image:', error);
                    alert('遮罩图片上传失败: ' + error.message);
                } finally {
                    setUploading(prev => ({ ...prev, mask: false }));
                }
            } else {
                alert('请选择有效的图片文件 (jpg, png, gif等)');
            }
        }
    };

    // Add new reference image
    const addRefImage = () => {
        if (refImages.length < 3) {
            setRefImages([...refImages, { value: '', file: null, preview: '', role: 'obj' }]);
        }
    };

    // Remove reference image
    const removeRefImage = (index) => {
        if (refImages.length > 1) {
            const newRefImages = refImages.filter((_, i) => i !== index);
            setRefImages(newRefImages);
        }
    };

    // Update reference image role
    const updateRefImageRole = (index, role) => {
        const newRefImages = [...refImages];
        newRefImages[index].role = role;
        setRefImages(newRefImages);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        let refImagesValue = [];
        let inputVideoValue = '';
        let maskImageValue = '';

        // Prepare reference images (all from file upload)
        for (let img of refImages) {
            if (img.value) {
                refImagesValue.push(img.value); // Base64
            }
        }

        // Prepare input video (from file upload)
        inputVideoValue = inputVideo.value;

        // Prepare mask image (from file upload)
        maskImageValue = maskImage.value;

        // Prepare input object based on selected function
        let inputObj = {
            function: selectedFunction,
            prompt: prompt.trim()
        };

        switch (selectedFunction) {
            case 'image_reference':
                if (refImagesValue.length === 0) return;
                inputObj.ref_images_url = refImagesValue;
                break;
            
            case 'video_repainting':
                if (!inputVideoValue) return;
                inputObj.video_url = inputVideoValue;
                break;
            
            case 'video_edit':
                if (!inputVideoValue || !maskImageValue) return;
                inputObj.video_url = inputVideoValue;
                inputObj.mask_image_url = maskImageValue;
                inputObj.mask_frame_id = 1; // 默认第一帧
                break;
            
            case 'video_outpainting':
                if (!inputVideoValue) return;
                inputObj.video_url = inputVideoValue;
                break;
            
            case 'video_extension':
                if (!inputVideoValue) return;
                inputObj.first_clip_url = inputVideoValue;
                break;
        }

        onGenerate({
            model: selectedModelId,
            input: inputObj,
            parameters: {
                size: resolution,
                // duration 固定为 5，API 不支持修改
                prompt_extend: promptExtend,
                // obj_or_bg 只在 image_reference 功能时有效
                ...(selectedFunction === 'image_reference' && {
                    obj_or_bg: refImages.filter(img => img.value).map(img => img.role)
                }),
                seed: seed ? parseInt(seed) : undefined,
                watermark: watermark
            }
        });
    };

    const getFunctionDescription = (func) => {
        const descriptions = {
            'image_reference': '多图参考视频重绘 - 支持最多3张参考图，可融合生成连贯视频内容',
            'video_repainting': '视频重绘 - 根据提示词重新生成视频内容',
            'video_edit': '局部编辑 - 在指定区域根据提示词修改视频内容',
            'video_outpainting': '视频画面扩展 - 扩展视频画面边界',
            'video_extension': '视频延展 - 延长视频时长（输入片段最长1秒）'
        };
        return descriptions[func] || '';
    };

    return (
        <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">

                {/* Main Interaction Area */}
                <div className="space-y-4">
                    {/* Prompt Input */}
                    <div className="relative">
                        <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 mb-2">
                            <Video size={14} className="text-violet-500" />
                            编辑描述
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="描述你希望的视频效果..."
                            className="w-full min-h-[100px] bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all resize-none"
                            required
                        />
                    </div>

                    {/* Control Bar - Function, Model, Resolution, Duration */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {/* Function Selector */}
                        <div className="col-span-2 md:col-span-1">
                            <label className="text-xs font-medium text-gray-600 mb-1.5 block">编辑功能</label>
                            <div className="relative">
                                <select
                                    value={selectedFunction}
                                    onChange={(e) => setSelectedFunction(e.target.value)}
                                    className="w-full appearance-none bg-gradient-to-br from-white to-gray-50 border border-gray-200 pl-3 pr-10 py-3 rounded-xl text-sm font-semibold text-gray-800 outline-none hover:border-violet-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all cursor-pointer shadow-sm hover:shadow"
                                >
                                    <option value="image_reference">🖼️ 多图参考</option>
                                    <option value="video_repainting">🎬 视频重绘</option>
                                    <option value="video_edit">✂️ 局部编辑</option>
                                    <option value="video_outpainting">🔲 画面扩展</option>
                                    <option value="video_extension">⏱️ 视频延展</option>
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Model Selector */}
                        <div>
                            <label className="text-xs font-medium text-gray-600 mb-1.5 block">模型版本</label>
                            <div className="relative">
                                <select
                                    value={selectedModelId}
                                    onChange={(e) => setSelectedModelId(e.target.value)}
                                    className="w-full appearance-none bg-gradient-to-br from-white to-gray-50 border border-gray-200 pl-3 pr-10 py-3 rounded-xl text-sm font-semibold text-gray-800 outline-none hover:border-violet-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all cursor-pointer shadow-sm hover:shadow"
                                >
                                    {VACE_PLUS_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Resolution Selector */}
                        <div>
                            <label className="text-xs font-medium text-gray-600 mb-1.5 block">分辨率</label>
                            <div className="relative">
                                <select
                                    value={resolution}
                                    onChange={(e) => setResolution(e.target.value)}
                                    className="w-full appearance-none bg-gradient-to-br from-white to-gray-50 border border-gray-200 pl-3 pr-10 py-3 rounded-xl text-sm font-semibold text-gray-800 outline-none hover:border-violet-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all cursor-pointer shadow-sm hover:shadow"
                                >
                                    {currentModelConfig.resolutions.map(res => (
                                        <option key={res} value={res}>{RESOLUTION_LABELS[res] || res}</option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Duration - Fixed 5s for VACE Plus */}
                        <div>
                            <label className="text-xs font-medium text-gray-600 mb-1.5 block">时长</label>
                            <div className="bg-gray-100 border border-gray-200 px-3 py-3 rounded-xl text-sm font-medium text-gray-500">
                                5秒（固定）
                            </div>
                        </div>
                    </div>

                    {/* Upload Section - Dynamic based on selectedFunction */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3 flex-wrap">
                            {/* Reference Images - for image_reference function */}
                            {selectedFunction === 'image_reference' && (
                                <>
                                    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 whitespace-nowrap">
                                        <ImageIcon className="text-blue-600" size={14} />
                                        参考图片 ({refImages.filter(img => img.preview).length}/3)
                                    </label>
                                    {refImages.map((img, index) => (
                                        <div key={index}>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleRefImageFileChange(index, e)}
                                                className="hidden"
                                                id={`ref-image-${index}`}
                                            />
                                            {img.preview ? (
                                                <div className="relative group">
                                                    <img 
                                                        src={img.preview} 
                                                        alt={`参考${index + 1}`} 
                                                        className="h-8 w-auto object-cover rounded cursor-pointer"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newRefImages = [...refImages];
                                                            newRefImages[index] = { value: '', file: null, preview: '', role: 'obj' };
                                                            setRefImages(newRefImages);
                                                        }}
                                                        className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        ✕
                                                    </button>
                                                    {/* Role selector - tiny badge */}
                                                    <select
                                                        value={img.role}
                                                        onChange={(e) => updateRefImageRole(index, e.target.value)}
                                                        className="absolute -bottom-1 left-0 right-0 text-[10px] bg-white/90 border border-gray-200 rounded px-1 py-0.5 cursor-pointer"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <option value="obj">主体</option>
                                                        <option value="bg" disabled={hasBgSelected && img.role !== 'bg'}>
                                                            背景{hasBgSelected && img.role !== 'bg' ? '（已有）' : ''}
                                                        </option>
                                                    </select>
                                                    {uploading.refImage?.[index] && (
                                                        <div className="absolute inset-0 bg-black/30 rounded flex items-center justify-center">
                                                            <div className="animate-spin h-3 w-3 border-2 border-white/30 border-t-white rounded-full" />
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <label 
                                                    htmlFor={`ref-image-${index}`}
                                                    className="h-8 px-3 flex items-center gap-2 border border-dashed border-gray-300 rounded bg-white hover:bg-gray-50 cursor-pointer transition-all"
                                                >
                                                    <Camera className="text-gray-400" size={14} />
                                                    <span className="text-xs text-gray-500">图{index + 1}</span>
                                                </label>
                                            )}
                                        </div>
                                    ))}
                                    {/* 添加更多图片按钮 */}
                                    {refImages.length < 3 && (
                                        <button
                                            type="button"
                                            onClick={addRefImage}
                                            className="h-8 px-3 flex items-center gap-1 border border-dashed border-blue-300 rounded bg-blue-50 hover:bg-blue-100 text-blue-600 cursor-pointer transition-all"
                                        >
                                            <span className="text-lg leading-none">+</span>
                                            <span className="text-xs">添加</span>
                                        </button>
                                    )}
                                </>
                            )}

                            {/* Input Video - for video functions */}
                            {(selectedFunction === 'video_repainting' || selectedFunction === 'video_edit' || selectedFunction === 'video_outpainting' || selectedFunction === 'video_extension') && (
                                <>
                                    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 whitespace-nowrap">
                                        <Video className="text-green-600" size={14} />
                                        输入视频
                                    </label>
                                    <input
                                        type="file"
                                        accept="video/*"
                                        onChange={handleInputVideoFileChange}
                                        className="hidden"
                                        id="input-video-upload"
                                    />
                                    {inputVideo.preview ? (
                                        <div className="relative group">
                                            <video 
                                                src={inputVideo.preview} 
                                                className="h-8 w-auto object-cover rounded cursor-pointer"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setInputVideo({ value: '', file: null, preview: '' })}
                                                className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                ✕
                                            </button>
                                            {uploading.video && (
                                                <div className="absolute inset-0 bg-black/30 rounded flex items-center justify-center">
                                                    <div className="animate-spin h-3 w-3 border-2 border-white/30 border-t-white rounded-full" />
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <label 
                                            htmlFor="input-video-upload"
                                            className="h-8 px-3 flex items-center gap-2 border border-dashed border-gray-300 rounded bg-white hover:bg-gray-50 cursor-pointer transition-all"
                                        >
                                            <Video className="text-gray-400" size={14} />
                                            <span className="text-xs text-gray-500">点击上传</span>
                                        </label>
                                    )}
                                </>
                            )}

                            {/* Mask Image - only for video_edit */}
                            {selectedFunction === 'video_edit' && (
                                <>
                                    <div className="h-6 w-px bg-gray-300"></div>
                                    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 whitespace-nowrap">
                                        <Edit3 className="text-orange-600" size={14} />
                                        掩码图像
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleMaskImageFileChange}
                                        className="hidden"
                                        id="mask-image-upload"
                                    />
                                    {maskImage.preview ? (
                                        <div className="relative group">
                                            <img 
                                                src={maskImage.preview} 
                                                alt="遮罩" 
                                                className="h-8 w-auto object-cover rounded cursor-pointer"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setMaskImage({ value: '', file: null, preview: '' })}
                                                className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                ✕
                                            </button>
                                            {uploading.mask && (
                                                <div className="absolute inset-0 bg-black/30 rounded flex items-center justify-center">
                                                    <div className="animate-spin h-3 w-3 border-2 border-white/30 border-t-white rounded-full" />
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <label 
                                            htmlFor="mask-image-upload"
                                            className="h-8 px-3 flex items-center gap-2 border border-dashed border-gray-300 rounded bg-white hover:bg-gray-50 cursor-pointer transition-all"
                                        >
                                            <Edit3 className="text-gray-400" size={14} />
                                            <span className="text-xs text-gray-500">点击上传</span>
                                        </label>
                                    )}
                                </>
                            )}
                        </div>
                        {/* Function hint */}
                        <div className="mt-2 text-xs text-gray-500">
                            {getFunctionDescription(selectedFunction)}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${showAdvanced ? 'bg-violet-100 text-violet-700 border border-violet-200' : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-150'}`}
                    >
                        <Scissors size={16} className="inline mr-2" />
                        {showAdvanced ? '收起设置' : '高级设置'}
                    </button>
                    
                    <button
                        type="submit"
                        disabled={isGenerating || !prompt.trim()}
                        className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold py-2.5 px-6 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-violet-500/30"
                    >
                        {isGenerating ? (
                            <>
                                <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                                <span>生成中...</span>
                            </>
                        ) : (
                            <>
                                <Video size={18} />
                                <span>开始编辑</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Advanced Settings */}
                {showAdvanced && (
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border border-gray-200 space-y-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Seed */}
                            <div>
                                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">随机种子</label>
                                <input
                                    type="number"
                                    value={seed}
                                    onChange={(e) => setSeed(e.target.value)}
                                    placeholder="保持生成一致性"
                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                                />
                            </div>
                        </div>

                        {/* Checkboxes */}
                        <div className="flex flex-wrap gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={promptExtend}
                                    onChange={(e) => setPromptExtend(e.target.checked)}
                                    className="w-4 h-4 text-violet-600 bg-gray-100 border-gray-300 rounded focus:ring-violet-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Prompt智能改写</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={watermark}
                                    onChange={(e) => setWatermark(e.target.checked)}
                                    className="w-4 h-4 text-violet-600 bg-gray-100 border-gray-300 rounded focus:ring-violet-500"
                                />
                                <span className="text-sm font-medium text-gray-700">添加水印</span>
                            </label>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};

export default VideoEditor;
