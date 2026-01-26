import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, ExternalLink, ChevronLeft, ChevronRight, Images } from 'lucide-react';

const MediaViewer = ({ media, onClose, onNext, onPrev, hasNext, hasPrev }) => {
    // 多图浏览索引
    const [imageIndex, setImageIndex] = useState(0);
    
    // 当 media 变化时重置索引
    useEffect(() => {
        setImageIndex(0);
    }, [media?.taskId]);

    // Handle ESC key and arrow keys
    useEffect(() => {
        if (!media) return;
        
        const imgUrls = media.imgUrls || [];
        const hasMultiImages = imgUrls.length > 1;
        
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            // 多图时左右箭头切换图片，否则切换任务
            if (e.key === 'ArrowRight') {
                if (hasMultiImages && imageIndex < imgUrls.length - 1) {
                    setImageIndex(i => i + 1);
                } else if (hasNext) {
                    onNext();
                }
            }
            if (e.key === 'ArrowLeft') {
                if (hasMultiImages && imageIndex > 0) {
                    setImageIndex(i => i - 1);
                } else if (hasPrev) {
                    onPrev();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [media, onClose, onNext, onPrev, hasNext, hasPrev, imageIndex]);

    // Prevent body scrolling when modal is open
    useEffect(() => {
        if (!media) return;
        
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, [media]);

    // Don't render anything if no media
    if (!media) return null;

    const imgUrls = media.imgUrls || [];
    const hasMultiImages = !media.videoUrl && imgUrls.length > 1;
    const currentImageUrl = hasMultiImages ? imgUrls[imageIndex] : media.imgUrl;
    const url = media.videoUrl || currentImageUrl;
    const isVideo = !!media.videoUrl;

    // 多图切换
    const handleImagePrev = (e) => {
        e.stopPropagation();
        if (imageIndex > 0) setImageIndex(i => i - 1);
    };
    const handleImageNext = (e) => {
        e.stopPropagation();
        if (imageIndex < imgUrls.length - 1) setImageIndex(i => i + 1);
    };

    // Use Portal to render directly to document.body
    return createPortal(
        <div 
            className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black/95"
            onClick={onClose}
        >
            {/* 关闭按钮 */}
            <button
                onClick={onClose}
                className="absolute top-6 right-6 z-[100000] p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
            >
                <X size={24} />
            </button>

            {/* 左切换按钮 */}
            {(hasMultiImages ? imageIndex > 0 : hasPrev) && (
                <button
                    onClick={hasMultiImages ? handleImagePrev : (e) => { e.stopPropagation(); onPrev(); }}
                    className="absolute left-6 top-1/2 -translate-y-1/2 z-[100000] p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
                >
                    <ChevronLeft size={32} />
                </button>
            )}

            {/* 右切换按钮 */}
            {(hasMultiImages ? imageIndex < imgUrls.length - 1 : hasNext) && (
                <button
                    onClick={hasMultiImages ? handleImageNext : (e) => { e.stopPropagation(); onNext(); }}
                    className="absolute right-6 top-1/2 -translate-y-1/2 z-[100000] p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
                >
                    <ChevronRight size={32} />
                </button>
            )}

            {/* 媒体内容 */}
            {isVideo ? (
                <video
                    src={url}
                    controls
                    autoPlay
                    onClick={(e) => e.stopPropagation()}
                    className="max-w-[85vw] max-h-[75vh] rounded-lg shadow-2xl"
                />
            ) : (
                <img
                    src={url}
                    alt={media.prompt || ''}
                    onClick={(e) => e.stopPropagation()}
                    className="max-w-[85vw] max-h-[75vh] rounded-lg shadow-2xl select-none"
                />
            )}

            {/* 多图切换指示器 */}
            {hasMultiImages && (
                <div className="mt-4 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {imgUrls.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setImageIndex(idx)}
                            className={`w-2.5 h-2.5 rounded-full transition-all ${
                                idx === imageIndex 
                                    ? 'bg-white scale-110' 
                                    : 'bg-white/40 hover:bg-white/60'
                            }`}
                        />
                    ))}
                    <span className="ml-2 text-white/60 text-sm">{imageIndex + 1} / {imgUrls.length}</span>
                </div>
            )}

            {/* 操作栏 */}
            <div 
                className="mt-6 flex items-center gap-4 px-6 py-3 bg-white/10 backdrop-blur-xl rounded-full text-white"
                onClick={(e) => e.stopPropagation()}
            >
                <a
                    href={url}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                    <Download size={18} />
                    <span className="text-sm">下载</span>
                </a>
                
                <div className="w-px h-5 bg-white/30"></div>
                
                <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                    <ExternalLink size={18} />
                    <span className="text-sm">新标签打开</span>
                </a>
                
                <div className="w-px h-5 bg-white/30"></div>
                
                <span className="text-sm text-white/70 px-2">{media.model}</span>
            </div>
        </div>,
        document.body
    );
};

export default MediaViewer;
