import React, { useState } from 'react';
import { Upload, Mic, Image as ImageIcon, Play, Volume2, ChevronDown, Settings2, Sparkles } from 'lucide-react';
import { uploadFileSimple } from '../hooks/useFileUpload';
import { isValidUrl } from '../utils/fileUpload';

const DigitalHumanGenerator = ({ onGenerate, isGenerating, apiKey }) => {
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [imageInput, setImageInput] = useState({ type: 'file', value: '', file: null }); // Support URL and file
  const [audioInput, setAudioInput] = useState({ type: 'file', value: '', file: null }); // Support URL and file
  const [selectedModel, setSelectedModel] = useState('wan2.2-s2v');
  const [resolution, setResolution] = useState('480P');
  const [styleType, setStyleType] = useState('speech'); // speech, singing, performance
  const [imageUrl, setImageUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');

  // Handle image file selection
  const handleImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        try {
          setUploadingImage(true);
          setImageInput({ type: 'file', value: '', file });
          // 数字人 API 必须使用 URL
          const url = await uploadFileSimple(file, apiKey, selectedModel, { requireUrl: true });
          console.log('✅ 图片上传成功:', url);
          setImageInput({ type: 'file', value: url, file });
          setImageUrl(url);
        } catch (error) {
          console.error('Error uploading image:', error);
          alert('图片上传失败: ' + error.message);
        } finally {
          setUploadingImage(false);
        }
      } else {
        alert('请选择有效的图片文件 (jpg, png, gif等)');
      }
    }
  };

  // Handle audio file selection
  const handleAudioFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('audio/') || file.name.toLowerCase().endsWith('.mp3') || file.name.toLowerCase().endsWith('.wav')) {
        try {
          setUploadingAudio(true);
          setAudioInput({ type: 'file', value: '', file });
          // 数字人 API 必须使用 URL
          const url = await uploadFileSimple(file, apiKey, selectedModel, { requireUrl: true });
          console.log('✅ 音频上传成功:', url);
          setAudioInput({ type: 'file', value: url, file });
          setAudioUrl(url);
        } catch (error) {
          console.error('Error uploading audio:', error);
          alert('音频上传失败: ' + error.message);
        } finally {
          setUploadingAudio(false);
        }
      } else {
        alert('请选择有效的音频文件 (mp3, wav等)');
      }
    }
  };

  // Handle URL inputs
  const handleImageUrlChange = (e) => {
    const url = e.target.value.trim();
    if (url && !isValidUrl(url)) {
      alert('请输入有效的图片URL地址');
      return;
    }
    setImageInput({ type: 'url', value: url, file: null });
    setImageUrl(url);
  };

  const handleAudioUrlChange = (e) => {
    const url = e.target.value.trim();
    if (url && !isValidUrl(url)) {
      alert('请输入有效的音频URL地址');
      return;
    }
    setAudioInput({ type: 'url', value: url, file: null });
    setAudioUrl(url);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    const imageValue = imageInput.value;
    const audioValue = audioInput.value;

    // Check image input
    if (!imageValue) {
      alert('请上传图片文件或输入图片URL');
      return;
    }

    // 对于检测模型，只需要图片
    if (selectedModel === 'wan2.2-s2v-detect') {
      // Prepare parameters for detection API call
      const params = {
        model: selectedModel,
        input: {
          image_url: imageValue
        }
      };

      await onGenerate(params, 'digital-human');
    } else {
      // 对于语音驱动视频模型，需要图片和音频
      if (!audioValue) {
        alert('请上传音频文件或输入音频URL');
        return;
      }

      // Prepare parameters for API call
      const params = {
        model: selectedModel,
        input: {
          image_url: imageValue,
          audio_url: audioValue,
          style_type: styleType
        },
        parameters: {
          size: resolution
        }
      };

      await onGenerate(params, 'digital-human');
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
                  <option value="wan2.2-s2v">数字人-语音驱动</option>
                  <option value="wan2.2-s2v-detect">数字人-图像检测</option>
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

            {/* 动作类型 */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">动作类型</label>
              <div className="relative">
                <select
                  value={styleType}
                  onChange={(e) => setStyleType(e.target.value)}
                  className="w-full appearance-none bg-gradient-to-br from-white to-gray-50 border border-gray-200 pl-3 pr-10 py-3 rounded-xl text-sm font-semibold text-gray-800 outline-none hover:border-violet-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all cursor-pointer shadow-sm hover:shadow"
                  disabled={isGenerating}
                >
                  <option value="speech">说话</option>
                  <option value="singing">唱歌</option>
                  <option value="performance">表演</option>
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
                  <ImageIcon className="text-blue-600" size={16} />
                  <span className="text-sm font-medium text-gray-700">人物图片</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                  id="dh-image-upload"
                  disabled={isGenerating}
                />
                {imageInput.file ? (
                  <span className="text-xs text-green-600 font-medium">
                    {uploadingImage ? '上传中...' : imageInput.file.name}
                  </span>
                ) : (
                    <label
                      htmlFor="dh-image-upload"
                      className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                    >
                      {uploadingImage ? (
                        <><div className="animate-spin h-3 w-3 border-2 border-gray-300 border-t-blue-500 rounded-full" /><span>上传中...</span></>
                      ) : (
                        <><Upload size={14} /><span>点击上传</span></>
                      )}
                    </label>
                )}
              </div>

              {/* 分隔线 */}
              {selectedModel !== 'wan2.2-s2v-detect' && <div className="h-8 w-px bg-gray-200"></div>}

              {/* 音频文件 */}
              {selectedModel !== 'wan2.2-s2v-detect' && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Mic className="text-violet-600" size={16} />
                    <span className="text-sm font-medium text-gray-700">音频文件</span>
                  </div>
                  <input
                    type="file"
                    accept="audio/*,.mp3,.wav"
                    onChange={handleAudioFileChange}
                    className="hidden"
                    id="dh-audio-upload"
                    disabled={isGenerating}
                  />
                  {audioInput.file ? (
                    <span className="text-xs text-green-600 font-medium">
                      {uploadingAudio ? '上传中...' : audioInput.file.name}
                    </span>
                  ) : (
                    <label
                      htmlFor="dh-audio-upload"
                      className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                    >
                      {uploadingAudio ? (
                        <><div className="animate-spin h-3 w-3 border-2 border-gray-300 border-t-violet-500 rounded-full" /><span>上传中...</span></>
                      ) : (
                        <><Upload size={14} /><span>点击上传</span></>
                      )}
                    </label>
                  )}
                </div>
              )}
            </div>
            <div className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-200">
              <span className="font-medium text-gray-500">素材要求：</span>人物图片需正面清晰，音频支持 MP3/WAV 格式
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
            disabled={isGenerating || !imageUrl || (selectedModel !== 'wan2.2-s2v-detect' && !audioUrl)}
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
                <span>生成数字人视频</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DigitalHumanGenerator;
