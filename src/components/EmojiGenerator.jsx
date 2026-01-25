import React, { useState } from 'react';
import { Upload, User, Play, Settings, Smile } from 'lucide-react';
import { processFileInput, isValidUrl } from '../utils/fileUpload';

const EmojiGenerator = ({ onGenerate, isGenerating }) => {
  const [imageInput, setImageInput] = useState({ type: 'file', value: '', file: null }); // Support URL and file
  const [selectedModel, setSelectedModel] = useState('emoji-v1');
  const [resolution, setResolution] = useState('480P');
  const [selectedTemplate, setSelectedTemplate] = useState('mengwa_kaixin');
  const [isDetecting, setIsDetecting] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  // 表情包模板列表
  const emojiTemplates = [
    { id: 'mengwa_kaixin', name: '萌娃开心', category: '萌娃' },
    { id: 'dagong_zhuakuang', name: '打工人抓狂', category: '打工人' },
    { id: 'mengwa_dengyan', name: '萌娃等烟', category: '萌娃' },
    { id: 'dagong_wunai', name: '打工人无奈', category: '打工人' },
    { id: 'mengwa_gandong', name: '萌娃感动', category: '萌娃' },
    { id: 'dagong_weixiao', name: '打工人微笑', category: '打工人' },
    { id: 'mengwa_jidong', name: '萌娃激动', category: '萌娃' },
    { id: 'jingdian_tiaopi', name: '经典调皮', category: '经典' },
    { id: 'mengwa_kun_1', name: '萌娃困了', category: '萌娃' },
    { id: 'jingdian_deyi_1', name: '经典得意', category: '经典' },
    { id: 'mengwa_jiaoxie', name: '萌娃娇邪', category: '萌娃' },
    { id: 'jingdian_qidai', name: '经典期待', category: '经典' },
    { id: 'dagong_kaixin', name: '打工人开心', category: '打工人' },
    { id: 'jingdian_landuo_1', name: '经典落泪', category: '经典' },
    { id: 'dagong_yangwang', name: '打工人仰望', category: '打工人' },
    { id: 'jingdian_xianqi', name: '经典嫌弃', category: '经典' },
    { id: 'dagong_kunhuo', name: '打工人困货', category: '打工人' },
    { id: 'jingdian_lei', name: '经典累', category: '经典' },
    { id: 'mengwa_renzhen_1', name: '萌娃认真', category: '萌娃' },
    { id: 'dagong_ganji', name: '打工人感激', category: '打工人' }
  ];

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

  // Handle URL input
  const handleImageUrlChange = (e) => {
    const url = e.target.value.trim();
    if (url && !isValidUrl(url)) {
      alert('请输入有效的图片URL地址');
      return;
    }
    setImageInput({ type: 'url', value: url, file: null });
    setImageUrl(url);
  };

  const detectFace = async (imageUrl) => {
    setIsDetecting(true);
    try {
      const response = await fetch('/api/aliyun/services/aigc/image2video/face-detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'emoji-detect-v1',
          input: {
            image_url: imageUrl
          },
          parameters: {
            ratio: '1:1'
          }
        })
      });

      if (!response.ok) {
        throw new Error('人脸检测失败');
      }

      const result = await response.json();
      return result.output;
    } catch (error) {
      console.error('人脸检测失败:', error);
      throw error;
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    let imageValue = '';
    
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

    try {
      // 检测人脸坐标
      const detectionResult = await detectFace(imageValue);
      const { bbox_face, ext_bbox_face } = detectionResult;

      // 准备参数用于API调用
      const params = {
        model: selectedModel,
        input: {
          image_url: imageValue,
          driven_id: selectedTemplate,
          face_bbox: bbox_face,
          ext_bbox: ext_bbox_face
        }
      };

      await onGenerate(params, 'emoji');
    } catch (error) {
      console.error('表情包视频生成失败:', error);
      alert('生成失败: ' + error.message);
    }
  };
  
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="space-y-6">
        {/* 模型选择 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            选择模型
          </label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-gray-50"
            disabled={isGenerating || isDetecting}
          >
            <option value="emoji-v1">表情包视频生成</option>
          </select>
        </div>

        {/* 表情包模板选择 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            选择表情包模板
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto">
            {emojiTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => setSelectedTemplate(template.id)}
                className={`p-3 border-2 rounded-xl text-center transition-all ${
                  selectedTemplate === template.id
                    ? 'border-violet-500 bg-violet-50 text-violet-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
                disabled={isGenerating || isDetecting}
              >
                <div className="font-medium text-xs mb-1">{template.name}</div>
                <div className="text-xs text-gray-500">{template.category}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 分辨率选择 */}
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
                disabled={isGenerating || isDetecting}
              >
                <span className="text-sm font-medium">{res}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 图片上传 - 支持URL和文件上传 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            人物肖像图片
          </label>
          
          {/* URL Input */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="或输入图片URL地址"
              value={imageInput.type === 'url' ? imageInput.value : ''}
              onChange={handleImageUrlChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-gray-50 text-sm"
              disabled={isGenerating || isDetecting}
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
              disabled={isGenerating || isDetecting}
            />
            <label htmlFor="image-upload" className="cursor-pointer">
              <User className="mx-auto mb-3 text-gray-400" size={32} />
              <p className="text-sm text-gray-600 mb-1">
                {imageInput.type === 'file' && imageInput.file
                  ? imageInput.file.name
                  : '点击上传人物肖像图片'}
              </p>
              <p className="text-xs text-gray-400">支持 JPG, PNG, BMP 格式，≤10MB</p>
              <p className="text-xs text-gray-400 mt-1 text-red-500">
                图片要求：单人正面肖像，面部无遮挡，表情自然，头部姿态端正
              </p>
            </label>
          </div>
        </div>

        {/* 提交按钮 */}
        <button
          type="submit"
          disabled={isGenerating || isDetecting || !imageUrl}
          className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {(isGenerating || isDetecting) ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>{isDetecting ? '检测中...' : '生成中...'}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <Smile size={20} />
              <span>生成表情包视频</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default EmojiGenerator;
