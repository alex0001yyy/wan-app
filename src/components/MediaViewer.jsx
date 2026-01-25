import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

const MediaViewer = ({ media, onClose, onNext, onPrev, hasNext, hasPrev }) => {
    // Handle ESC key and arrow keys
    useEffect(() => {
        if (!media) return;
        
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight' && hasNext) onNext();
            if (e.key === 'ArrowLeft' && hasPrev) onPrev();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [media, onClose, onNext, onPrev, hasNext, hasPrev]);

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

    const url = media.videoUrl || media.imgUrl;
    const isVideo = !!media.videoUrl;

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
            {hasPrev && (
                <button
                    onClick={(e) => { e.stopPropagation(); onPrev(); }}
                    className="absolute left-6 top-1/2 -translate-y-1/2 z-[100000] p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
                >
                    <ChevronLeft size={32} />
                </button>
            )}

            {/* 右切换按钮 */}
            {hasNext && (
                <button
                    onClick={(e) => { e.stopPropagation(); onNext(); }}
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
