/**
 * Payload Builders - Strategy Pattern for Request Format Construction
 * 
 * Each builder is responsible for constructing the request payload for a specific format.
 * This allows us to add new models by simply adding configuration, without modifying core logic.
 */

/**
 * Helper: Extract text prompt from params
 */
const extractPrompt = (params) => {
    if (params.input.prompt) return params.input.prompt;
    if (params.input.template) return params.input.template;
    if (params.input.messages?.[0]?.content) {
        const textItem = params.input.messages[0].content.find(item => item.text);
        return textItem?.text || '';
    }
    return '';
};

/**
 * Helper: Extract single image URL from params
 */
const extractImage = (params) => {
    // Support multiple field names
    if (params.input.image_url) return params.input.image_url;
    if (params.input.base_image_url) return params.input.base_image_url;
    if (params.input.messages?.[0]?.content) {
        const imageItem = params.input.messages[0].content.find(item => item.image || item.image_url);
        return imageItem?.image || imageItem?.image_url || '';
    }
    return '';
};

/**
 * Helper: Extract all images from params
 */
const extractImages = (params) => {
    const images = [];
    if (params.input.messages?.[0]?.content) {
        params.input.messages[0].content.forEach(item => {
            // Support both item.image and item.image_url
            const imageUrl = item.image || item.image_url;
            if (imageUrl) images.push(imageUrl);
        });
    }
    return images;
};

/**
 * Helper: Build content array for multimodal messages
 */
const buildMultimodalContent = (params) => {
    const content = [];
    
    // Add images first - 支持 image 和 image_url 两种字段
    if (params.input.messages?.[0]?.content) {
        params.input.messages[0].content.forEach(item => {
            // 支持 item.image 或 item.image_url
            const imageUrl = item.image || item.image_url;
            if (imageUrl) {
                content.push({ image: imageUrl });
            }
        });
    }
    
    // Add text prompt last
    const prompt = extractPrompt(params);
    if (prompt) content.push({ text: prompt });
    
    return content;
};

/**
 * Helper: Build common parameters based on model capabilities
 */
const buildParameters = (params, modelConfig) => {
    const parameters = {};
    const caps = modelConfig.capabilities || {};
    
    // Size/Resolution
    if (params.parameters.size) {
        parameters.size = params.parameters.size;
    }
    
    // Output count
    if (caps.n && params.parameters.n !== undefined) {
        parameters.n = params.parameters.n;
    } else if (!caps.n) {
        parameters.n = 1;
    }
    
    // Prompt extend
    if (caps.prompt_extend !== undefined) {
        parameters.prompt_extend = params.parameters.prompt_extend ?? true;
    }
    
    // Negative prompt
    if (caps.negative_prompt && params.parameters.negative_prompt) {
        parameters.negative_prompt = params.parameters.negative_prompt;
    }
    
    // Watermark
    if (caps.watermark !== undefined) {
        parameters.watermark = params.parameters.watermark ?? false;
    }
    
    // Seed
    if (caps.seed && params.parameters.seed !== undefined) {
        parameters.seed = params.parameters.seed;
    }
    
    // Duration (for video)
    if (params.parameters.duration !== undefined) {
        parameters.duration = params.parameters.duration;
    }

    // Strength (for image editing intensity)
    if (caps.strength && params.parameters.strength !== undefined) {
        parameters.strength = params.parameters.strength;
    }

    // Upscale factor (for super resolution)
    if (caps.upscale_factor && params.parameters.upscale_factor !== undefined) {
        parameters.upscale_factor = params.parameters.upscale_factor;
    }

    // Output ratio (for expand function)
    if (params.parameters.output_ratio !== undefined) {
        parameters.output_ratio = params.parameters.output_ratio;
    }
    
    return parameters;
};

/**
 * Format: Multimodal Messages (Qwen Image models + Wan2.6 series)
 * Used by: qwen-image-max, qwen-image-plus, qwen-image, qwen-image-edit-*, wan2.6-t2i, wan2.6-image
 */
