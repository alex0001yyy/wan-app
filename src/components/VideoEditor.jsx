import React, { useState } from 'react';
import { Video, Image as ImageIcon, Scissors, Expand, Edit3, Camera, ChevronDown } from 'lucide-react';
import { VACE_PLUS_MODELS, RESOLUTION_LABELS } from '../config/models';

const VideoEditor = ({ onGenerate, isGenerating }) => {
    const defaultModel = VACE_PLUS_MODELS[0];
    const [selectedFunction, setSelectedFunction] = useState('image_reference');
    const [prompt, setPrompt] = useState('');
    const [refImages, setRefImages] = useState([{ value: '', file: null, preview: '', role: 'obj' }]);
    const [inputVideo, setInputVideo] = useState({ value: '', file: null, preview: '' });
    const [maskImage, setMaskImage] = useState({ value: '', file: null, preview: '' });
    const [selectedModelId, setSelectedModelId] = useState(defaultModel.id);
    const [resolution, setResolution] = useState(defaultModel.defaultRes);
    const [duration, setDuration] = useState(5);
    const [promptExtend, setPromptExtend] = useState(true);
    const [seed, setSeed] = useState('');
    const [watermark, setWatermark] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const currentModelConfig = VACE_PLUS_MODELS.find(m => m.id === selectedModelId) || defaultModel;

    // Convert file to base64
    const convertFileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    };

    // Handle reference image file selection
    const handleRefImageFileChange = async (index, e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                try {
                    const base64 = await convertFileToBase64(file);
                    const newRefImages = [...refImages];
                    newRefImages[index] = {
                        ...newRefImages[index],
                        value: base64,
                        file,
                        preview: URL.createObjectURL(file)
                    };
                    setRefImages(newRefImages);
                } catch (error) {
                    console.error('Error converting image to base64:', error);
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
                    const base64 = await convertFileToBase64(file);
                    setInputVideo({
                        value: base64,
                        file,
                        preview: URL.createObjectURL(file)
                    });
                } catch (error) {
                    console.error('Error converting video to base64:', error);
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
                    const base64 = await convertFileToBase64(file);
                    setMaskImage({
                        value: base64,
                        file,
                        preview: URL.createObjectURL(file)
                    });
                } catch (error) {
                    console.error('Error converting image to base64:', error);
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
            
            case 'video_remap':
                if (!inputVideoValue) return;
                inputObj.video_url = inputVideoValue;
                break;
            
            case 'local_edit':
                if (!inputVideoValue || !maskImageValue) return;
                inputObj.video_url = inputVideoValue;
                inputObj.mask_url = maskImageValue;
                break;
            
            case 'video_expand':
                if (!inputVideoValue) return;
                inputObj.video_url = inputVideoValue;
                break;
            
            case 'video_extend':
                if (!inputVideoValue) return;
                inputObj.video_url = inputVideoValue;
                break;
        }

        onGenerate({
            model: selectedModelId,
            input: inputObj,
            parameters: {
                size: resolution,
                duration: parseInt(duration),
                prompt_extend: promptExtend,
                obj_or_bg: refImages.map(img => img.role),
                seed: seed ? parseInt(seed) : undefined,
                watermark: watermark
            }
        });
    };

    const getFunctionDescription = (func) => {
        const descriptions = {
            'image_reference': '多图参考视频重绘 - 支持最多3张参考图，可融合生成连贯视频内容',
            'video_remap': '视频重绘 - 根据提示词重新生成视频内容',
            'local_edit': '局部编辑 - 在指定区域根据提示词修改视频内容',
            'video_expand': '视频画面扩展 - 扩展视频画面边界',
            'video_extend': '视频延展 - 延长视频时长'
        };
        return descriptions[func] || '';
    };

    return (
        <div className="fade-in-up h-full">
            <div className="max-w-full mx-auto h-full p-1">
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                    {/* Function Selection */}
                    <div className="flex flex-wrap gap-2">
                        {[
                            { value: 'image_reference', label: '多图参考', icon: ImageIcon },
                            { value: 'video_remap', label: '视频重绘', icon: Video },
                            { value: 'local_edit', label: '局部编辑', icon: Edit3 },
                            { value: 'video_expand', label: '画面扩展', icon: Expand },
                            { value: 'video_extend', label: '视频延展', icon: Scissors }
                        ].map(({ value, label, icon: Icon }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setSelectedFunction(value)}
                                className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg border transition-all ${
                                    selectedFunction === value
                                        ? 'bg-blue-100 border-blue-300 text-blue-700 shadow-sm'
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <Icon size={16} />
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="text-sm text-gray-500 p-2 bg-gray-50 rounded-lg">
                        {getFunctionDescription(selectedFunction)}
                    </div>

                    {/* Reference Images Input (for image_reference) */}
                    {selectedFunction === 'image_reference' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <ImageIcon size={20} className="text-blue-500" />
                                参考图片 (最多3张)
                            </h3>
                            
                            {refImages.map((img, index) => (
                                <div key={index} className="border border-gray-200 rounded-xl p-4 bg-white">
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-sm font-bold text-gray-700">
                                            参考图片 {index + 1}
                                        </label>
                                        <div className="flex gap-2">
                                            <select
                                                value={img.role}
                                                onChange={(e) => updateRefImageRole(index, e.target.value)}
                                                className="text-xs bg-gray-100 border border-gray-200 rounded px-2 py-1"
                                            >
                                                <option value="obj">主体</option>
                                                <option value="bg">背景</option>
                                            </select>
                                            {refImages.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeRefImage(index)}
                                                    className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200"
                                                >
                                                    删除
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                                {/* File Upload */}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleRefImageFileChange(index, e)}
                                                    className="hidden"
                                                    id={`ref-image-upload-${index}`}
                                                />
                                                {img.preview ? (
                                                    <div className="relative group">
                                                        <img 
                                                            src={img.preview} 
                                                            alt="Preview" 
                                                            className="w-full h-20 object-cover rounded-lg cursor-pointer"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newRefImages = [...refImages];
                                                                newRefImages[index] = { ...newRefImages[index], value: '', file: null, preview: '' };
                                                                setRefImages(newRefImages);
                                                            }}
                                                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            ✕
                                                        </button>
                                                        <div className="mt-2 text-xs text-gray-500 truncate">
                                                            {img.file?.name || '图片文件'}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <label 
                                                        htmlFor={`ref-image-upload-${index}`}
                                                        className="w-full bg-white border border-gray-100 rounded-xl px-4 py-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all shadow-sm"
                                                    >
                                                        <Camera size={20} className="text-gray-400 mb-2" />
                                                        <span className="text-sm font-medium text-gray-500">点击选择图片</span>
                                                    </label>
                                                )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            {refImages.length < 3 && (
                                <button
                                    type="button"
                                    onClick={addRefImage}
                                    className="w-full bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold py-3 rounded-xl border border-dashed border-gray-300 transition-all"
                                >
                                    + 添加参考图片
                                </button>
                            )}
                        </div>
                    )}

                    {/* Input Video (for video_remap, local_edit, video_expand, video_extend) */}
                    {(selectedFunction === 'video_remap' || selectedFunction === 'local_edit' || selectedFunction === 'video_expand' || selectedFunction === 'video_extend') && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Video size={20} className="text-green-500" />
                                输入视频
                            </h3>
                            
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    {/* File Upload */}
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
                                                className="w-full h-20 object-cover rounded-lg cursor-pointer"
                                                controls
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setInputVideo({ value: '', file: null, preview: '' })}
                                                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                ✕
                                            </button>
                                            <div className="mt-2 text-xs text-gray-500 truncate">
                                                {inputVideo.file?.name || '视频文件'}
                                            </div>
                                        </div>
                                    ) : (
                                        <label 
                                            htmlFor="input-video-upload"
                                            className="w-full bg-white border border-gray-100 rounded-xl px-4 py-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all shadow-sm"
                                        >
                                            <Video size={20} className="text-gray-400 mb-2" />
                                            <span className="text-sm font-medium text-gray-500">点击选择视频</span>
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Mask Image (for local_edit) */}
                    {selectedFunction === 'local_edit' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Edit3 size={20} className="text-orange-500" />
                                掩码图像 (白色区域表示编辑区域)
                            </h3>
                            
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    {/* File Upload */}
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
                                                alt="Mask Preview" 
                                                className="w-full h-20 object-cover rounded-lg cursor-pointer"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setMaskImage({ value: '', file: null, preview: '' })}
                                                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                ✕
                                            </button>
                                            <div className="mt-2 text-xs text-gray-500 truncate">
                                                {maskImage.file?.name || '掩码图像'}
                                            </div>
                                        </div>
                                    ) : (
                                        <label 
                                            htmlFor="mask-image-upload"
                                            className="w-full bg-white border border-gray-100 rounded-xl px-4 py-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all shadow-sm"
                                        >
                                            <Edit3 size={20} className="text-gray-400 mb-2" />
                                            <span className="text-sm font-medium text-gray-500">点击选择掩码图像</span>
                                            <span className="text-xs text-gray-400 mt-1">白色区域=编辑区域</span>
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Prompt Input */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                            <Camera size={16} className="text-purple-500" />
                            提示词 (Prompt)
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="描述期望生成的视频画面内容，支持中英文，长度不超过800个字符..."
                            className="w-full min-h-[120px] bg-white border border-gray-100 rounded-xl px-4 py-3 text-gray-900 text-sm font-medium outline-none focus:border-purple-300 shadow-sm transition-all resize-none"
                        />
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col lg:flex-row gap-4 items-end">
                        <div className="flex-1 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Model */}
                                <div className="relative min-w-[200px]">
                                    <select
                                        value={selectedModelId}
                                        onChange={(e) => setSelectedModelId(e.target.value)}
                                        className="w-full h-full appearance-none bg-white border border-gray-100 px-4 py-3 rounded-xl text-sm font-bold text-gray-700 shadow-sm outline-none hover:bg-gray-50 transition-all cursor-pointer border-l-4 border-l-blue-500"
                                    >
                                        {VACE_PLUS_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </select>
                                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                                </div>

                                {/* Resolution */}
                                <div className="relative">
                                    <select
                                        value={resolution}
                                        onChange={(e) => setResolution(e.target.value)}
                                        className="w-full h-full appearance-none bg-white border border-gray-100 px-4 py-3 rounded-xl text-sm font-bold text-gray-700 shadow-sm outline-none hover:bg-gray-50 transition-all cursor-pointer border-l-4 border-l-green-500"
                                    >
                                        {currentModelConfig.resolutions.map(res => (
                                            <option key={res} value={res}>{RESOLUTION_LABELS[res] || res}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all"
                            >
                                {showAdvanced ? '隐藏高级设置' : '高级设置'}
                            </button>
                            
                            <button
                                type="submit"
                                disabled={isGenerating || !prompt.trim()}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-30 shadow-lg"
                            >
                                {isGenerating ? (
                                    <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" />
                                ) : (
                                    <>
                                        <Video size={16} />
                                        <span>生成视频</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Advanced Settings */}
                    {showAdvanced && (
                        <div className="bg-white/40 backdrop-blur rounded-xl p-6 border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                                        视频时长
                                    </label>
                                    <select
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                        className="w-full bg-white border border-gray-50 rounded-lg px-3 py-2 text-sm font-bold outline-none"
                                    >
                                        <option value={5}>5秒 (固定)</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                                        随机种子
                                    </label>
                                    <input
                                        type="number"
                                        value={seed}
                                        onChange={(e) => setSeed(e.target.value)}
                                        placeholder="保持生成一致性"
                                        className="w-full bg-white border border-gray-50 rounded-lg px-3 py-2 text-sm font-mono outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="prompt_extend"
                                        checked={promptExtend}
                                        onChange={(e) => setPromptExtend(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="prompt_extend" className="text-sm font-bold text-gray-700">
                                        开启Prompt智能改写
                                    </label>
                                </div>

                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="watermark"
                                        checked={watermark}
                                        onChange={(e) => setWatermark(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="watermark" className="text-sm font-bold text-gray-700">
                                        添加水印 (AI生成)
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default VideoEditor;
