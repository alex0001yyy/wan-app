/**
 * IndexedDB 存储服务
 * 提供大容量本地存储，替代 localStorage
 */

const DB_NAME = 'wan_app_db';
const DB_VERSION = 1;
const STORE_NAME = 'tasks';

let dbInstance = null;

/**
 * 初始化/获取数据库连接
 */
const getDB = () => {
    return new Promise((resolve, reject) => {
        if (dbInstance) {
            resolve(dbInstance);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('IndexedDB 打开失败:', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            dbInstance = request.result;
            resolve(dbInstance);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // 创建任务存储
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'taskId' });
                store.createIndex('type', 'type', { unique: false });
                store.createIndex('createdAt', 'createdAt', { unique: false });
                store.createIndex('status', 'status', { unique: false });
            }
        };
    });
};

/**
 * 获取所有任务
 */
export const getAllTasks = async () => {
    try {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                // 按创建时间降序排序
                const tasks = request.result.sort((a, b) => b.createdAt - a.createdAt);
                resolve(tasks);
            };

            request.onerror = () => {
                console.error('获取任务失败:', request.error);
                reject(request.error);
            };
        });
    } catch (error) {
        console.error('getAllTasks 错误:', error);
        return [];
    }
};

/**
 * 保存单个任务
 */
export const saveTask = async (task) => {
    try {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            
            // 清理 base64 数据以节省空间
            const cleanedTask = cleanTaskData(task);
            const request = store.put(cleanedTask);

            request.onsuccess = () => resolve(true);
            request.onerror = () => {
                console.error('保存任务失败:', request.error);
                reject(request.error);
            };
        });
    } catch (error) {
        console.error('saveTask 错误:', error);
        return false;
    }
};

/**
 * 批量保存任务
 */
export const saveTasks = async (tasks) => {
    try {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            tasks.forEach(task => {
                const cleanedTask = cleanTaskData(task);
                store.put(cleanedTask);
            });

            transaction.oncomplete = () => resolve(true);
            transaction.onerror = () => {
                console.error('批量保存失败:', transaction.error);
                reject(transaction.error);
            };
        });
    } catch (error) {
        console.error('saveTasks 错误:', error);
        return false;
    }
};

/**
 * 删除任务
 */
export const deleteTask = async (taskId) => {
    try {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(taskId);

            request.onsuccess = () => resolve(true);
            request.onerror = () => {
                console.error('删除任务失败:', request.error);
                reject(request.error);
            };
        });
    } catch (error) {
        console.error('deleteTask 错误:', error);
        return false;
    }
};

/**
 * 清空所有任务
 */
export const clearAllTasks = async () => {
    try {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve(true);
            request.onerror = () => {
                console.error('清空任务失败:', request.error);
                reject(request.error);
            };
        });
    } catch (error) {
        console.error('clearAllTasks 错误:', error);
        return false;
    }
};

/**
 * 清理任务数据中的 base64 以节省存储空间
 */
const cleanTaskData = (task) => {
    if (!task.originalParams) return task;

    const cleanedParams = JSON.parse(JSON.stringify(task.originalParams));

    // 清理 messages 中的 base64
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

    // 清理直接的图像字段
    const imageFields = ['image_url', 'base_image_url', 'mask_image_url', 'ref_image_url', 
                         'style_ref_url', 'img_url', 'first_frame_url', 'video_url', 'audio_url'];
    
    imageFields.forEach(field => {
        if (cleanedParams.input?.[field]?.startsWith('data:')) {
            cleanedParams.input[field] = '[base64 removed]';
        }
    });

    return { ...task, originalParams: cleanedParams };
};

/**
 * 从 localStorage 迁移数据到 IndexedDB
 */
