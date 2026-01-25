import React, { useState } from 'react';
import Layout from './components/Layout';
import ApiKeyModal from './components/ApiKeyModal';
import PageLayout from './components/PageLayout';
import VideoGenerator from './components/VideoGenerator';
import ImageGenerator from './components/ImageGenerator';
import I2VGenerator from './components/I2VGenerator';
import KF2VGenerator from './components/KF2VGenerator';
import VideoEffectGenerator from './components/VideoEffectGenerator';
import R2VGenerator from './components/R2VGenerator';
import VideoEditor from './components/VideoEditor';
import ImageEditor from './components/ImageEditor';
import ImageTranslator from './components/ImageTranslator';
import BackgroundGenerator from './components/BackgroundGenerator';
import { ImageStylization } from './components/ImageStylization';
import { ImageInpainting } from './components/ImageInpainting';
import { ImageEnhancement } from './components/ImageEnhancement';
import { SketchToImage } from './components/SketchToImage';
import { CartoonGenerator } from './components/CartoonGenerator';
import AITryOn from './components/AITryOn';
import DigitalHumanGenerator from './components/DigitalHumanGenerator';
import VideoSwap from './components/VideoSwap';
import ImageMotion from './components/ImageMotion';
import EmojiGenerator from './components/EmojiGenerator';
import HistoryGallery from './components/HistoryGallery';
import { useTasks } from './hooks/useTasks';
import { Sparkles, Terminal, Rocket, Cpu } from 'lucide-react';

// Placeholder for yet-to-be-implemented specialized features
const ComingSoon = ({ title, desc, icon: Icon }) => (
  <div className="h-[60vh] flex flex-col items-center justify-center text-center p-12 bg-white rounded-[2rem] border border-dashed border-gray-200">
    <div className="w-20 h-20 bg-violet-50 rounded-3xl flex items-center justify-center text-violet-500 mb-6 animate-pulse">
      <Icon size={40} />
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-500 max-w-md mx-auto leading-relaxed">{desc}</p>
    <div className="mt-8 flex gap-3">
      <span className="px-4 py-2 bg-gray-50 text-gray-500 text-xs font-bold rounded-full border border-gray-100 uppercase tracking-widest">Internal Development</span>
      <span className="px-4 py-2 bg-violet-50 text-violet-600 text-xs font-bold rounded-full border border-violet-100 uppercase tracking-widest">API Pending</span>
    </div>
  </div>
);

