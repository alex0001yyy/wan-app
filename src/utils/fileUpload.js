import { API_BASE_URL } from '../config/apiConfig';

/**
 * Generic file upload utility function
 * 支持两种上传方式：
 * 1. 阿里云临时存储（推荐，支持大文件）
 * 2. Base64 编码（备用，适用于小文件）
 * 
 * @param {File} file - 要上传的文件
 * @param {Object} options - 配置选项
 * @param {string} options.apiKey - 阿里云 API Key（使用临时存储时必须）
 * @param {string} options.modelName - 模型名称（使用临时存储时必须）
 * @param {boolean} options.useOss - 是否使用临时存储，默认 true
 * @returns {Promise<string>} 返回 oss:// URL 或 base64 字符串
 */
export const uploadFileToTempServer = async (file, options = {}) => {
  const { apiKey, modelName, useOss = true } = options;
  
  // 如果提供了 apiKey 和 modelName，优先使用阿里云临时存储
  if (useOss && apiKey && modelName) {
    try {
      const ossUrl = await uploadToAliyunOss(file, apiKey, modelName);
      console.log('✅ 文件已上传到阿里云临时存储:', ossUrl);
      return ossUrl;
    } catch (error) {
      console.warn('⚠️ 阿里云临时存储上传失败，回退到 base64:', error.message);
      // 回退到 base64
    }
  }
  
  // 回退方案：使用 base64
  const MAX_BASE64_SIZE = 8 * 1024 * 1024; // 8MB limit (留2MB buffer)
  
  if (file.type.startsWith('image/') && file.size > MAX_BASE64_SIZE) {
    // Compress image before converting to base64
    const compressedFile = await compressImage(file, 0.8);
    return await convertFileToBase64(compressedFile);
  }
  
  // Convert file to base64 directly
  return await convertFileToBase64(file);
};

/**
 * Convert file to base64
 */
export const convertFileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Compress image file to reduce base64 size
 * @param {File} file - Image file to compress
 * @param {number} quality - Compression quality (0-1), default 0.8
 * @param {number} maxWidth - Maximum width, default 2048
 * @param {number} maxHeight - Maximum height, default 2048
 * @returns {Promise<Blob>} - Compressed image blob
 */
export const compressImage = (file, quality = 0.8, maxWidth = 2048, maxHeight = 2048) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }
        
        // Create canvas and compress
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Create a new File object from blob
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error('图片压缩失败'));
            }
          },
          file.type,
          quality
        );
      };
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
};

/**
 * Validate URL format
 */
export const isValidUrl = (string) => {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

/**
 * Check if string is base64
 */
export const isBase64 = (string) => {
  return string.startsWith('data:');
};

/**
 * Process file input - supports URL, base64, or File object
 * @param {Object|string|File} input - Input object with type/value, URL string, or File object
 * @param {string} fileType - 'image', 'audio', or 'video'
 * @returns {Promise<string>} - Returns URL or base64 string
 */
export const processFileInput = async (input, fileType = 'image') => {
  // If input is a string (URL or base64)
  if (typeof input === 'string') {
    if (isBase64(input) || isValidUrl(input)) {
      return input;
    }
    throw new Error(`Invalid ${fileType} input: must be a valid URL or base64 string`);
  }

  // If input is a File object
  if (input instanceof File) {
    return await convertFileToBase64(input);
  }

  // If input is an object with type/value structure (from components)
  if (input && typeof input === 'object') {
    if (input.type === 'url') {
      const url = input.value?.trim();
      if (!url) return '';
      if (!isValidUrl(url)) {
        throw new Error(`Invalid ${fileType} URL format`);
      }
      return url;
    } else if (input.type === 'file') {
      // Already base64 in the value field
      return input.value;
    }
  }

  return '';
};

/**
 * Validate file type and size
 */
export const validateFile = (file, acceptedTypes, maxSize) => {
  if (!file) return { valid: false, error: 'File is required' };
  
  // Check file type
  const typeValid = acceptedTypes.some(type => 
    file.type.startsWith(type) || file.name.toLowerCase().endsWith(type.replace('*/', '.'))
  );
  
  if (!typeValid) {
    return { valid: false, error: `Invalid file type. Accepted: ${acceptedTypes.join(', ')}` };
  }

  // Check file size
  if (maxSize && file.size > maxSize) {
    return { valid: false, error: `File size exceeds ${maxSize / 1024 / 1024}MB limit` };
  }

  return { valid: true, error: null };
};

/**
 * Handle file upload with validation
 */
export const handleFileUpload = (event, acceptedTypes, maxSize, setter) => {
  const file = event.target.files[0];
  const validation = validateFile(file, acceptedTypes, maxSize);
  
  if (validation.valid) {
    setter(file);
  } else {
    alert(validation.error);
  }
};

// ==================== 阿里云临时存储上传功能 ====================

/**
 * 获取文件上传凭证
 * @param {string} apiKey - 阿里云 API Key
 * @param {string} modelName - 模型名称
 * @returns {Promise<Object>} 上传凭证数据
 */
const getUploadPolicy = async (apiKey, modelName) => {
  const url = `${API_BASE_URL}/uploads?action=getPolicy&model=${encodeURIComponent(modelName)}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`获取上传凭证失败: ${errorData.message || response.status}`);
  }
  
  const result = await response.json();
  return result.data;
};

/**
 * 上传文件到阿里云 OSS 临时存储
 * @param {Object} policyData - 上传凭证数据
 * @param {File} file - 要上传的文件
 * @returns {Promise<string>} oss:// URL
 */
const uploadFileToOss = async (policyData, file) => {
  const key = `${policyData.upload_dir}/${file.name}`;
  
  const formData = new FormData();
  formData.append('OSSAccessKeyId', policyData.oss_access_key_id);
  formData.append('Signature', policyData.signature);
  formData.append('policy', policyData.policy);
  formData.append('x-oss-object-acl', policyData.x_oss_object_acl);
  formData.append('x-oss-forbid-overwrite', policyData.x_oss_forbid_overwrite);
  formData.append('key', key);
  formData.append('success_action_status', '200');
  formData.append('file', file); // file 必须是最后一个表单域
  
  const response = await fetch(policyData.upload_host, {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`文件上传失败: ${errorText || response.status}`);
  }
  
  return `oss://${key}`;
};

/**
 * 上传文件到阿里云临时存储并获取 oss:// URL
 * 
 * 使用限制：
 * - 文件与模型绑定：上传时指定的模型须与后续调用的模型一致
 * - 文件有效期：48小时
 * - 限流：100 QPS
 * 
 * @param {File} file - 要上传的文件
 * @param {string} apiKey - 阿里云 API Key
 * @param {string} modelName - 模型名称
 * @returns {Promise<string>} oss:// URL
 */
export const uploadToAliyunOss = async (file, apiKey, modelName) => {
  // 1. 获取上传凭证
  const policyData = await getUploadPolicy(apiKey, modelName);
  
  // 2. 检查文件大小限制
  const maxSizeMB = parseInt(policyData.max_file_size_mb) || 100;
  if (file.size > maxSizeMB * 1024 * 1024) {
    throw new Error(`文件大小超过限制: 最大 ${maxSizeMB}MB`);
  }
  
  // 3. 上传文件到 OSS
  const ossUrl = await uploadFileToOss(policyData, file);
  
  return ossUrl;
};

/**
 * 检查是否为 OSS URL
 * @param {string} url - 要检查的 URL
 * @returns {boolean}
 */
export const isOssUrl = (url) => {
  return typeof url === 'string' && url.startsWith('oss://');
};