export const multimodalMessages = (modelId, params, modelConfig) => {
    const content = buildMultimodalContent(params);
    const hasImages = content.some(item => item.image);
    const baseParams = buildParameters(params, modelConfig);
    
    // wan2.6-image 图像编辑模式：必须输入图片
    if (modelId === 'wan2.6-image' && !hasImages) {
        throw new Error(`${modelConfig.name}必须上传至少一张参考图片才能进行编辑`);
    }
    
    // For qwen-image-edit series: Must have at least one image (editing models)
    if (modelId.startsWith('qwen-image-edit') && !hasImages) {
        throw new Error(`${modelConfig.name}必须上传至少一张图片才能进行编辑`);
    }
    
    return {
        model: modelId,
        input: {
            messages: [{
                role: 'user',
                content: content
            }]
        },
        parameters: baseParams
    };
};

/**
 * Format: Standard Text-to-Image
 * Used by: wan2.6-t2i, wan2.5-t2i-preview, wan2.2-t2i-*, wanx2.1-t2i-*, etc.
 */
export const text2image = (modelId, params, modelConfig) => {
    return {
        model: modelId,
        input: {
            prompt: extractPrompt(params),
            negative_prompt: params.parameters.negative_prompt
        },
        parameters: {
            ...buildParameters(params, modelConfig),
            style: params.parameters.style
        }
    };
};

/**
 * Format: Image Array Synthesis (Wan 2.5 I2I)
 * Used by: wan2.5-i2i-preview
 */
export const imageArraySynthesis = (modelId, params, modelConfig) => {
    const images = extractImages(params);
    
    // Must have at least one image for image-to-image synthesis
    if (images.length === 0) {
        throw new Error(`${modelConfig.name}必须上传至少一张图片`);
    }
    
    return {
        model: modelId,
        input: {
            prompt: extractPrompt(params),
            images: images
        },
        parameters: buildParameters(params, modelConfig)
    };
};

/**
 * Format: Function-based Image Edit (Wanx 2.1)
 * Used by: wanx2.1-imageedit
 */
export const functionImageEdit = (modelId, params, modelConfig) => {
    const baseImage = extractImage(params);
    
    // Must have base image for editing
    if (!baseImage) {
        throw new Error(`${modelConfig.name}必须上传基准图片`);
    }
    
    const payload = {
        model: modelId,
        input: {
            function: params.input.function || 'description_edit',
            prompt: extractPrompt(params),
            base_image_url: baseImage
        },
        parameters: buildParameters(params, modelConfig)
    };
    
    // Add mask image URL if available
    if (params.input.mask_image_url) {
        payload.input.mask_image_url = params.input.mask_image_url;
    }
    
    return payload;
};

/**
 * Format: Sketch to Image
 * Used by: wanx-sketch-to-image-lite
 */
export const sketchToImage = (modelId, params, modelConfig) => {
    const sketchImage = extractImage(params);
    
    // Must have sketch image
    if (!sketchImage) {
        throw new Error(`${modelConfig.name}必须上传草图或涂鸦图片`);
    }
    
    return {
        model: modelId,
        input: {
            sketch_image_url: sketchImage,
            prompt: extractPrompt(params)
        },
        parameters: {
            size: params.parameters.size || '768*768',
            n: params.parameters.n || 1,
            style: params.parameters.style,
            sketch_weight: params.parameters.sketch_weight || 10,
            sketch_extraction: params.parameters.sketch_extraction || false,
            sketch_color: params.parameters.sketch_color || []
        }
    };
};

/**
 * Format: Local Repaint (X-Painting)
 * Used by: wanx-x-painting
 */
export const localRepaint = (modelId, params, modelConfig) => {
    const images = extractImages(params);
    
    // Must have at least 2 images (base + mask)
    if (images.length < 2) {
        throw new Error(`${modelConfig.name}必须上传原始图片和遮罩图片（涂抹区域）`);
    }
    
    return {
        model: modelId,
        input: {
            base_image_url: images[0],
            mask_image_url: images[1],
            prompt: extractPrompt(params)
        },
        parameters: {
            size: params.parameters.size || '1024*1024',
            n: params.parameters.n || 1,
            style: params.parameters.style,
            mask_color: params.parameters.mask_color || []
        }
    };
};

