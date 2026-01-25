import React, { useState } from 'react';
import { Upload, User, Video, Play, Pause, Settings } from 'lucide-react';
import { handleFileUpload, uploadFileToTempServer } from '../utils/fileUpload';

const VideoSwap = ({ onGenerate, isGenerating }) => {
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [selectedModel, setSelectedModel] = useState('wan2.2-animate-mix');
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
      // Prepare parameters for API call
      const params = {
        model: selectedModel,
        input: {
          image_url: await uploadFileToTempServer(imageFile),
          video_url: await uploadFileToTempServer(videoFile)
        },
        parameters: {
          mode: mode,
          check_image: true
        }
      };

      await onGenerate(params, 'video-swap');
    } catch (error) {
      console.error('视频换人生成失败:', error);
      alert('生成失败: ' + error.message);
    }
  };

  const uploadFileToTempServer = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`File upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.url; // Assuming the API returns { url: '...' }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="space-y-6">
        {/* Model Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            选择模型
          </label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-gray-50"
            disabled={isGenerating}
          >
            <option value="wan2.2-animate-mix">万相2.2-视频换人</option>
          </select>
        </div>

        {/* Service Mode Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            服务模式
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'wan-std', label: '标准模式', desc: '生成速度快，性价比高' },
              { value: 'wan-pro', label: '专业模式', desc: '动画流畅度更高，效果更佳' }
            ].map(({ value, label, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={`p-4 border-2 rounded-xl text-left transition-all ${
                  mode === value
                    ? 'border-violet-500 bg-violet-50 text-violet-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
                disabled={isGenerating}
              >
                <div className="font-medium text-sm mb-1">{label}</div>
                <div className="text-xs text-gray-500">{desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Resolution Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            视频分辨率
          </label>
          <div className="grid grid-cols-2 gap-3">
            {['480P', '720P'].map((res) => (
              <button
                key={res}
                type="button"
                onClick={() => setResolution(res)}
                className={`p-3 border-2 rounded-xl text-center transition-all ${
                  resolution === res
                    ? 'border-violet-500 bg-violet-50 text-violet-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
                disabled={isGenerating}
              >
                <span className="text-sm font-medium">{res}</span>
              </button>
            ))}
          </div>
        </div>

        {/* File Uploads */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              人物图片
            </label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-violet-300 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={isGenerating}
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <User className="mx-auto mb-3 text-gray-400" size={32} />
                <p className="text-sm text-gray-600 mb-1">
                  {imageFile ? imageFile.name : '点击上传人物图片'}
                </p>
                <p className="text-xs text-gray-400">支持 JPG, PNG, BMP 格式，≤5MB</p>
              </label>
            </div>
          </div>

          {/* Video Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              参考视频
            </label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-violet-300 transition-colors">
              <input
                type="file"
                accept="video/*,.mp4,.mov"
                onChange={handleVideoUpload}
                className="hidden"
                id="video-upload"
                disabled={isGenerating}
              />
              <label htmlFor="video-upload" className="cursor-pointer">
                <Video className="mx-auto mb-3 text-gray-400" size={32} />
                <p className="text-sm text-gray-600 mb-1">
                  {videoFile ? videoFile.name : '点击上传参考视频'}
                </p>
                <p className="text-xs text-gray-400">支持 MP4, MOV 格式，≤200MB</p>
              </label>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={isGenerating || !imageFile || !videoFile}
          className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isGenerating ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>生成中...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <Play size={20} />
              <span>生成换人视频</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default VideoSwap;
