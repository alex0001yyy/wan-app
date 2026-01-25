import React, { useState } from 'react';
import { Upload, User, Video, Play, Settings2, ChevronDown } from 'lucide-react';
import { handleFileUpload } from '../utils/fileUpload';
import { uploadFileSimple } from '../hooks/useFileUpload';

const ImageMotion = ({ onGenerate, isGenerating, apiKey }) => {
  const [uploading, setUploading] = useState({ image: false, video: false });
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [selectedModel, setSelectedModel] = useState('wan2.2-animate-move');
  const [resolution, setResolution] = useState('480P');
  const [mode, setMode] = useState('wan-std'); // wan-std or wan-pro

  const handleImageUpload = (event) => {
    handleFileUpload(event, ['image/'], 5 * 1024 * 1024, setImageFile);
  };

  const handleVideoUpload = (event) => {
    handleFileUpload(event, ['video/', '.mp4', '.mov'], 200 * 1024 * 1024, setVideoFile);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!imageFile || !videoFile) {
      alert('请上传人物图片和参考视频');
      return;
    }

    try {
      setUploading({ image: true, video: true });
      // Upload files to OSS（图生动作 API 必须使用 URL）
      const imageUrl = await uploadFileSimple(imageFile, apiKey, selectedModel, { requireUrl: true });
      console.log('✅ 人物图片上传成功:', imageUrl);
      const videoUrl = await uploadFileSimple(videoFile, apiKey, selectedModel, { requireUrl: true });
      console.log('✅ 参考视频上传成功:', videoUrl);
      
      // Prepare parameters for API call
      const params = {
        model: selectedModel,
        input: {
          image_url: imageUrl,
          video_url: videoUrl
        },
        parameters: {
          mode: mode,
          check_image: true
        }
      };

      await onGenerate(params, 'image-motion');
    } catch (error) {
      console.error('图生动作生成失败:', error);
      alert('生成失败: ' + error.message);
    } finally {
      setUploading({ image: false, video: false });
    }
  };

  return (
    <div className="p-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Control Bar - 3 Column Layout */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {/* 模型选择 */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">模型版本</label>
              <div className="relative">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full appearance-none bg-gradient-to-br from-white to-gray-50 border border-gray-200 pl-3 pr-10 py-3 rounded-xl text-sm font-semibold text-gray-800 outline-none hover:border-violet-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all cursor-pointer shadow-sm hover:shadow"
                  disabled={isGenerating}
                >
                  <option value="wan2.2-animate-move">万相2.2-图生动作</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* 服务模式 */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">服务模式</label>
              <div className="relative">
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="w-full appearance-none bg-gradient-to-br from-white to-gray-50 border border-gray-200 pl-3 pr-10 py-3 rounded-xl text-sm font-semibold text-gray-800 outline-none hover:border-violet-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all cursor-pointer shadow-sm hover:shadow"
                  disabled={isGenerating}
                >
                  <option value="wan-std">标准模式</option>
                  <option value="wan-pro">专业模式</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* 分辨率 */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">分辨率</label>
              <div className="relative">
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-full appearance-none bg-gradient-to-br from-white to-gray-50 border border-gray-200 pl-3 pr-10 py-3 rounded-xl text-sm font-semibold text-gray-800 outline-none hover:border-violet-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all cursor-pointer shadow-sm hover:shadow"
                  disabled={isGenerating}
                >
                  <option value="480P">480P (SD)</option>
                  <option value="720P">720P (HD)</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <label className="text-xs font-medium text-gray-600 whitespace-nowrap">上传素材</label>
            </div>
            <div className="flex items-center gap-6 flex-wrap">
              {/* 人物图片 */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <User className="text-blue-600" size={16} />
                  <span className="text-sm font-medium text-gray-700">人物图片</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="im-image-upload"
                  disabled={isGenerating}
                />
                {imageFile ? (
                  <span className="text-xs text-green-600 font-medium">{imageFile.name}</span>
                ) : (
                  <label
                    htmlFor="im-image-upload"
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                  >
                    <Upload size={14} />
                    <span>点击上传</span>
                  </label>
                )}
              </div>

              {/* 分隔线 */}
              <div className="h-8 w-px bg-gray-200"></div>

              {/* 参考视频 */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Video className="text-violet-600" size={16} />
                  <span className="text-sm font-medium text-gray-700">参考视频</span>
                </div>
                <input
                  type="file"
                  accept="video/*,.mp4,.mov"
                  onChange={handleVideoUpload}
                  className="hidden"
                  id="im-video-upload"
                  disabled={isGenerating}
                />
                {videoFile ? (
                  <span className="text-xs text-green-600 font-medium">{videoFile.name}</span>
                ) : (
                  <label
                    htmlFor="im-video-upload"
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                  >
                    <Upload size={14} />
                    <span>点击上传</span>
                  </label>
                )}
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-200">
              <span className="font-medium text-gray-500">素材要求：</span>图片支持 JPG/PNG/BMP（≤5MB），视频支持 MP4/MOV（≤200MB）
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-150"
          >
            <Settings2 size={16} className="inline mr-2" />
            高级设置
          </button>
          <button
            type="submit"
            disabled={isGenerating || !imageFile || !videoFile}
            className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                <span>生成中...</span>
              </>
            ) : (
              <>
                <Play size={18} />
                <span>生成动作视频</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ImageMotion;