/**
 * Format: Image Translation
 * Used by: qwen-mt-image
 */
export const imageTranslation = (modelId, params, modelConfig) => {
    return {
        model: modelId,
        input: {
            image_url: params.input.image_url,
            source_lang: params.input.source_lang,
            target_lang: params.input.target_lang,
            ext: params.input.ext || {}
        },
        parameters: params.parameters
    };
};

/**
 * Format: Style Repaint
 * Used by: wanx-style-repaint-v1
 */
export const styleRepaint = (modelId, params, modelConfig) => {
    const payload = {
        model: modelId,
        input: {
            image_url: params.input.image_url,
            style_index: params.input.style_index
        }
    };
    
    // Add style reference URL if provided (when style_index is -1)
    if (params.input.style_ref_url) {
        payload.input.style_ref_url = params.input.style_ref_url;
    }
    
    return payload;
};

/**
 * Format: Out Painting (Image Expansion)
 * Used by: image-out-painting
 */
export const outPainting = (modelId, params, modelConfig) => {
    return {
        model: modelId,
        input: {
            image_url: params.input.image_url
        },
        parameters: {
            angle: params.parameters.angle || 0,
            output_ratio: params.parameters.output_ratio || '',
            x_scale: params.parameters.x_scale || 1.0,
            y_scale: params.parameters.y_scale || 1.0,
            top_offset: params.parameters.top_offset || 0,
            bottom_offset: params.parameters.bottom_offset || 0,
            left_offset: params.parameters.left_offset || 0,
            right_offset: params.parameters.right_offset || 0,
            best_quality: params.parameters.best_quality || false,
            limit_image_size: params.parameters.limit_image_size || true,
            add_watermark: params.parameters.add_watermark || true
        }
    };
};

/**
 * Format: Virtual Model (Shoe Model)
 * Used by: shoemodel-v1
 */
export const virtualModel = (modelId, params, modelConfig) => {
    return {
        model: modelId,
        input: {
            template_image_url: params.input.template_image_url,
            shoe_image_url: params.input.shoe_image_url,
            scale: params.parameters.scale
        },
        parameters: {
            n: params.parameters.n || 1
        }
    };
};

/**
 * Format: Background Generation
 * Used by: wanx-background-generation-v2
 */
export const backgroundGeneration = (modelId, params, modelConfig) => {
    const payload = {
        model: modelId,
        input: {
            base_image_url: params.input.base_image_url
        },
        parameters: {
            n: params.parameters.n || 1,
            model_version: params.parameters.model_version || 'v3'
        }
    };
    
    // Add optional reference image if provided
    if (params.input.ref_image_url) {
        payload.input.ref_image_url = params.input.ref_image_url;
        payload.parameters.noise_level = params.parameters.noise_level ?? 300;
    }
    
    // Add optional reference prompt if provided
    if (params.input.ref_prompt) {
        payload.input.ref_prompt = params.input.ref_prompt;
    }
    
    // Add negative reference prompt if provided
    if (params.input.neg_ref_prompt) {
        payload.input.neg_ref_prompt = params.input.neg_ref_prompt;
    }
    
    // Add reference prompt weight if both ref image and prompt are provided
    if (params.input.ref_image_url && params.input.ref_prompt) {
        payload.parameters.ref_prompt_weight = params.parameters.ref_prompt_weight ?? 0.5;
    }
    
    // Add edge guidance elements (foreground/background)
    if (params.input.reference_edge) {
        payload.input.reference_edge = {};
        
        // Foreground edges
        if (params.input.reference_edge.foreground_edge?.length > 0) {
            payload.input.reference_edge.foreground_edge = params.input.reference_edge.foreground_edge;
            payload.input.reference_edge.foreground_edge_prompt = params.input.reference_edge.foreground_edge_prompt || [];
        }
        
        // Background edges
        if (params.input.reference_edge.background_edge?.length > 0) {
            payload.input.reference_edge.background_edge = params.input.reference_edge.background_edge;
            payload.input.reference_edge.background_edge_prompt = params.input.reference_edge.background_edge_prompt || [];
        }
    }
    
    return payload;
};

