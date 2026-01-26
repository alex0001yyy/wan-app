import { useState, useEffect, useRef, useCallback } from 'react';
import { createTask, getTask, getBatchTasks } from '../services/aliyun';
import { getModelById } from '../config/models';
import { POLLING } from '../config/apiConfig';
import { 
    getAllTasks, 
    saveTask as saveTaskToDB, 
    deleteTask as deleteTaskFromDB, 
    saveTasks as saveTasksToDB,
    migrateFromLocalStorage 
} from '../utils/storage';

const STATUS_DONE = POLLING.STATUS_DONE;

export const useTasks = (apiKey) => {
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const pollIntervalRef = useRef(null);
    const pollCountRef = useRef(0);

    // 初始化：从 IndexedDB 加载任务，并立即查询真实状态
    useEffect(() => {
        const initTasks = async () => {
            try {
                // 先尝试迁移 localStorage 数据
                await migrateFromLocalStorage();
                
                // 加载 IndexedDB 中的任务
                const savedTasks = await getAllTasks();
                setTasks(savedTasks);
                
                // 立即查询未完成任务的真实状态（避免显示过时的 RUNNING）
                if (apiKey) {
                    const activeTasks = savedTasks.filter(
                        t => !STATUS_DONE.includes(t.status) && !t.taskId.startsWith('temp_')
                    );
                    if (activeTasks.length > 0) {
                        console.log('🔄 页面加载，立即查询任务真实状态...');
                        // 延迟一点确保状态已设置
                        setTimeout(() => {
                            checkStatusesImmediate(activeTasks);
                        }, 100);
                    }
                }
            } catch (error) {
                console.error('加载任务失败:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initTasks();
    }, [apiKey]);

    // 保存任务到 IndexedDB（当任务变化时）
    const saveTasksRef = useRef(null);
    
    useEffect(() => {
        // 跳过初始加载时的保存
        if (isLoading) return;
        
        // 防抖保存
        if (saveTasksRef.current) {
            clearTimeout(saveTasksRef.current);
        }
        
        saveTasksRef.current = setTimeout(async () => {
            try {
                await saveTasksToDB(tasks);
            } catch (error) {
                console.error('保存任务到 IndexedDB 失败:', error);
            }
        }, 500);

        return () => {
            if (saveTasksRef.current) {
                clearTimeout(saveTasksRef.current);
            }
        };
    }, [tasks, isLoading]);

    // 智能轮询策略
    const getAdaptiveInterval = (activeTasks) => {
        if (activeTasks.length === 0) return POLLING.INTERVAL;
        
        const now = Date.now();
        const hasRecentTask = activeTasks.some(t => (now - t.createdAt) < 10000);
        
        if (hasRecentTask) {
            return POLLING.INITIAL_INTERVAL;
        } else if (pollCountRef.current < 10) {
            return POLLING.INTERVAL;
        } else {
            return POLLING.MAX_INTERVAL;
        }
    };

    // 轮询逻辑
    useEffect(() => {
        const activeTasks = tasks.filter(t => !STATUS_DONE.includes(t.status) && !t.taskId.startsWith('temp_'));

        if (activeTasks.length === 0) {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
                pollCountRef.current = 0;
            }
            return;
        }

        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }

        const interval = getAdaptiveInterval(activeTasks);
        
        pollIntervalRef.current = setInterval(() => {
            pollCountRef.current++;
            
            setTasks(currentTasks => {
                const currentActiveTasks = currentTasks.filter(
                    t => !STATUS_DONE.includes(t.status) && !t.taskId.startsWith('temp_')
                );
                
                if (currentActiveTasks.length > 0) {
                    checkStatuses(currentActiveTasks);
                } else {
                    if (pollIntervalRef.current) {
                        clearInterval(pollIntervalRef.current);
                        pollIntervalRef.current = null;
                        pollCountRef.current = 0;
                    }
                }
                
                return currentTasks;
            });
        }, interval);

        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
        };
    }, [tasks.length, tasks]);

    // 立即查询状态（用于页面加载时）
    const checkStatusesImmediate = async (activeTasks) => {
        if (!apiKey || activeTasks.length === 0) return;
        
        try {
            const taskIds = activeTasks.map(task => task.taskId);
            const results = await getBatchTasks(apiKey, taskIds);
            
            const updatesMap = new Map();
            
            results.forEach((result, index) => {
                const task = activeTasks[index];
                if (result.status === 'fulfilled' && result.value && result.value.output) {
                    const { task_status, video_url } = result.value.output;
                    const updates = {};

                    // Handle Image poll result - 保存所有图片
                    if (result.value.output.results && result.value.output.results.length > 0) {
                        const allUrls = result.value.output.results.map(r => r.url).filter(Boolean);
                        if (allUrls.length > 0) {
                            updates.imgUrl = allUrls[0];  // 第一张用于预览
                            updates.imgUrls = allUrls;    // 所有图片
                        }
                    }
                    else if (result.value.output.choices && result.value.output.choices.length > 0) {
                        const content = result.value.output.choices[0].message?.content || [];
                        const firstImage = content.find(item => item.type === 'image');
                        if (firstImage && firstImage.image && firstImage.image !== task.imgUrl) {
                            updates.imgUrl = firstImage.image;
                        }
                    }

                    if (video_url && video_url !== task.videoUrl) {
                        updates.videoUrl = video_url;
                    }

                    if (task_status && task_status !== task.status) {
                        updates.status = task_status;
                    }

                    if (Object.keys(updates).length > 0) {
                        updatesMap.set(task.taskId, updates);
                    }
                }
            });

            if (updatesMap.size > 0) {
                console.log('✅ 页面加载状态更新:', Object.fromEntries(updatesMap));
                setTasks(prev => prev.map(task => {
                    const updates = updatesMap.get(task.taskId);
                    return updates ? { ...task, ...updates } : task;
                }));
            }
        } catch (error) {
            console.error('页面加载状态查询失败:', error);
        }
    };

    const checkStatuses = useCallback(async (activeTasks) => {
        if (!apiKey || activeTasks.length === 0) return;
        
        const taskIds = activeTasks.map(task => task.taskId);
        const results = await getBatchTasks(apiKey, taskIds);
        
        const updatesMap = new Map();
        
        results.forEach((result, index) => {
            const task = activeTasks[index];
            if (result.status === 'fulfilled' && result.value && result.value.output) {
                const { task_status, video_url } = result.value.output;
                const updates = {};

                console.log('🔍 轮询返回数据:', {
                    taskId: task.taskId,
                    fullOutput: result.value.output,
                    task_status,
                    video_url
                });

                // Handle Image poll result - 保存所有图片
                if (result.value.output.results && result.value.output.results.length > 0) {
                    const allUrls = result.value.output.results.map(r => r.url).filter(Boolean);
                    if (allUrls.length > 0) {
                        updates.imgUrl = allUrls[0];  // 第一张用于预览
                        updates.imgUrls = allUrls;    // 所有图片
                    }
                }
                else if (result.value.output.choices && result.value.output.choices.length > 0) {
                    const content = result.value.output.choices[0].message?.content || [];
                    const firstImage = content.find(item => item.type === 'image');
                    if (firstImage && firstImage.image && firstImage.image !== task.imgUrl) {
                        updates.imgUrl = firstImage.image;
                    }
                }

                if (video_url && video_url !== task.videoUrl) {
                    updates.videoUrl = video_url;
                }

                if (task_status && task_status !== task.status) {
                    if (task_status === 'SUCCEEDED') {
                        if (task.imgUrl || task.videoUrl || updates.imgUrl || updates.videoUrl) {
                            updates.status = task_status;
                        } else {
                            console.warn('⚠️ SUCCEEDED 但没有媒体URL，保持RUNNING状态');
                        }
                    } else {
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

        if (updatesMap.size > 0) {
            setTasks(prev => prev.map(task => {
                const updates = updatesMap.get(task.taskId);
                return updates ? { ...task, ...updates } : task;
            }));
            
            pollCountRef.current = Math.max(0, pollCountRef.current - 3);
        }
    }, [apiKey]);

    const updateTask = (taskId, updates) => {
        setTasks(prev => prev.map(t => t.taskId === taskId ? { ...t, ...updates } : t));
    };

    const deleteTask = async (taskId) => {
        setTasks(prev => prev.filter(t => t.taskId !== taskId));
        // 同时从 IndexedDB 删除
        await deleteTaskFromDB(taskId);
    };

    const runTask = async (params, type) => {
        if (!apiKey) throw new Error('API Key is required');

        const tempId = `temp_${Date.now()}`;
        pollCountRef.current = 0;

        const newTask = {
            taskId: tempId,
            type,
            prompt: params.input.prompt || params.input.template || '',
            model: params.model,
            status: 'RUNNING',
            createdAt: Date.now(),
            imgUrl: null,
            videoUrl: null,
            originalParams: params
        };
        setTasks(prev => [newTask, ...prev]);

        try {
            const result = await createTask(apiKey, params);

            setTasks(prev => prev.map(t => {
                if (t.taskId === tempId) {
                    const updated = {
                        ...t,
                        taskId: result.taskId,
                        status: result.status
                    };
                    if (result.type === 'SYNC' && result.results) {
                        const allUrls = result.results.map(r => r.url).filter(Boolean);
                        const modelConfig = getModelById(params.model);
                        if (modelConfig?.outputType === 'image') {
                            updated.imgUrl = allUrls[0];
                            updated.imgUrls = allUrls;
                        } else if (modelConfig?.outputType === 'video') {
                            updated.videoUrl = allUrls[0];
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
        }
    };

    const retryTask = async (task) => {
        if (!task.originalParams) {
            console.error('Cannot retry task: originalParams not found');
            return;
        }
        
        await runTask(task.originalParams, task.type);
    };

    // 刷新任务列表（从 IndexedDB 重新加载）
    const refreshTasks = async () => {
        const savedTasks = await getAllTasks();
        setTasks(savedTasks);
    };

    return {
        tasks,
        isLoading,
        runTask,
        retryTask,
        updateTask,
        deleteTask,
        refreshTasks
    };
};
