/**
 * Generic file upload utility function
 * Since there's no backend upload server, convert file to base64 directly
 * For large images, compress before converting to base64
 */
export const uploadFileToTempServer = async (file) => {
  // Check if file needs compression (> 5MB or images for wan2.6-image)
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
