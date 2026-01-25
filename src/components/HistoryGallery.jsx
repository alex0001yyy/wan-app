import React, { useState, memo } from 'react';
import { Play } from 'lucide-react';
import MediaViewer from './MediaViewer';
import TaskCard from './TaskCard';

const HistoryGallery = ({ tasks, onDelete, onRetry }) => {
    const [viewerMedia, setViewerMedia] = useState(null);

    const currentIndex = viewerMedia ? tasks.findIndex(t => t.taskId === viewerMedia.taskId) : -1;

    const handleNext = () => {
        if (currentIndex < tasks.length - 1) {
            setViewerMedia(tasks[currentIndex + 1]);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setViewerMedia(tasks[currentIndex - 1]);
        }
    };

    if (!tasks || tasks.length === 0) {
        return (
            <div className="py-6 flex flex-col items-center justify-center text-center">
                <div className="relative inline-block mb-3">
                    <div className="absolute inset-0 bg-violet-200/40 rounded-full blur-xl"></div>
                    <div className="relative w-12 h-12 bg-gradient-to-br from-violet-50 to-violet-100 rounded-full flex items-center justify-center">
                        <Play size={20} className="text-violet-500 ml-0.5" />
                    </div>
                </div>
                <h3 className="text-sm font-semibold text-gray-700 mb-0.5">暂无生成记录</h3>
                <p className="text-xs text-gray-400">开始创作，作品将在这里展示</p>
            </div>
        );
    }

    return (
        <>
            {/* Grid - tasks 数组已经是最新优先的顺序 */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mt-3">
                {tasks.map((task, index) => (
                    <TaskCard
                        key={task.taskId}
                        task={task}
                        index={index}
                        onView={setViewerMedia}
                        onDelete={onDelete}
                        onRetry={onRetry}
                    />
                ))}
            </div>

            {/* Full Screen Viewer */}
            <MediaViewer
                media={viewerMedia}
                onClose={() => setViewerMedia(null)}
                onNext={handleNext}
                onPrev={handlePrev}
                hasNext={currentIndex < tasks.length - 1}
                hasPrev={currentIndex > 0}
            />
        </>
    );
};

export default memo(HistoryGallery);
