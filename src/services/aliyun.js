import { getModelById } from '../config/models';
import { payloadBuilders } from './payloadBuilders';
import { API_BASE_URL, TIMEOUT, RETRY } from '../config/apiConfig';

const BASE_URL = API_BASE_URL;

const getHeaders = (apiKey, isAsync = false, enableOssResolve = false) => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    ...(isAsync ? { 'X-DashScope-Async': 'enable' } : {}),
    // 使用 oss:// 临时 URL 时必须添加此请求头
    ...(enableOssResolve ? { 'X-DashScope-OssResourceResolve': 'enable' } : {})
});

/**
 * Retry helper function for network requests
 * @param {Function} fn - Async function to retry
 * @param {number} retries - Number of retry attempts (default: 2)
 * @param {number} delay - Delay between retries in ms (default: 1000)
 * @returns {Promise} Result of the function
 */
const retryRequest = async (fn, retries = RETRY.MAX_ATTEMPTS, delay = RETRY.INITIAL_DELAY) => {
    try {
        return await fn();
    } catch (error) {
        // Don't retry on validation errors or unknown models
        if (error.message.includes('未知模型') || error.message.includes('未知请求格式')) {
            throw error;
        }
        
        // Retry on network errors or timeouts
        if (retries > 0 && (error.message.includes('网络错误') || error.message.includes('超时'))) {
            await new Promise(resolve => setTimeout(resolve, delay));
            return retryRequest(fn, retries - 1, delay * RETRY.BACKOFF_FACTOR);
        }
        throw error;
    }
};

/**
 * 检查对象中是否包含 oss:// URL
 * @param {any} obj - 要检查的对象
 * @returns {boolean}
 */
const containsOssUrl = (obj) => {
    if (typeof obj === 'string') {
        return obj.startsWith('oss://');
    }
    if (Array.isArray(obj)) {
        return obj.some(item => containsOssUrl(item));
    }
    if (obj && typeof obj === 'object') {
        return Object.values(obj).some(value => containsOssUrl(value));
    }
    return false;
};

/**
 * Unified Creation Method for both Video and Image tasks.
 * Configuration-driven approach using model registry and payload builders.
 * 
 * @param {string} apiKey - Aliyun API key
 * @param {Object} params - Task parameters
 * @param {string} params.model - Model ID
 * @param {Object} params.input - Input data (prompt, images, etc.)
 * @param {Object} params.parameters - Generation parameters (size, seed, etc.)
 * @returns {Promise<{type: string, taskId: string, status: string, results?: Array}>}
 * @throws {Error} When model is unknown, request format is invalid, or API call fails
 */
export const createTask = async (apiKey, params) => {
    const modelId = params.model;
    // 优先使用组件传递的 modelConfig，回退到 getModelById 查找
    // 这解决了同一模型 ID 在不同场景下使用不同 requestFormat 的问题
    const modelConfig = params.modelConfig || getModelById(modelId);

    if (!modelConfig) {
        throw new Error(`未知模型: ${modelId}`);
    }

    // Get endpoint and request format from model configuration
    const endpoint = BASE_URL + modelConfig.endpoint;
    const requestFormat = modelConfig.requestFormat;
    const isAsync = modelConfig.async !== false; // Default to true

    // Get the appropriate payload builder
    const builder = payloadBuilders[requestFormat];
    
    if (!builder) {
        throw new Error(`未知请求格式: ${requestFormat}，模型: ${modelId}`);
    }

    // Build the payload using the builder
    const payload = builder(modelId, params, modelConfig);

    // 检查 payload 中是否包含 oss:// URL
    const needsOssResolve = containsOssUrl(payload);

    // Debug log (only in development)
    if (import.meta.env.DEV) {
        console.log('🚀 创建任务请求:', {
            模型ID: modelId,
            请求地址: endpoint,
            请求格式: requestFormat,
            使用OSS: needsOssResolve,
            请求体: payload
        });
    }

    // Implement timeout control
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('请求超时：请求花费时间过长')), TIMEOUT.REQUEST);
    });

    try {
        // Make the API request
        const fetchPromise = fetch(endpoint, {
            method: 'POST',
            headers: getHeaders(apiKey, isAsync, needsOssResolve),
            body: JSON.stringify(payload)
        });

        // Race between fetch and timeout
        const response = await Promise.race([fetchPromise, timeoutPromise]);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            
            // Debug log for error response
            if (import.meta.env.DEV) {
                console.error('❌ API错误响应:', {
                    状态码: response.status,
                    错误数据: errorData,
                    请求模型: modelId
                });
            }
            
            // Check if the error is specifically about unknown model
            if (errorData.message && (errorData.message.includes('model') || errorData.message.toLowerCase().includes('unknown') || errorData.message.includes('not exist'))) {
                throw new Error(`未知模型: ${modelId} - ${errorData.message}`);
            }
            throw new Error(errorData.message || `API 错误: ${response.status}`);
        }

        const data = await response.json();

        // Standardize Output
        if (isAsync) {
            if (!data.output || !data.output.task_id) {
                throw new Error('异步任务未返回 task_id');
            }
            return {
                type: 'ASYNC',
                taskId: data.output.task_id,
                status: data.output.task_status || 'PENDING'
            };
        } else {
            // Handle Sync Multimodal Response Structure
            if (data.output && data.output.choices) {
                const choice = data.output.choices[0];
                const imgUrl = choice.message?.content?.[0]?.image;
                if (imgUrl) {
                    return {
                        type: 'SYNC',
                        taskId: `sync_${Date.now()}`,
                        status: 'SUCCEEDED',
                        results: [{ url: imgUrl }]
                    };
                }
            }
            throw new Error('同步任务响应格式异常');
        }
    } catch (error) {
        // Check for timeout error
        if (error.message.includes('超时')) {
            throw error;
        }

        // Check for network error
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            throw new Error('网络错误：无法连接到服务，请检查网络连接');
        }

        // Other errors
        throw error;
    }
};

/**
 * Common Task Polling Status Method
 * 
 * @param {string} apiKey - Aliyun API key
 * @param {string} taskId - Task ID to query
 * @returns {Promise<Object>} Task status and results
 * @throws {Error} When polling fails or times out
 */
export const getTask = async (apiKey, taskId) => {
    // 使用 Promise.race 实现超时控制
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('轮询超时：轮询请求花费时间过长')), TIMEOUT.POLLING);
    });

    try {
        // 发起 fetch 请求
        const fetchPromise = fetch(`${BASE_URL}/tasks/${taskId}`, {
            method: 'GET',
            headers: getHeaders(apiKey)
        });

        // 竞速：哪个先完成就用哪个的结果
        const response = await Promise.race([fetchPromise, timeoutPromise]);

        if (!response.ok) throw new Error(`轮询失败: ${response.status}`);
        return await response.json();
    } catch (error) {
        // 检查是否是超时错误
        if (error.message.includes('超时')) {
            throw error; // 超时错误直接抛出
        }

        // 检查是否是网络错误
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            throw new Error('网络错误：无法连接到轮询服务，请检查网络连接');
        }

        // 其他错误正常抛出
        throw error;
    }
};

/**
 * Batch Task Polling Status Method
 * 
 * @param {string} apiKey - Aliyun API key
 * @param {string[]} taskIds - Array of task IDs to query
 * @returns {Promise<Array>} Array of settled promises with task results
 */
export const getBatchTasks = async (apiKey, taskIds) => {
    const promises = taskIds.map(taskId => getTask(apiKey, taskId));
    return await Promise.allSettled(promises);
};