/**
 * Format: AI Try-on
 * Used by: aitryon, aitryon-plus
 */
export const aiTryon = (modelId, params, modelConfig) => {
    const payload = {
        model: modelId,
        input: {
            person_image_url: params.input.person_image_url
        },
        parameters: {
            resolution: params.parameters.resolution || -1,
            restore_face: params.parameters.restore_face !== undefined ? params.parameters.restore_face : true
        }
    };
    
    // Add optional garment images if provided
    if (params.input.top_garment_url) {
        payload.input.top_garment_url = params.input.top_garment_url;
    }
    if (params.input.bottom_garment_url) {
        payload.input.bottom_garment_url = params.input.bottom_garment_url;
    }
    
    return payload;
};

/**
 * Format: WordArt Semantic (Text Deformation)
 * Used by: wordart-semantic
 */
export const wordartSemantic = (modelId, params, modelConfig) => {
    const payload = {
        model: modelId,
        input: {
            text: params.input.text || params.input.prompt,
            prompt: params.input.prompt || params.input.text
        },
        parameters: {
            steps: params.parameters.steps || 30,
            n: params.parameters.n || 2,
            output_image_ratio: params.parameters.size || '1024*1024'
        }
    };
    
    // Add font if specified
    if (params.parameters.font_name) {
        payload.parameters.font_name = params.parameters.font_name;
    }
    if (params.parameters.ttf_url) {
        payload.parameters.ttf_url = params.parameters.ttf_url;
    }
    
    return payload;
};

/**
 * Format: WordArt Texture (Text Texture)
 * Used by: wordart-texture
 */
export const wordartTexture = (modelId, params, modelConfig) => {
    let payload;
    
    if (params.input.image_url) {
        // Image input mode
        payload = {
            model: modelId,
            input: {
                image: {
                    image_url: params.input.image_url
                },
                prompt: params.input.prompt,
                texture_style: params.input.texture_style
            },
            parameters: {
                n: params.parameters.n || 1
            }
        };
    } else {
        // Text input mode
        payload = {
            model: modelId,
            input: {
                text: {
                    text_content: params.input.text || params.input.prompt,
                    font_name: params.parameters.font_name,
                    output_image_ratio: params.parameters.output_ratio || '1:1'
                },
                prompt: params.input.prompt,
                texture_style: params.input.texture_style
            },
            parameters: {
                image_short_size: params.parameters.image_short_size || 704,
                n: params.parameters.n || 1,
                alpha_channel: params.parameters.alpha_channel || false
            }
        };
        
        // Add ref_image_url only if it exists
        if (params.input.ref_image_url) {
            payload.input.ref_image_url = params.input.ref_image_url;
        }
    }
    
    // Remove undefined properties to avoid API errors
    if (!payload.input.texture_style) delete payload.input.texture_style;
    if (payload.parameters.alpha_channel === false) delete payload.parameters.alpha_channel;
    
    return payload;
};

/**
 * Format: Standard Video Generation (T2V)
 * Used by: wan2.6-t2v, wan2.5-t2v-preview, wan2.2-t2v-plus, wanx2.1-t2v-turbo, wanx2.1-t2v-plus
 */