export const migrateFromLocalStorage = async () => {
    const STORAGE_KEY = 'wan_app_tasks_v2';
    const LEGACY_KEY = 'wan_tasks';

    try {
        // 检查是否已迁移
        const migrated = localStorage.getItem('wan_idb_migrated');
        if (migrated === 'true') {
            return false; // 已迁移，跳过
        }

        let tasksToMigrate = [];

        // 尝试读取新格式
        const savedNew = localStorage.getItem(STORAGE_KEY);
        if (savedNew) {
            try {
                tasksToMigrate = JSON.parse(savedNew);
            } catch (e) {
                console.warn('解析 localStorage 数据失败:', e);
            }
        }

        // 如果没有新格式，尝试旧格式
        if (tasksToMigrate.length === 0) {
            const savedOld = localStorage.getItem(LEGACY_KEY);
            if (savedOld) {
                try {
                    tasksToMigrate = JSON.parse(savedOld);
                } catch (e) {
                    console.warn('解析旧 localStorage 数据失败:', e);
                }
            }
        }

        // 执行迁移
        if (tasksToMigrate.length > 0) {
            await saveTasks(tasksToMigrate);
            console.log(`成功迁移 ${tasksToMigrate.length} 个任务到 IndexedDB`);
        }

        // 标记迁移完成并清理 localStorage
        localStorage.setItem('wan_idb_migrated', 'true');
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(LEGACY_KEY);

        return true;
    } catch (error) {
        console.error('迁移失败:', error);
        return false;
    }
};

/**
 * 导出所有任务配置为 JSON
 */
export const exportTasks = async () => {
    const tasks = await getAllTasks();
    const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        taskCount: tasks.length,
        tasks: tasks
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `wan-config-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return tasks.length;
};

/**
 * 获取所有待导出的媒体文件信息
 */
export const getExportableMedia = async () => {
    const tasks = await getAllTasks();
    const media = [];
    
    tasks.forEach((task, index) => {
        if (task.videoUrl) {
            media.push({
                type: 'video',
                url: task.videoUrl,
                filename: `video_${index + 1}_${task.taskId.slice(-8)}.mp4`,
                taskId: task.taskId,
                prompt: task.prompt?.slice(0, 50) || '无描述'
            });
        }
        if (task.imgUrl) {
            const ext = task.imgUrl.includes('.png') ? 'png' : 'jpg';
            media.push({
                type: 'image',
                url: task.imgUrl,
                filename: `image_${index + 1}_${task.taskId.slice(-8)}.${ext}`,
                taskId: task.taskId,
                prompt: task.prompt?.slice(0, 50) || '无描述'
            });
        }
    });
    
    return media;
};

/**
 * 下载单个媒体文件
 */
export const downloadMedia = async (url, filename) => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('下载失败');
        
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
        
        return true;
    } catch (error) {
        console.error(`下载失败 ${filename}:`, error);
        return false;
    }
};

/**
 * 批量导出所有媒体文件
 * @param {Function} onProgress - 进度回调 (current, total, filename)
 */
export const exportAllMedia = async (onProgress) => {
    const media = await getExportableMedia();
    
    if (media.length === 0) {
        return { success: 0, failed: 0, total: 0 };
    }
    
    let success = 0;
    let failed = 0;
    
    for (let i = 0; i < media.length; i++) {
        const item = media[i];
        onProgress && onProgress(i + 1, media.length, item.filename);
        
        const result = await downloadMedia(item.url, item.filename);
        if (result) {
            success++;
        } else {
            failed++;
        }
        
        // 添加小延迟避免浏览器阻止批量下载
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return { success, failed, total: media.length };
};

/**
 * 从 JSON 文件导入任务
 */
export const importTasks = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // 验证数据格式
                if (!data.tasks || !Array.isArray(data.tasks)) {
                    throw new Error('无效的导入文件格式');
                }
                
                // 导入任务
                await saveTasks(data.tasks);
                resolve(data.tasks.length);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsText(file);
    });
};

/**
 * 获取存储统计信息
 */
export const getStorageStats = async () => {
    try {
        const tasks = await getAllTasks();
        
        // 估算存储大小
        const dataSize = new Blob([JSON.stringify(tasks)]).size;
        
        return {
            taskCount: tasks.length,
            estimatedSize: dataSize,
            formattedSize: formatBytes(dataSize)
        };
    } catch (error) {
        return { taskCount: 0, estimatedSize: 0, formattedSize: '0 B' };
    }
};

const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
