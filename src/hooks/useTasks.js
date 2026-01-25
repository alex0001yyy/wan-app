import { useState, useEffect, useRef, useCallback } from 'react';
import { createTask, getTask, getBatchTasks } from '../services/aliyun';
import { getModelById } from '../config/models';
import { POLLING, STORAGE } from '../config/apiConfig';

const STATUS_DONE = POLLING.STATUS_DONE;
const STORAGE_KEY = STORAGE.TASKS;

export const useTasks = (apiKey) => {
    const [tasks, setTasks] = useState(() => {
        const savedNew = localStorage.getItem(STORAGE_KEY);
        if (savedNew) return JSON.parse(savedNew);

        // Migration from legacy key
        const savedOld = localStorage.getItem(STORAGE.LEGACY_TASKS);
        if (savedOld) {
            const legacyTasks = JSON.parse(savedOld);
            // Intelligent type detection: if it has imgUrl but no videoUrl, it's an image.
            return legacyTasks.map(t => ({
                ...t,
                type: t.type || (t.imgUrl && !t.videoUrl ? 'image' : 'video')
            }));
        }
        return [];
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const pollIntervalRef = useRef(null);
    const pollCountRef = useRef(0); // Track polling count for adaptive interval

    // Save tasks to local storage (strip base64 data to save space)
    useEffect(() => {
        // Remove base64 image data from originalParams before saving
        const tasksToSave = tasks.map(task => {
            if (!task.originalParams) return task;
            
            const cleanedParams = JSON.parse(JSON.stringify(task.originalParams));
            
            // Remove base64 images from messages content
            if (cleanedParams.input?.messages) {
                cleanedParams.input.messages = cleanedParams.input.messages.map(msg => ({
                    ...msg,
                    content: msg.content?.map(item => {
                        if (item.image && item.image.startsWith('data:')) {
                            return { ...item, image: '[base64 removed]' };
                        }
                        if (item.image_url && item.image_url.startsWith('data:')) {
                            return { ...item, image_url: '[base64 removed]' };
                        }
                        return item;
                    })
                }));
            }
            
            // Remove base64 from direct image fields
            if (cleanedParams.input?.image_url?.startsWith('data:')) {
                cleanedParams.input.image_url = '[base64 removed]';
            }
            if (cleanedParams.input?.base_image_url?.startsWith('data:')) {
                cleanedParams.input.base_image_url = '[base64 removed]';
            }
            if (cleanedParams.input?.mask_image_url?.startsWith('data:')) {
                cleanedParams.input.mask_image_url = '[base64 removed]';
            }
            if (cleanedParams.input?.ref_image_url?.startsWith('data:')) {
                cleanedParams.input.ref_image_url = '[base64 removed]';
            }
            if (cleanedParams.input?.style_ref_url?.startsWith('data:')) {
                cleanedParams.input.style_ref_url = '[base64 removed]';
            }
            
            return { ...task, originalParams: cleanedParams };
        });
        
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tasksToSave));
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                console.warn('LocalStorage quota exceeded, keeping only recent 20 tasks');
                // Keep only recent 20 tasks if storage is full
                const recentTasks = tasksToSave.slice(0, 20);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(recentTasks));
            }
        }
    }, [tasks]);

    // 智能轮询策略：根据任务年龄调整轮询频率
    const getAdaptiveInterval = (activeTasks) => {
        if (activeTasks.length === 0) return POLLING.INTERVAL;
        
        // 检查是否有新创建的任务（创建后10秒内）
        const now = Date.now();
        const hasRecentTask = activeTasks.some(t => (now - t.createdAt) < 10000);
        
        if (hasRecentTask) {
            // 新任务：使用1秒间隔，快速捕捉状态变化
            return POLLING.INITIAL_INTERVAL;
        } else if (pollCountRef.current < 10) {
            // 前10次轮询：使用2秒间隔
            return POLLING.INTERVAL;
        } else {
            // 长时间运行的任务：逐渐增加到5秒间隔
            return POLLING.MAX_INTERVAL;
        }
    };

    // Polling Logic - 优化版：避免不必要的重新渲染 + 自适应轮询间隔
    useEffect(() => {
        const activeTasks = tasks.filter(t => !STATUS_DONE.includes(t.status) && !t.taskId.startsWith('temp_'));

        // 如果没有活跃任务，清除定时器
        if (activeTasks.length === 0) {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
                pollCountRef.current = 0; // 重置轮询计数
            }
            return;
        }

        // 清除旧的定时器，使用新的间隔
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }

        // 获取自适应间隔
        const interval = getAdaptiveInterval(activeTasks);
        
        pollIntervalRef.current = setInterval(() => {
            pollCountRef.current++;
            
            // 使用最新的 tasks 状态
            setTasks(currentTasks => {
                const currentActiveTasks = currentTasks.filter(
                    t => !STATUS_DONE.includes(t.status) && !t.taskId.startsWith('temp_')
                );
                
                if (currentActiveTasks.length > 0) {
                    // 异步检查状态，不阻塞
                    checkStatuses(currentActiveTasks);
                } else {
                    // 没有活跃任务时，清除定时器
                    if (pollIntervalRef.current) {
                        clearInterval(pollIntervalRef.current);
                        pollIntervalRef.current = null;
                        pollCountRef.current = 0;
                    }
                }
                
                return currentTasks; // 不触发更新
            });
        }, interval);

        // 清理函数
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
        };
    }, [tasks.length, tasks]); // 依赖 tasks 以便检测新任务

    // 使用 useCallback 缓存函数，避免重新创建
    const checkStatuses = useCallback(async (activeTasks) => {
        if (!apiKey || activeTasks.length === 0) return;
        
        const taskIds = activeTasks.map(task => task.taskId);
        const results = await getBatchTasks(apiKey, taskIds);
        
        const updatesMap = new Map();
        
        // Process all results and collect updates
        results.forEach((result, index) => {
            const task = activeTasks[index];
            if (result.status === 'fulfilled' && result.value && result.value.output) {
                const { task_status, video_url } = result.value.output;
                const updates = {};

                // 调试日志：打印完整的 output 结构
                console.log('🔍 轮询返回数据:', {
                    taskId: task.taskId,
                    fullOutput: result.value.output,
                    task_status,
                    video_url
                });

                // Handle Image poll result - 支持两种格式
                // 1. 标准格式: output.results[0].url
                if (result.value.output.results && result.value.output.results.length > 0) {
                    const imgUrl = result.value.output.results[0].url;
                    if (imgUrl && imgUrl !== task.imgUrl) {
                        updates.imgUrl = imgUrl;
                    }
                }
                // 2. Multimodal格式 (wan2.6-image enable_interleave): output.choices[0].message.content
                else if (result.value.output.choices && result.value.output.choices.length > 0) {
                    const content = result.value.output.choices[0].message?.content || [];
                    // 提取第一张图片
                    const firstImage = content.find(item => item.type === 'image');
                    if (firstImage && firstImage.image && firstImage.image !== task.imgUrl) {
                        updates.imgUrl = firstImage.image;
                    }
                }

                if (video_url && video_url !== task.videoUrl) {
                    updates.videoUrl = video_url;
                }

                // 只在真正有变化时才添加状态更新
                // 关键：只有当媒体URL已存在或者本次更新中包含媒体URL时，才更新状态为SUCCEEDED
                if (task_status && task_status !== task.status) {
                    // 如果状态变为SUCCEEDED，确保有媒体URL
                    if (task_status === 'SUCCEEDED') {
                        // 只有当有媒体URL（现有的或新获取的）时才更新状态
                        if (task.imgUrl || task.videoUrl || updates.imgUrl || updates.videoUrl) {
                            updates.status = task_status;
                        } else {
                            console.warn('⚠️ SUCCEEDED 但没有媒体URL，保持RUNNING状态');
                        }
                        // 否则保持当前状态，等待下次轮询时媒体URL到达
                    } else {
                        // 非SUCCEEDED状态直接更新
                        updates.status = task_status;
                    }
                }

                if (Object.keys(updates).length > 0) {
                    updatesMap.set(task.taskId, updates);
                }
            } else if (result.status === 'rejected') {
                console.error(`Status check failed for ${task.taskId}:`, result.reason);
            }
        });

        // 只在有实际更新时才触发状态更新
        if (updatesMap.size > 0) {
            setTasks(prev => prev.map(task => {
                const updates = updatesMap.get(task.taskId);
                return updates ? { ...task, ...updates } : task;
            }));
            
            // 检测到状态变化时，重置轮询计数以获得更频繁的更新
            // 这有助于捕捉快速连续的状态转换
            pollCountRef.current = Math.max(0, pollCountRef.current - 3);
        }
    }, [apiKey]);

    const updateTask = (taskId, updates) => {
        setTasks(prev => prev.map(t => t.taskId === taskId ? { ...t, ...updates } : t));
    };

    const deleteTask = (taskId) => {
        setTasks(prev => prev.filter(t => t.taskId !== taskId));
    };

    const runTask = async (params, type) => {
        if (!apiKey) throw new Error('API Key is required');

        setIsGenerating(true);
        const tempId = `temp_${Date.now()}`;

        // 重置轮询计数，使新任务获得更频繁的轮询
        pollCountRef.current = 0;

        // 1. Optimistic Add
        const newTask = {
            taskId: tempId,
            type, // 'image', 'video', 'i2v', 'r2v', or 'video-edit'
            prompt: params.input.prompt || params.input.template || '', // Support template in addition to prompt
            model: params.model,
            status: 'RUNNING',
            createdAt: Date.now(),
            imgUrl: null,
            videoUrl: null,
            // 保存原始参数以便重试
            originalParams: params
        };
        setTasks(prev => [newTask, ...prev]);

        try {
            const result = await createTask(apiKey, params);

            // 2. Final Update
            setTasks(prev => prev.map(t => {
                if (t.taskId === tempId) {
                    const updated = {
                        ...t,
                        taskId: result.taskId,
                        status: result.status
                    };
                    if (result.type === 'SYNC' && result.results) {
                        const url = result.results[0].url;
                        // Use model's outputType to determine result field
                        const modelConfig = getModelById(params.model);
                        if (modelConfig?.outputType === 'image') {
                            updated.imgUrl = url;
                        } else if (modelConfig?.outputType === 'video') {
                            updated.videoUrl = url;
                        }
                    }
                    return updated;
                }
                return t;
            }));
        } catch (error) {
            console.error('Task Execution Failed:', error);
            updateTask(tempId, { status: 'FAILED' });
            throw error;
        } finally {
            setIsGenerating(false);
        }
    };

    const retryTask = async (task) => {
        if (!task.originalParams) {
            console.error('Cannot retry task: originalParams not found');
            return;
        }
        
        // 使用原始参数重新创建任务
        await runTask(task.originalParams, task.type);
    };

    return {
        tasks,
        isGenerating,
        runTask,
        retryTask,
        updateTask,
        deleteTask
    };
};
