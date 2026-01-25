import React, { useState } from 'react';
import { Upload, Mic, Image as ImageIcon, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { processFileInput, isValidUrl } from '../utils/fileUpload';

const DigitalHumanGenerator = ({ onGenerate, isGenerating }) => {
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
          const base64 = await processFileInput(file, 'image');
          setImageInput({ type: 'file', value: base64, file });
          setImageUrl(base64);
        } catch (error) {
          console.error('Error processing image:', error);
          alert('图片处理失败');
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
          const base64 = await processFileInput(file, 'audio');
          setAudioInput({ type: 'file', value: base64, file });
          setAudioUrl(base64);
        } catch (error) {
          console.error('Error processing audio:', error);
          alert('音频处理失败');
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
    
    let imageValue = '';
    let audioValue = '';

    // Process image input
    try {
      imageValue = await processFileInput(imageInput, 'image');
      if (!imageValue) {
        alert('请上传图片文件或输入图片URL');
        return;
      }
    } catch (error) {
      alert(`图片处理错误: ${error.message}`);
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
      try {
        audioValue = await processFileInput(audioInput, 'audio');
        if (!audioValue) {
          alert('请上传音频文件或输入音频URL');
          return;
        }
      } catch (error) {
        alert(`音频处理错误: ${error.message}`);
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
            <option value="wan2.2-s2v">万相2.2-数字人 (语音驱动视频)</option>
            <option value="wan2.2-s2v-detect">万相2.2-数字人 (图像检测)</option>
          </select>
        </div>

        {/* Style Type Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            动作类型
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'speech', label: '说话', icon: Volume2 },
              { value: 'singing', label: '唱歌', icon: Mic },
              { value: 'performance', label: '表演', icon: Play }
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setStyleType(value)}
                className={`p-4 border-2 rounded-xl flex flex-col items-center gap-2 transition-all ${
                  styleType === value
                    ? 'border-violet-500 bg-violet-50 text-violet-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
                disabled={isGenerating}
              >
                <Icon size={20} />
                <span className="text-sm font-medium">{label}</span>
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

        {/* File Inputs - Support both URL and file upload */}
        <div className="space-y-6">
          {/* Image Input Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              人物图片
            </label>
            
            {/* URL Input */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="或输入图片URL地址"
                value={imageInput.type === 'url' ? imageInput.value : ''}
                onChange={handleImageUrlChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-gray-50 text-sm"
                disabled={isGenerating}
              />
            </div>
            
            {/* File Upload */}
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-violet-300 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
                id="image-upload"
                disabled={isGenerating}
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <ImageIcon className="mx-auto mb-3 text-gray-400" size={32} />
                <p className="text-sm text-gray-600 mb-1">
                  {imageInput.type === 'file' && imageInput.file 
                    ? imageInput.file.name 
                    : '点击上传人物图片'}
                </p>
                <p className="text-xs text-gray-400">支持 JPG, PNG, BMP 格式</p>
              </label>
            </div>
          </div>

          {/* Audio Input Section (only for non-detection models) */}
          {selectedModel !== 'wan2.2-s2v-detect' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                音频文件
              </label>
              
              {/* URL Input */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="或输入音频URL地址"
                  value={audioInput.type === 'url' ? audioInput.value : ''}
                  onChange={handleAudioUrlChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-gray-50 text-sm"
                  disabled={isGenerating}
                />
              </div>
              
              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-violet-300 transition-colors">
                <input
                  type="file"
                  accept="audio/*,.mp3,.wav"
                  onChange={handleAudioFileChange}
                  className="hidden"
                  id="audio-upload"
                  disabled={isGenerating}
                />
                <label htmlFor="audio-upload" className="cursor-pointer">
                  <Mic className="mx-auto mb-3 text-gray-400" size={32} />
                  <p className="text-sm text-gray-600 mb-1">
                    {audioInput.type === 'file' && audioInput.file
                      ? audioInput.file.name
                      : '点击上传音频文件'}
                  </p>
                  <p className="text-xs text-gray-400">支持 MP3, WAV 格式</p>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isGenerating || !imageUrl || (selectedModel !== 'wan2.2-s2v-detect' && !audioUrl)}
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
              <span>生成数字人视频</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default DigitalHumanGenerator;