export const videoGeneration = (modelId, params, modelConfig) => {
    const videoInput = {
        prompt: extractPrompt(params)
    };
    
    // Add audio_url if provided and model supports audio
    if (params.input.audio_url && modelConfig.capabilities?.audio) {
        videoInput.audio_url = params.input.audio_url;
    }
    
    // Add negative_prompt if model supports it
    if (params.parameters.negative_prompt && modelConfig.capabilities?.negative_prompt) {
        videoInput.negative_prompt = params.parameters.negative_prompt;
    }
    
    const videoParams = {
        prompt_extend: params.parameters.prompt_extend ?? true,
        watermark: params.parameters.watermark ?? false
    };
    
    // Only add duration if model supports it (default: true for backward compatibility)
    if (modelConfig.capabilities?.duration !== false) {
        videoParams.duration = params.parameters.duration || 5;
    }
    
    // Handle size/resolution
    if (params.parameters.size) {
        // If already in 'width*height' format, use directly
        if (params.parameters.size.includes('*')) {
            videoParams.size = params.parameters.size;
        } else {
            // Convert resolution label (480P/720P/1080P) to actual size
            // Default to 16:9 landscape format as per API documentation
            const resolutionMap = {
                '480P': '832*480',
                '720P': '1280*720',
                '1080P': '1920*1080'
            };
            
            videoParams.size = resolutionMap[params.parameters.size] || '1920*1080';
        }
    }
    
    const payload = {
        model: modelId,
        input: videoInput,
        parameters: videoParams
    };
    
    // Add shot_type for models that support it
    if (modelConfig.capabilities?.shot_type && params.parameters.prompt_extend !== false) {
        payload.parameters.shot_type = params.parameters.shot_type || 'single';
    }
    
    // Add seed if model supports it and seed is provided
    if (modelConfig.capabilities?.seed && params.parameters.seed) {
        payload.parameters.seed = params.parameters.seed;
    }
    
    return payload;
};

/**
 * Format: Image-to-Video (I2V)
 * Used by: wan2.6-i2v, wan2.6-i2v-flash, wan2.5-i2v-preview, wan2.2-i2v-flash
 */
export const imageToVideo = (modelId, params, modelConfig) => {
    // Check if this is template mode (video effect)
    if (params.input.template) {
        // Template mode: use template instead of prompt
        const videoInput = {
            template: params.input.template
        };
        
        // Add image_url (from img_url parameter)
        if (params.input.img_url) {
            videoInput.img_url = params.input.img_url;
        } else if (params.input.image_url) {
            videoInput.img_url = params.input.image_url;
        }
        
        const videoParams = {
            watermark: params.parameters.watermark ?? false
        };
        
        // Only add duration if model supports it
        if (modelConfig.capabilities?.duration !== false) {
            videoParams.duration = params.parameters.duration || 5;
        }
        
        // Handle size/resolution
        if (params.parameters.size) {
            if (params.parameters.size.includes('*')) {
                videoParams.size = params.parameters.size;
            } else {
                const resolutionMap = {
                    '480P': '832*480',
                    '720P': '1280*720',
                    '1080P': '1920*1080'
                };
                videoParams.size = resolutionMap[params.parameters.size] || '1920*1080';
            }
        }
        
        return {
            model: modelId,
            input: videoInput,
            parameters: videoParams
        };
    }
    
    // Regular mode: use prompt
    const payload = videoGeneration(modelId, params, modelConfig);
    
    // Add img_url if provided (normalize img_url to image_url for API)
    if (params.input.img_url) {
        payload.input.img_url = params.input.img_url;
    } else if (params.input.image_url) {
        payload.input.img_url = params.input.image_url;
    }
    
    // Add first_frame_url for keyframe-to-video (normalize first_frame_url to first_frame_image)
    if (params.input.first_frame_url) {
        payload.input.first_frame_image = params.input.first_frame_url;
    } else if (params.input.first_frame_image) {
        payload.input.first_frame_image = params.input.first_frame_image;
    }
    
    // Add last_frame_image if provided
    if (params.input.last_frame_url) {
        payload.input.last_frame_image = params.input.last_frame_url;
    } else if (params.input.last_frame_image) {
        payload.input.last_frame_image = params.input.last_frame_image;
    }
    
    return payload;
};

/**
 * Format: Reference-to-Video (R2V)
 * Used by: wan2.6-r2v
 */
export const referenceToVideo = (modelId, params, modelConfig) => {
    return {
        model: modelId,
        input: {
            prompt: extractPrompt(params),
            reference_video_urls: params.input.reference_video_urls || [],
            // negative_prompt 应该在 input 里（根据 API 文档）
            negative_prompt: params.input.negative_prompt
        },
        parameters: {
            size: params.parameters.size,
            duration: params.parameters.duration || 5,
            shot_type: params.parameters.shot_type,
            seed: params.parameters.seed,
            watermark: params.parameters.watermark ?? false
        }
    };
};

