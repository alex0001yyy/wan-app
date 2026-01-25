import { useState, useCallback } from 'react';
import { uploadToAliyunOss, convertFileToBase64 } from '../utils/fileUpload';

/**
 * 统一文件上传 Hook
 * 优先使用阿里云临时存储，失败时回退到 base64
 * 
 * @param {Object} options - 配置选项
 * @param {string} options.apiKey - API Key
 * @param {string} options.modelName - 模型名称（上传时绑定）
 * @param {boolean} options.useOss - 是否使用 OSS，默认 true
 * @returns {Object} { uploadFile, uploading, error }
 */
export const useFileUpload = (options = {}) => {
    const { apiKey, modelName, useOss = true } = options;
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * 上传文件
     * @param {File} file - 要上传的文件
     * @param {Object} uploadOptions - 覆盖默认选项
     * @returns {Promise<{url: string, isOss: boolean}>}
     */
    const uploadFile = useCallback(async (file, uploadOptions = {}) => {
        const finalApiKey = uploadOptions.apiKey || apiKey;
        const finalModelName = uploadOptions.modelName || modelName;
        const finalUseOss = uploadOptions.useOss ?? useOss;

        setUploading(true);
        setError(null);

        try {
            // 优先使用 OSS 上传
            if (finalUseOss && finalApiKey && finalModelName) {
                try {
                    const ossUrl = await uploadToAliyunOss(file, finalApiKey, finalModelName);
                    console.log('✅ 文件已上传到 OSS:', ossUrl);
                    return { url: ossUrl, isOss: true };
                } catch (ossError) {
                    console.warn('⚠️ OSS 上传失败，回退到 base64:', ossError.message);
                    // 继续尝试 base64
                }
            }

            // 回退到 base64
            const base64 = await convertFileToBase64(file);
            console.log('📦 文件已转换为 base64');
            return { url: base64, isOss: false };
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setUploading(false);
        }
    }, [apiKey, modelName, useOss]);

    /**
     * 批量上传文件
     * @param {File[]} files - 文件数组
     * @param {Object} uploadOptions - 覆盖默认选项
     * @returns {Promise<Array<{url: string, isOss: boolean}>>}
     */
    const uploadFiles = useCallback(async (files, uploadOptions = {}) => {
        setUploading(true);
        setError(null);

        try {
            const results = await Promise.all(
                files.map(file => uploadFile(file, uploadOptions))
            );
            return results;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setUploading(false);
        }
    }, [uploadFile]);

    return {
        uploadFile,
        uploadFiles,
        uploading,
        error,
        clearError: () => setError(null)
    };
};

/**
 * 简化的文件上传函数（非 Hook，用于组件外或简单场景）
 * 
 * @param {File} file - 要上传的文件
 * @param {string} apiKey - API Key
 * @param {string} modelName - 模型名称
 * @param {Object} options - 可选配置
 * @param {boolean} options.requireUrl - 是否必须返回 URL 格式（不允许回退到 base64），默认 false
 * @returns {Promise<string>} 返回 oss:// URL 或 base64
 */
export const uploadFileSimple = async (file, apiKey, modelName, options = {}) => {
    const { requireUrl = false } = options;
    
    // 优先使用 OSS
    if (apiKey && modelName) {
        try {
            const url = await uploadToAliyunOss(file, apiKey, modelName);
            console.log('✅ 文件已上传到 OSS:', url);
            return url;
        } catch (error) {
            console.warn('⚠️ OSS 上传失败:', error.message);
            if (requireUrl) {
                throw new Error('OSS 上传失败: ' + error.message + '，该 API 不支持 base64 回退');
            }
        }
    } else if (requireUrl) {
        throw new Error('缺少 API Key 或模型名称，无法上传文件');
    }
    
    // 回退到 base64
    console.log('ℹ️ 回退到 base64 编码');
    return await convertFileToBase64(file);
};

export default useFileUpload;