function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('aliyun_api_key') || '');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('video-t2v');

  // Unified logic for all tasks
  const { tasks, isGenerating, runTask, retryTask, deleteTask, updateTask } = useTasks(apiKey);

  const handleSaveKey = (key) => {
    setApiKey(key);
    localStorage.setItem('aliyun_api_key', key);
  };

  const handleAction = async (params, type) => {
    if (!apiKey) {
      setIsSettingsOpen(true);
      return;
    }
    await runTask(params, type);
  };

  const handleRetry = async (task) => {
    if (!apiKey) {
      setIsSettingsOpen(true);
      return;
    }
    await retryTask(task);
  };

  const renderContent = () => {
    // Route based on Sidebar IDs
    switch (activeMenu) {
      case 'video-t2v':
        return (
          <PageLayout
            title="文生视频"
            description="基于 Wan 2.x 内核的高灵动视频生成"
            tasks={tasks}
            filterType="video"
            generator={VideoGenerator}
            onGenerate={handleAction}
            isGenerating={isGenerating}
            onDelete={deleteTask}
            onRetry={handleRetry}
            onUpdate={updateTask}
            apiKey={apiKey}
            docUrl="https://help.aliyun.com/zh/model-studio/text-to-video-api-reference"
          />
        );

      case 'image-t2i':
      case 'image-creative': // Qwen Max handles this well
        return (
          <PageLayout
            title={activeMenu === 'image-t2i' ? '文生图' : '创意文字 / 海报设计'}
            description="使用 Qwen Image Max 或 Wan 2.6 实现顶级画质"
            tasks={tasks}
            filterType="image"
            generator={ImageGenerator}
            onGenerate={handleAction}
            isGenerating={isGenerating}
            onDelete={deleteTask}
            onRetry={handleRetry}
            onUpdate={updateTask}
            apiKey={apiKey}
          />
        );

      case 'video-i2v':
        return (
          <PageLayout
            title="首帧生视频"
            description="上传图片作为首帧，生成动态视频"
            tasks={tasks}
            filterType="i2v"
            generator={I2VGenerator}
            onGenerate={handleAction}
            isGenerating={isGenerating}
            onDelete={deleteTask}
            onRetry={handleRetry}
            onUpdate={updateTask}
            apiKey={apiKey}
            docUrl="https://help.aliyun.com/zh/model-studio/image-to-video-api-reference"
          />
        );

      case 'video-kf2v':
        return (
          <PageLayout
            title="首尾帧生视频"
            description="上传首尾帧图片，生成平滑过渡视频"
            tasks={tasks}
            filterType="kf2v"
            generator={KF2VGenerator}
            onGenerate={handleAction}
            isGenerating={isGenerating}
            onDelete={deleteTask}
            onRetry={handleRetry}
            onUpdate={updateTask}
            apiKey={apiKey}
            docUrl="https://help.aliyun.com/zh/model-studio/image-to-video-by-first-and-last-frame-api-reference"
          />
        );

      case 'video-effect':
        return (
          <PageLayout
            title="视频特效"
            description="选择特效模板，一键生成动态视频效果"
            tasks={tasks}
            filterType="video-effect"
            generator={VideoEffectGenerator}
            onGenerate={handleAction}
            isGenerating={isGenerating}
            onDelete={deleteTask}
            onRetry={handleRetry}
            onUpdate={updateTask}
            apiKey={apiKey}
            docUrl="https://help.aliyun.com/zh/model-studio/wanx-video-effects"
          />
        );

      case 'video-r2v':
        return (
          <PageLayout
            title="参考生视频"
            description="上传参考视频，保持角色形象和音色生成 (Wan 2.6 支持多角色与多镜头叙事)"
            tasks={tasks}
            filterType="r2v"
            generator={R2VGenerator}
            onGenerate={handleAction}
            isGenerating={isGenerating}
            onDelete={deleteTask}
            onRetry={handleRetry}
            onUpdate={updateTask}
            apiKey={apiKey}
          />
        );

      case 'video-edit':
        return (
          <PageLayout
            title="视频编辑"
            description="通义万相视频编辑统一模型，支持多图参考、视频重绘、局部编辑、视频延展和画面扩展"
            tasks={tasks}
            filterType="video-edit"
            generator={VideoEditor}
            onGenerate={handleAction}
            isGenerating={isGenerating}
            onDelete={deleteTask}
            onRetry={handleRetry}
            onUpdate={updateTask}
            apiKey={apiKey}
          />
        );

      case 'image-edit':
        return (
          <PageLayout
            title="图像指令编辑"
            description="通过文本指令直接编辑图像，支持 Qwen 和 Wan 系列多模态模型"
            tasks={tasks}
            filterType="image-edit"
            generator={ImageEditor}
            onGenerate={handleAction}
            isGenerating={isGenerating}
            onDelete={deleteTask}
            onRetry={handleRetry}
            onUpdate={updateTask}
            apiKey={apiKey}
          />
        );

      case 'image-stylization':
        return (
          <PageLayout
            title="图像风格迁移"
            description="全局或局部风格化，支持多种艺术风格转换"
            tasks={tasks}
            filterType="image-stylization"
            generator={ImageStylization}
            onGenerate={handleAction}
            isGenerating={isGenerating}
            onDelete={deleteTask}
            onRetry={handleRetry}
            onUpdate={updateTask}
            apiKey={apiKey}
          />
        );

      case 'image-inpainting':
        return (
          <PageLayout
            title="图像修复重绘"
            description="局部重绘、去水印等图像修复功能"
            tasks={tasks}
            filterType="image-inpainting"
            generator={ImageInpainting}
            onGenerate={handleAction}
            isGenerating={isGenerating}
            onDelete={deleteTask}
            onRetry={handleRetry}
            onUpdate={updateTask}
            apiKey={apiKey}
          />
        );

      case 'image-enhancement':
        return (
          <PageLayout
            title="图像增强"
            description="扩图、超分辨率、图像上色等增强功能"
            tasks={tasks}
            filterType="image-enhancement"
            generator={ImageEnhancement}
            onGenerate={handleAction}
            isGenerating={isGenerating}
            onDelete={deleteTask}
            onRetry={handleRetry}
            onUpdate={updateTask}
            apiKey={apiKey}
          />
        );

      case 'sketch-to-image':
        return (
          <PageLayout
            title="草图生图"
            description="基于线稿或草图生成精美图像"
            tasks={tasks}
            filterType="sketch-to-image"
            generator={SketchToImage}
            onGenerate={handleAction}
            isGenerating={isGenerating}
            onDelete={deleteTask}
            onRetry={handleRetry}
            onUpdate={updateTask}
            apiKey={apiKey}
          />
        );

      case 'cartoon-generator':
        return (
          <PageLayout
            title="卡通形象生成"
            description="参考卡通形象进行创作生成"
            tasks={tasks}
            filterType="cartoon-generator"
            generator={CartoonGenerator}
            onGenerate={handleAction}
            isGenerating={isGenerating}
            onDelete={deleteTask}
            onRetry={handleRetry}
            onUpdate={updateTask}
            apiKey={apiKey}
          />
        );

      case 'mk-bg-gen':
        return (
          <PageLayout
            title="背景生成"
            description="为带透明背景的主体图像生成背景，适用于电商和海报场景"
            tasks={tasks}
            filterType="background-generation"
            generator={BackgroundGenerator}
            onGenerate={handleAction}
            isGenerating={isGenerating}
            onDelete={deleteTask}
            onRetry={handleRetry}
            onUpdate={updateTask}
            apiKey={apiKey}
          />
        );

      case 'image-translation':
        return (
          <PageLayout
            title="图像翻译"
            description="通义千问图像翻译模型，可精准翻译图像中的文字，并保留原始排版"
            tasks={tasks}
            filterType="image-translation"
            generator={ImageTranslator}
            onGenerate={handleAction}
            isGenerating={isGenerating}
            onDelete={deleteTask}
            onRetry={handleRetry}
            onUpdate={updateTask}
            apiKey={apiKey}
          />
        );

      case 'ec-tryon':
        return (
          <PageLayout
            title="AI 试衣"
            description="上传模特图和服装图，实现AI虚拟试穿效果"
            tasks={tasks}
            filterType="ai-tryon"
            generator={AITryOn}
            onGenerate={handleAction}
            isGenerating={isGenerating}
            onDelete={deleteTask}
            onRetry={handleRetry}
            onUpdate={updateTask}
            apiKey={apiKey}
          />
        );


      case 'dh-talking':
        return (
          <PageLayout
            title="数字人 / 说话人生成"
            description="基于单张图片和音频，生成动作自然的说话、唱歌或表演视频"
            tasks={tasks}
            filterType="digital-human"
            generator={DigitalHumanGenerator}
            onGenerate={handleAction}
            isGenerating={isGenerating}
            onDelete={deleteTask}
            onRetry={handleRetry}
            onUpdate={updateTask}
            apiKey={apiKey}
          />
        );

      case 'dh-motion':
        return (
          <PageLayout
            title="图生动作"
            description="基于人物图片和参考视频，将视频角色的动作/表情迁移到图片角色中，赋予图片角色动态表现力"
            tasks={tasks}
            filterType="image-motion"
            generator={ImageMotion}
            onGenerate={handleAction}
            isGenerating={isGenerating}
            onDelete={deleteTask}
            onRetry={handleRetry}
            onUpdate={updateTask}
            apiKey={apiKey}
          />
        );

      case 'dh-emoji':
        return (
          <PageLayout
            title="表情包视频生成"
            description="基于一张人物肖像或半身头像，结合预设动态模板，生成具有丰富表情的视频"
            tasks={tasks}
            filterType="emoji"
            generator={EmojiGenerator}
            onGenerate={handleAction}
            isGenerating={isGenerating}
            onDelete={deleteTask}
            onRetry={handleRetry}
            onUpdate={updateTask}
            apiKey={apiKey}
          />
        );

      case 'video-swap':
        return (
          <PageLayout
            title="视频换人"
            description="基于人物图片和参考视频，将视频中的主角替换为图片中的角色，保留原视频场景、光照和色调"
            tasks={tasks}
            filterType="video-swap"
            generator={VideoSwap}
            onGenerate={handleAction}
            isGenerating={isGenerating}
            onDelete={deleteTask}
            onRetry={handleRetry}
            onUpdate={updateTask}
            apiKey={apiKey}
          />
        );

      default:
        return (
          <ComingSoon
            title="实验室功能"
            desc="该模块正在进行 API 联调与 Prompt 模版优化，敬请期待。"
            icon={Terminal}
          />
        );
    }
  };

  return (
    <Layout
      activeMenu={activeMenu}
      onSelectMenu={setActiveMenu}
      apiKeyLastChars={apiKey.slice(-4)}
      onOpenSettings={() => setIsSettingsOpen(true)}
    >
      {renderContent()}

      <ApiKeyModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentKey={apiKey}
        onSave={handleSaveKey}
        onTasksImported={() => window.location.reload()}
      />
    </Layout>
  );
}

export default App;