/**
 * Format: Video Editing (VACE Plus)
 * Used by: wanx2.1-vace-plus
 */
export const videoEditing = (modelId, params, modelConfig) => {
    const vacePlusInput = {
        function: params.input.function,
        prompt: extractPrompt(params)
    };
    
    // Add function-specific parameters
    switch (params.input.function) {
        case 'image_reference':
            vacePlusInput.ref_images_url = params.input.ref_images_url || [];
            break;
        case 'video_repainting':
            vacePlusInput.video_url = params.input.video_url;
            break;
        case 'video_edit':
            vacePlusInput.video_url = params.input.video_url;
            vacePlusInput.mask_image_url = params.input.mask_image_url;
            if (params.input.mask_frame_id) {
                vacePlusInput.mask_frame_id = params.input.mask_frame_id;
            }
            break;
        case 'video_outpainting':
            vacePlusInput.video_url = params.input.video_url;
            break;
        case 'video_extension':
            vacePlusInput.first_clip_url = params.input.first_clip_url;
            break;
    }
    
    // 构建 parameters 对象
    const vacePlusParams = {
        size: params.parameters.size,
        prompt_extend: params.parameters.prompt_extend ?? true,
        watermark: params.parameters.watermark ?? false
    };
    
    // obj_or_bg 只在 image_reference 功能时有效
    if (params.input.function === 'image_reference' && params.parameters.obj_or_bg) {
        vacePlusParams.obj_or_bg = params.parameters.obj_or_bg;
    }
    
    // video_repainting 特有参数
    if (params.input.function === 'video_repainting') {
        vacePlusParams.control_condition = params.parameters.control_condition || 'depth';
    }
    
    // video_edit 特有参数
    if (params.input.function === 'video_edit') {
        vacePlusParams.mask_type = params.parameters.mask_type || 'tracking';
        if (params.parameters.expand_ratio !== undefined) {
            vacePlusParams.expand_ratio = params.parameters.expand_ratio;
        }
    }
    
    // video_outpainting 特有参数
    if (params.input.function === 'video_outpainting') {
        vacePlusParams.top_scale = params.parameters.top_scale ?? 1.5;
        vacePlusParams.bottom_scale = params.parameters.bottom_scale ?? 1.5;
        vacePlusParams.left_scale = params.parameters.left_scale ?? 1.5;
        vacePlusParams.right_scale = params.parameters.right_scale ?? 1.5;
    }
    
    // seed 可选
    if (params.parameters.seed) {
        vacePlusParams.seed = params.parameters.seed;
    }
    
    return {
        model: modelId,
        input: vacePlusInput,
        parameters: vacePlusParams
    };
};

/**
 * Format: Digital Human Image Detection
 * Used by: wan2.2-s2v-detect
 */
export const digitalHumanDetect = (modelId, params, modelConfig) => {
    return {
        model: modelId,
        input: {
            image_url: params.input.image_url
        },
        parameters: {}
    };
};

/**
 * Format: Digital Human Speech-to-Video
 * Used by: wan2.2-s2v
 */
export const digitalHumanS2V = (modelId, params, modelConfig) => {
    return {
        model: modelId,
        input: {
            image_url: params.input.image_url,
            audio_url: params.input.audio_url,
            style_type: params.input.style_type || 'speech'
        },
        parameters: {
            size: params.parameters.size,
            style_type: params.input.style_type || 'speech'
        }
    };
};

/**
 * Format: Emoji Video Generation
 * Used by: emoji-v1
 */
export const emojiVideo = (modelId, params, modelConfig) => {
    if (!params.input.face_bbox || !params.input.ext_bbox) {
        throw new Error('Emoji video generation requires face_bbox and ext_bbox coordinates. Please call face detection API first.');
    }
    
    return {
        model: modelId,
        input: {
            image_url: params.input.image_url,
            driven_id: params.input.driven_id || 'mengwa_kaixin',
            face_bbox: params.input.face_bbox,
            ext_bbox: params.input.ext_bbox
        }
    };
};

