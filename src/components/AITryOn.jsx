import React, { useState } from 'react';
import { handleFileUpload, uploadFileToTempServer } from '../utils/fileUpload';

const AITryOn = ({ onGenerate, isGenerating }) => {
    const [personImage, setPersonImage] = useState(null);
    const [personImageUrl, setPersonImageUrl] = useState(null);
    const [topGarment, setTopGarment] = useState(null);
    const [topGarmentUrl, setTopGarmentUrl] = useState(null);
    const [bottomGarment, setBottomGarment] = useState(null);
    const [bottomGarmentUrl, setBottomGarmentUrl] = useState(null);
    const [modelType, setModelType] = useState('aitryon');
    const [resolution, setResolution] = useState(-1);
    const [restoreFace, setRestoreFace] = useState(true);

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
            const reader = new FileReader();
            reader.onload = (e) => setPersonImage(e.target.result);
            reader.readAsDataURL(file);
            
            // 上传到服务器获取URL
            try {
                const url = await uploadFileToTempServer(file);
                setPersonImageUrl(url);
            } catch (error) {
                alert('模特图像上传失败: ' + error.message);
            }
        }
    };

    const handleTopGarmentUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            // 设置本地预览
            const reader = new FileReader();
            reader.onload = (e) => setTopGarment(e.target.result);
            reader.readAsDataURL(file);
            
            // 上传到服务器获取URL
            try {
                const url = await uploadFileToTempServer(file);
                setTopGarmentUrl(url);
            } catch (error) {
                alert('上装图像上传失败: ' + error.message);
            }
        }
    };

    const handleBottomGarmentUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            // 设置本地预览
            const reader = new FileReader();
            reader.onload = (e) => setBottomGarment(e.target.result);
            reader.readAsDataURL(file);
            
            // 上传到服务器获取URL
            try {
                const url = await uploadFileToTempServer(file);
                setBottomGarmentUrl(url);
            } catch (error) {
                alert('下装图像上传失败: ' + error.message);
            }
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">AI 试衣</h3>
            <p className="text-sm text-gray-600 mb-4">上传模特图和服装图，实现AI虚拟试穿效果</p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 模特图像上传 */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium">模特图像 (必选)</label>
                    <p className="text-xs text-gray-500 mb-2">要求：全身正面照，光照良好，无遮挡，PNG/JPG格式，150px~4096px</p>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handlePersonImageUpload}
                        className="w-full p-2 border rounded-md"
                        required
                        disabled={isGenerating}
                    />
                    {personImage && (
                        <div className="mt-2">
                            <img 
                                src={personImage} 
                                alt="模特图像预览" 
                                className="max-w-xs h-auto rounded-md border-2 border-blue-500"
                            />
                        </div>
                    )}
                </div>

                {/* 上装图像上传 */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium">上装图像 (可选)</label>
                    <p className="text-xs text-gray-500 mb-2">要求：平铺拍摄，背景干净，PNG/JPG格式</p>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleTopGarmentUpload}
                        className="w-full p-2 border rounded-md"
                        disabled={isGenerating}
                    />
                    {topGarment && (
                        <div className="mt-2">
                            <img 
                                src={topGarment} 
                                alt="上装图像预览" 
                                className="max-w-xs h-auto rounded-md border-2 border-green-500"
                            />
                        </div>
                    )}
                </div>

                {/* 下装图像上传 */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium">下装图像 (可选)</label>
                    <p className="text-xs text-gray-500 mb-2">要求：平铺拍摄，背景干净，PNG/JPG格式</p>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleBottomGarmentUpload}
                        className="w-full p-2 border rounded-md"
                        disabled={isGenerating}
                    />
                    {bottomGarment && (
                        <div className="mt-2">
                            <img 
                                src={bottomGarment} 
                                alt="下装图像预览" 
                                className="max-w-xs h-auto rounded-md border-2 border-orange-500"
                            />
                        </div>
                    )}
                </div>

                {/* 模型选择 */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium">模型类型</label>
                    <select
                        value={modelType}
                        onChange={(e) => setModelType(e.target.value)}
                        className="w-full p-2 border rounded-md"
                        disabled={isGenerating}
                    >
                        <option value="aitryon">AI试衣-基础版 (0.20元/张)</option>
                        <option value="aitryon-plus">AI试衣-Plus版 (0.50元/张，推荐)</option>
                    </select>
                    <p className="text-xs text-gray-500">
                        {modelType === 'aitryon' 
                            ? '基础版：速度快，适合对速度要求高的场景'
                            : 'Plus版：提升清晰度、纹理细节，适合质量优先的场景'
                        }
                    </p>
                </div>

                {/* 参数设置 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">分辨率</label>
                        <select
                            value={resolution}
                            onChange={(e) => setResolution(e.target.value)}
                            className="w-full p-2 border rounded-md"
                            disabled={isGenerating}
                        >
                            <option value="-1">同原图 (默认)</option>
                            <option value="1024">576x1024</option>
                            <option value="1280">720x1280</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium">人脸处理</label>
                        <select
                            value={restoreFace.toString()}
                            onChange={(e) => setRestoreFace(e.target.value === 'true')}
                            className="w-full p-2 border rounded-md"
                            disabled={isGenerating}
                        >
                            <option value="true">保留原脸 (推荐)</option>
                            <option value="false">随机生成新脸</option>
                        </select>
                    </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800">
                    <strong>重要提醒：</strong><br/>
                    • 模特图要求：全身正面照，光照良好，无遮挡<br/>
                    • 服装图要求：平铺拍摄，背景干净，服装占比大<br/>
                    • 计费：基础版0.20元/张，Plus版0.50元/张<br/>
                    • 生成结果有效期24小时，请及时下载<br/>
                    • 任务轮询间隔建议≥3秒
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isGenerating}
                >
                    {isGenerating ? '生成中...' : '开始AI试衣'}
                </button>
            </form>
        </div>
    );
};

export default AITryOn;
