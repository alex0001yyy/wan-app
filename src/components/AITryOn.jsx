import React, { useState, useEffect } from 'react';
import { uploadFileSimple } from '../hooks/useFileUpload';
import { Sparkles, User, Shirt, Settings2, Upload, Wand2, ChevronDown, X, Layers } from 'lucide-react';

const AITryOn = ({ onGenerate, isGenerating, apiKey }) => {
    const [uploading, setUploading] = useState({ person: false, top: false, bottom: false });
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [personImage, setPersonImage] = useState(null);
    const [personImageUrl, setPersonImageUrl] = useState(null);
    const [topGarment, setTopGarment] = useState(null);
    const [topGarmentUrl, setTopGarmentUrl] = useState(null);
    const [bottomGarment, setBottomGarment] = useState(null);
    const [bottomGarmentUrl, setBottomGarmentUrl] = useState(null);
    const [modelType, setModelType] = useState('aitryon-plus');
    const [resolution, setResolution] = useState(-1);
    const [restoreFace, setRestoreFace] = useState(true);

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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!personImageUrl) {
            alert('请上传模特图像');
            return;
        }

        if (!topGarmentUrl && !bottomGarmentUrl) {
            alert('请至少上传上装或下装图像');
            return;
        }

        const taskData = {
            model: modelType,
            input: {
                person_image_url: personImageUrl
            },
            parameters: {
                resolution: parseInt(resolution),
                restore_face: restoreFace
            }
        };

        if (topGarmentUrl) {
            taskData.input.top_garment_url = topGarmentUrl;
        }

        if (bottomGarmentUrl) {
            taskData.input.bottom_garment_url = bottomGarmentUrl;
        }

        if (onGenerate) {
            onGenerate(taskData);
        }
    };

    const handlePersonImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            // 设置本地预览
            setPersonImage(URL.createObjectURL(file));
            
            // 上传到 OSS
            try {
                setUploading(prev => ({ ...prev, person: true }));
                const url = await uploadFileSimple(file, apiKey, modelType);
                setPersonImageUrl(url);
            } catch (error) {
                alert('模特图像上传失败: ' + error.message);
            } finally {
                setUploading(prev => ({ ...prev, person: false }));
            }
        }
    };

    const handleTopGarmentUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            // 设置本地预览
            setTopGarment(URL.createObjectURL(file));
            
            // 上传到 OSS
            try {
                setUploading(prev => ({ ...prev, top: true }));
                const url = await uploadFileSimple(file, apiKey, modelType);
                setTopGarmentUrl(url);
            } catch (error) {
                alert('上装图像上传失败: ' + error.message);
            } finally {
                setUploading(prev => ({ ...prev, top: false }));
            }
        }
    };

    const handleBottomGarmentUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            // 设置本地预览
            setBottomGarment(URL.createObjectURL(file));
            
            // 上传到 OSS
            try {
                setUploading(prev => ({ ...prev, bottom: true }));
                const url = await uploadFileSimple(file, apiKey, modelType);
                setBottomGarmentUrl(url);
            } catch (error) {
                alert('下装图像上传失败: ' + error.message);
            } finally {
                setUploading(prev => ({ ...prev, bottom: false }));
            }
        }
    };

    const removePersonImage = () => {
        setPersonImage(null);
        setPersonImageUrl(null);
    };

    const removeTopGarment = () => {
        setTopGarment(null);
        setTopGarmentUrl(null);
    };

    const removeBottomGarment = () => {
        setBottomGarment(null);
        setBottomGarmentUrl(null);
    };

    return (
        <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Control Bar - Model & Resolution Selection */}
                <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {/* 模型选择 */}
                    <div>
                            <label className="text-xs font-medium text-gray-600 mb-1.5 block">模型版本</label>
                        <div className="relative">
                            <select
                                value={modelType}
                                onChange={(e) => setModelType(e.target.value)}
                                className="w-full appearance-none bg-gradient-to-br from-white to-gray-50 border border-gray-200 pl-3 pr-10 py-3 rounded-xl text-sm font-semibold text-gray-800 outline-none hover:border-violet-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all cursor-pointer shadow-sm hover:shadow"
                                disabled={isGenerating}
                            >
                                <option value="aitryon-plus">AI试衣-Plus版</option>
                                <option value="aitryon">AI试衣-基础版</option>
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* 分辨率 */}
                    <div>
                            <label className="text-xs font-medium text-gray-600 mb-1.5 block">输出分辨率</label>
                        <div className="relative">
                            <select
                                value={resolution}
                                onChange={(e) => setResolution(e.target.value)}
                                className="w-full appearance-none bg-gradient-to-br from-white to-gray-50 border border-gray-200 pl-3 pr-10 py-3 rounded-xl text-sm font-semibold text-gray-800 outline-none hover:border-violet-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all cursor-pointer shadow-sm hover:shadow"
                                disabled={isGenerating}
                            >
                                <option value="-1">同原图</option>
                                <option value="1024">576×1024</option>
                                <option value="1280">720×1280</option>
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* 人脸处理 */}
                    <div>
                            <label className="text-xs font-medium text-gray-600 mb-1.5 block">人脸处理</label>
                        <div className="relative">
                            <select
                                value={restoreFace.toString()}
                                onChange={(e) => setRestoreFace(e.target.value === 'true')}
                                className="w-full appearance-none bg-gradient-to-br from-white to-gray-50 border border-gray-200 pl-3 pr-10 py-3 rounded-xl text-sm font-semibold text-gray-800 outline-none hover:border-violet-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all cursor-pointer shadow-sm hover:shadow"
                                disabled={isGenerating}
                            >
                                <option value="true">保留原脸</option>
                                <option value="false">随机生成</option>
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                        </div>
                    </div>

                    {/* Image Upload Section */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3 mb-3">
                            <label className="text-xs font-medium text-gray-600 whitespace-nowrap">上传素材</label>
                        </div>
                        <div className="flex items-center gap-6 flex-wrap">
                        {/* 模特图像 */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <Upload className="text-violet-600" size={16} />
                                <span className="text-sm font-medium text-gray-700">模特图像</span>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handlePersonImageUpload}
                                className="hidden"
                                id="person-image-upload"
                                required
                                disabled={isGenerating}
                            />
                            {personImage ? (
                                <div className="relative group">
                                    <img 
                                        src={personImage} 
                                        alt="模特预览" 
                                        className="h-9 w-auto object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity ring-2 ring-violet-400 ring-offset-1"
                                        onClick={() => setPreviewImage(personImage)}
                                    />
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); removePersonImage(); }}
                                        className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={10} />
                                    </button>
                                </div>
                            ) : (
                                <label 
                                    htmlFor="person-image-upload"
                                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                                >
                                    {uploading.person ? (
                                        <><div className="animate-spin h-3 w-3 border-2 border-gray-300 border-t-violet-500 rounded-full" /><span>上传中...</span></>
                                    ) : (
                                        <><Upload size={14} /><span>点击上传</span></>
                                    )}
                                </label>
                            )}
                        </div>

                        {/* 分隔线 */}
                        <div className="h-8 w-px bg-gray-200"></div>

                        {/* 上装图像 */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <Layers className="text-green-600" size={16} />
                                <span className="text-sm font-medium text-gray-700">上装图像</span>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleTopGarmentUpload}
                                className="hidden"
                                id="top-garment-upload"
                                disabled={isGenerating}
                            />
                            {topGarment ? (
                                <div className="relative group">
                                    <img 
                                        src={topGarment} 
                                        alt="上装预览" 
                                        className="h-9 w-auto object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity ring-2 ring-green-400 ring-offset-1"
                                        onClick={() => setPreviewImage(topGarment)}
                                    />
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); removeTopGarment(); }}
                                        className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={10} />
                                    </button>
                                </div>
                            ) : (
                                <label 
                                    htmlFor="top-garment-upload"
                                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                                >
                                    {uploading.top ? (
                                        <><div className="animate-spin h-3 w-3 border-2 border-gray-300 border-t-green-500 rounded-full" /><span>上传中...</span></>
                                    ) : (
                                        <><Upload size={14} /><span>点击上传</span></>
                                    )}
                                </label>
                            )}
                        </div>

                        {/* 分隔线 */}
                        <div className="h-8 w-px bg-gray-200"></div>

                        {/* 下装图像 */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <Layers className="text-orange-500" size={16} />
                                <span className="text-sm font-medium text-gray-700">下装图像</span>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleBottomGarmentUpload}
                                className="hidden"
                                id="bottom-garment-upload"
                                disabled={isGenerating}
                            />
                            {bottomGarment ? (
                                <div className="relative group">
                                    <img 
                                        src={bottomGarment} 
                                        alt="下装预览" 
                                        className="h-9 w-auto object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity ring-2 ring-orange-400 ring-offset-1"
                                        onClick={() => setPreviewImage(bottomGarment)}
                                    />
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); removeBottomGarment(); }}
                                        className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={10} />
                                    </button>
                                </div>
                            ) : (
                                <label 
                                    htmlFor="bottom-garment-upload"
                                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                                >
                                    {uploading.bottom ? (
                                        <><div className="animate-spin h-3 w-3 border-2 border-gray-300 border-t-orange-500 rounded-full" /><span>上传中...</span></>
                                    ) : (
                                        <><Upload size={14} /><span>点击上传</span></>
                                    )}
                                </label>
                            )}
                        </div>
                    </div>

                        {/* 提示信息 */}
                        <div className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-200">
                            <span className="font-medium text-gray-500">图像要求：</span>模特需全身正面照，服装需平铺拍摄、背景干净，上装和下装至少上传一个
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-150"
                    >
                        <Settings2 size={16} className="inline mr-2" />
                        高级设置
                    </button>
                    
                    <button
                        type="submit"
                        disabled={isGenerating}
                        className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? (
                            <>
                                <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                                <span>试衣中...</span>
                            </>
                        ) : (
                            <>
                                <Wand2 size={18} />
                                <span>开始试衣</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Advanced Settings Panel */}
                {showAdvanced && (
                    <div className="bg-white rounded-xl p-5 border border-gray-200 space-y-4">
                        {/* 提示信息 */}
                        <div className="bg-violet-50 p-4 rounded-lg text-sm text-violet-700">
                            <strong>使用提示：</strong>
                            <ul className="mt-2 space-y-1 list-disc list-inside text-violet-600">
                                <li>Plus版 (0.50元/张) 在清晰度、纹理细节、Logo还原方面更优</li>
                                <li>基础版 (0.20元/张) 速度快，适合对速度要求高的场景</li>
                                <li>生成结果有效期24小时，请及时下载</li>
                            </ul>
                        </div>
                    </div>
                )}
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
};

export default AITryOn;