/**
 * Format: Video Character Swap
 * Used by: wan2.2-animate-mix
 */
export const videoCharacterSwap = (modelId, params, modelConfig) => {
    return {
        model: modelId,
        input: {
            image_url: params.input.image_url,
            video_url: params.input.video_url,
            mode: params.input.mode || 'wan_std'
        },
        parameters: {
            size: params.parameters.size
        }
    };
};

/**
 * Format: Image Motion Transfer
 * Used by: wan2.2-animate-move
 */
export const imageMotionTransfer = (modelId, params, modelConfig) => {
    return {
        model: modelId,
        input: {
            image_url: params.input.image_url,
            video_url: params.input.video_url,
            mode: params.input.mode || 'wan_std'
        },
        parameters: {
            size: params.parameters.size
        }
    };
};

/**
 * Format: Video Effect (视频特效)
 * Used by: wanx2.1-i2v-plus, wanx2.1-i2v-turbo (I2V特效), wanx2.1-kf2v-plus (KF2V特效)
 */
export const videoEffect = (modelId, params, modelConfig) => {
    const effectInput = {};
    
    // 根据特效类型使用不同的图片字段
    if (modelConfig.effectType === 'kf2v') {
        // 首尾帧特效使用 first_frame_url
        effectInput.first_frame_url = params.input.img_url || params.input.first_frame_url;
    } else {
        // 首帧特效使用 img_url
        effectInput.img_url = params.input.img_url || params.input.image_url;
    }
    
    // 添加 template
    if (params.input.template) {
        effectInput.template = params.input.template;
    }
    
    return {
        model: modelId,
        input: effectInput,
        parameters: {
            resolution: params.parameters.resolution || '720P',
            prompt_extend: params.parameters.prompt_extend ?? true,
            watermark: params.parameters.watermark ?? false
        }
    };
};

/**
 * Format: Keyframe-to-Video (KF2V) - 首尾帧生视频
 * Used by: wan2.2-kf2v-flash, wanx2.1-kf2v-plus
 */
export const keyframeToVideo = (modelId, params, modelConfig) => {
    const kf2vInput = {
        first_frame_url: params.input.first_frame_url
    };
    
    // Add last_frame_url if provided (首尾帧模式)
    if (params.input.last_frame_url) {
        kf2vInput.last_frame_url = params.input.last_frame_url;
    }
    
    // Add prompt if provided (首尾帧模式)
    if (params.input.prompt) {
        kf2vInput.prompt = params.input.prompt;
    }
    
    // Add template if provided (特效模式)
    if (params.input.template) {
        kf2vInput.template = params.input.template;
    }
    
    // Add negative_prompt if provided
    if (params.input.negative_prompt && modelConfig.capabilities?.negative_prompt) {
        kf2vInput.negative_prompt = params.input.negative_prompt;
    }
    
    const kf2vParams = {
        resolution: params.parameters.resolution || '720P',
        prompt_extend: params.parameters.prompt_extend ?? true,
        watermark: params.parameters.watermark ?? false
    };
    
    // Add seed if provided
    if (params.parameters.seed && modelConfig.capabilities?.seed) {
        kf2vParams.seed = params.parameters.seed;
    }
    
    return {
        model: modelId,
        input: kf2vInput,
        parameters: kf2vParams
    };
};

/**
 * Payload Builder Registry
 * Maps requestFormat identifiers to their builder functions
 */
export const payloadBuilders = {
    multimodalMessages,
    text2image,
    imageArraySynthesis,
    functionImageEdit,
    sketchToImage,
    localRepaint,
    imageTranslation,
    styleRepaint,
    outPainting,
    virtualModel,
    backgroundGeneration,
    aiTryon,
    wordartSemantic,
    wordartTexture,
    videoGeneration,
    imageToVideo,
    videoEffect,
    keyframeToVideo,
    referenceToVideo,
    videoEditing,
    digitalHumanDetect,
    digitalHumanS2V,
    emojiVideo,
    videoCharacterSwap,
    imageMotionTransfer
};
