import React, { useState } from 'react';
import { Upload, User, Play, Settings2, Smile, ChevronDown } from 'lucide-react';
import { uploadFileSimple } from '../hooks/useFileUpload';
import { isValidUrl } from '../utils/fileUpload';

const EmojiGenerator = ({ onGenerate, isGenerating, apiKey }) => {
  const [uploadingImage, setUploadingImage] = useState(false);
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
          setUploadingImage(true);
          setImageInput({ type: 'file', value: '', file });
          // 表情包 API 必须使用 URL
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
    
    const imageValue = imageInput.value;
    
    if (!imageValue) {
      alert('请上传图片文件或输入图片URL');
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
                  disabled={isGenerating || isDetecting}
                >
                  <option value="emoji-v1">表情包视频生成</option>
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
                  disabled={isGenerating || isDetecting}
                >
                  <option value="480P">480P (SD)</option>
                  <option value="720P">720P (HD)</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* 表情模板 */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">表情模板</label>
              <div className="relative">
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full appearance-none bg-gradient-to-br from-white to-gray-50 border border-gray-200 pl-3 pr-10 py-3 rounded-xl text-sm font-semibold text-gray-800 outline-none hover:border-violet-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all cursor-pointer shadow-sm hover:shadow"
                  disabled={isGenerating || isDetecting}
                >
                  {emojiTemplates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
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
              {/* 人物肖像 */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <User className="text-blue-600" size={16} />
                  <span className="text-sm font-medium text-gray-700">人物肖像</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                  id="emoji-image-upload"
                  disabled={isGenerating || isDetecting}
                />
                {imageInput.file ? (
                  <span className="text-xs text-green-600 font-medium">
                    {uploadingImage ? '上传中...' : imageInput.file.name}
                  </span>
                ) : (
                  <label
                    htmlFor="emoji-image-upload"
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
            </div>
            <div className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-200">
              <span className="font-medium text-gray-500">图片要求：</span>单人正面肖像，面部无遮挡，表情自然，头部姿态端正
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
            disabled={isGenerating || isDetecting || !imageUrl}
            className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {(isGenerating || isDetecting) ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                <span>{isDetecting ? '检测中...' : '生成中...'}</span>
              </>
            ) : (
              <>
                <Smile size={18} />
                <span>生成表情包视频</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmojiGenerator;
