// Define protocols
export const PROTOCOLS = {
    SYNC_MULTIMODAL: 'sync_multimodal',    // Qwen-VL-Plus/Max
    ASYNC_T2I: 'async_t2i',               // Text-to-Image
    ASYNC_VIDEO: 'async_video',           // Text-to-Video
    ASYNC_I2V: 'async_i2v',               // Image-to-Video
    ASYNC_KF2V: 'async_kf2v',             // Keyframe-to-Video (首尾帧生视频)
    ASYNC_R2V: 'async_r2v',                // Reference-to-Video
    ASYNC_VACE_PLUS: 'async_vace_plus',     // Video Editing Unified Model
    ASYNC_S2V: 'async_s2v'                 // Speech-to-Video (Digital Human)
};

// Model output types (used for result handling)
export const OUTPUT_TYPES = {
    IMAGE: 'image',
    VIDEO: 'video'
};

// Model categories (for UI filtering)
export const MODEL_CATEGORIES = {
    TEXT_TO_IMAGE: 'text-to-image',        // 纯文生图
    IMAGE_EDITING: 'image-editing',        // 图像编辑
    IMAGE_SYNTHESIS: 'image-synthesis',    // 图像合成/融合
    SPECIAL_EFFECT: 'special-effect',      // 特效类（背景生成、AI试衣等）
    CREATIVE: 'creative'                   // 创意类（文字艺术、海报等）
};

// Resolution Labels
export const RESOLUTION_LABELS = {
    '480P': '480P (SD)',
    '720P': '720P (HD)', 
    '1080P': '1080P (FHD)',
    // 480P 档位具体尺寸
    '832*480': '832×480 (16:9)',
    '480*832': '480×832 (9:16)',
    '624*624': '624×624 (1:1)',
    // 720P 档位具体尺寸
    '1280*720': '1280×720 (16:9)',
    '720*1280': '720×1280 (9:16)',
    '960*960': '960×960 (1:1)',
    '832*1088': '832×1088 (3:4)',
    '1088*832': '1088×832 (4:3)',
    // 1080P 档位具体尺寸
    '1920*1080': '1920×1080 (16:9)',
    '1080*1920': '1080×1920 (9:16)',
    '1440*1440': '1440×1440 (1:1)',
    '1632*1248': '1632×1248 (4:3)',
    '1248*1632': '1248×1632 (3:4)'
};

// Video Models Configuration
export const VIDEO_MODELS = [
    {
        id: 'wan2.6-t2v',
        name: '万相2.6 (Pro)',
        provider: '阿里通义实验室', 
        description: '2.6代专业版，支持多镜头叙事与音频驱动',
        protocol: PROTOCOLS.ASYNC_VIDEO,
        endpoint: '/services/aigc/video-generation/video-synthesis',
        requestFormat: 'videoGeneration',
        outputType: OUTPUT_TYPES.VIDEO,
        defaultRes: '1080P',
        resolutions: ['720P', '1080P'],
        capabilities: {
            prompt_extend: true,
            shot_type: true,
            audio: true,
            negative_prompt: true,
            seed: true,
            frame_selection: false
        }
    },
    {
        id: 'wan2.5-t2v-preview',
        name: '万相2.5 (Preview)',
        provider: '阿里通义实验室',
        description: '2.5代预览版，支持音频驱动',
        protocol: PROTOCOLS.ASYNC_VIDEO,
        endpoint: '/services/aigc/video-generation/video-synthesis',
        requestFormat: 'videoGeneration',
        outputType: OUTPUT_TYPES.VIDEO,
        defaultRes: '1080P',
        resolutions: ['480P', '720P', '1080P'],
        capabilities: {
            prompt_extend: true,
            audio: true,
            negative_prompt: true,
            seed: true,
            shot_type: false,
            frame_selection: false
        }
    },
    {
        id: 'wan2.2-t2v-plus',
        name: '万相2.2 (Plus)',
        provider: '阿里通义实验室',
        description: '2.2代专业版，较2.1模型稳定性与成功率全面提升',
        protocol: PROTOCOLS.ASYNC_VIDEO,
        endpoint: '/services/aigc/video-generation/video-synthesis',
        requestFormat: 'videoGeneration',
        outputType: OUTPUT_TYPES.VIDEO,
        defaultRes: '1080P',
        resolutions: ['480P', '1080P'],
        capabilities: {
            prompt_extend: true,
            negative_prompt: true,
            seed: true,
            audio: false
        }
    },
    {
        id: 'wanx2.1-t2v-turbo',
        name: '万相2.1 (Turbo)',
        provider: '阿里通义实验室',
        description: '2.1代极速版，较2.1模型速度提升50%',
        protocol: PROTOCOLS.ASYNC_VIDEO,
        endpoint: '/services/aigc/video-generation/video-synthesis',
        requestFormat: 'videoGeneration',
        outputType: OUTPUT_TYPES.VIDEO,
        defaultRes: '1280*720',
        resolutions: ['832*480', '480*832', '624*624', '1280*720', '720*1280', '960*960', '1088*832', '832*1088'],
        capabilities: {
            prompt_extend: true,
            negative_prompt: true,
            seed: true,
            audio: false
        }
    },
    {
        id: 'wanx2.1-t2v-plus',
        name: '万相2.1 (Plus)',
        provider: '阿里通义实验室',
        description: '2.1代专业版，稳定性与成功率全面提升',
        protocol: PROTOCOLS.ASYNC_VIDEO,
        endpoint: '/services/aigc/video-generation/video-synthesis',
        requestFormat: 'videoGeneration',
        outputType: OUTPUT_TYPES.VIDEO,
        defaultRes: '1280*720',
        resolutions: ['1280*720', '720*1280', '960*960', '1088*832', '832*1088'],
        capabilities: {
            prompt_extend: true,
            negative_prompt: true,
            seed: true,
            audio: false
        }
    }
];

// Image-to-Video Models Configuration  
export const I2V_MODELS = [
    {
        id: 'wan2.6-i2v-flash',
        name: '万相2.6-I2V (Flash)',
        provider: '阿里通义实验室',
        description: '2.6代图生视频极速版，支持多镜头与音频',
        protocol: PROTOCOLS.ASYNC_I2V,
        endpoint: '/services/aigc/video-generation/video-synthesis',
        requestFormat: 'imageToVideo',
        outputType: OUTPUT_TYPES.VIDEO,
        defaultRes: '1080P',
        resolutions: ['480P', '720P', '1080P'],
        capabilities: {
            prompt_extend: true,
            shot_type: true,
            audio: true,
            negative_prompt: true,
            seed: true,
            last_frame: false // 不支持尾帧，只有KF2V模型支持
        }
    },
    {
        id: 'wan2.6-i2v',
        name: '万相2.6-I2V (Pro)',
        provider: '阿里通义实验室',
        description: '2.6代图生视频专业版，高质量输出',
        protocol: PROTOCOLS.ASYNC_I2V,
        endpoint: '/services/aigc/video-generation/video-synthesis',
        requestFormat: 'imageToVideo',
        outputType: OUTPUT_TYPES.VIDEO,
        defaultRes: '1080P',
        resolutions: ['720P', '1080P'],
        capabilities: {
            prompt_extend: true,
            shot_type: true,
            audio: true,
            negative_prompt: true,
            seed: true,
            last_frame: false // 不支持尾帧，只有KF2V模型支持
        }
    },
    {
        id: 'wan2.5-i2v-preview',
        name: '万相2.5-I2V',
        provider: '阿里通义实验室',
        description: '2.5代图生视频，支持音频驱动',
        protocol: PROTOCOLS.ASYNC_I2V,
        endpoint: '/services/aigc/video-generation/video-synthesis',
        requestFormat: 'imageToVideo',
        outputType: OUTPUT_TYPES.VIDEO,
        defaultRes: '1280*720',
        resolutions: ['832*480', '480*832', '624*624', '1280*720', '720*1280', '960*960', '1088*832', '832*1088', '1920*1080', '1080*1920', '1440*1440'],
        capabilities: {
            prompt_extend: true,
            audio: true,
            negative_prompt: true,
            seed: true,
            shot_type: false,
            last_frame: false, // 不支持尾帧
            duration: false // 不支持自定义时长
        }
    },
    {
        id: 'wan2.2-i2v-flash',
        name: '万相2.2-I2V (Flash)',
        provider: '阿里通义实验室',
        description: '2.2代图生视频极速版',
        protocol: PROTOCOLS.ASYNC_I2V,
        endpoint: '/services/aigc/video-generation/video-synthesis',
        requestFormat: 'imageToVideo',
        outputType: OUTPUT_TYPES.VIDEO,
        defaultRes: '1280*720',
        resolutions: ['832*480', '480*832', '624*624', '1280*720', '720*1280', '960*960', '1088*832', '832*1088', '1920*1080', '1080*1920', '1440*1440'],
        capabilities: {
            prompt_extend: true,
            negative_prompt: true,
            last_frame: false, // 不支持尾帧
            duration: false // 不支持自定义时长
        }
    }
];

// Video Effect Models Configuration (视频特效专用模型)
export const VIDEO_EFFECT_MODELS = [
    // 首帧生视频特效模型
    {
        id: 'wanx2.1-i2v-plus',
        name: '万相2.1-I2V (Plus)',
        provider: '阿里通义实验室',
        description: '图生视频专业版，支持全部首帧特效模板',
        protocol: PROTOCOLS.ASYNC_I2V,
        endpoint: '/services/aigc/image2video/video-synthesis',
        requestFormat: 'videoEffect',
        outputType: OUTPUT_TYPES.VIDEO,
        defaultRes: '720P',
        resolutions: ['480P', '720P'],
        effectType: 'i2v', // 首帧特效
        capabilities: {
            template: true,
            prompt_extend: true,
            // 支持的特效模板列表
            supportedTemplates: [
                // 通用特效
                'squish', 'rotation', 'poke', 'inflate', 'dissolve', 'melt', 'icecream',
                // 单人特效
                'carousel', 'singleheart', 'dance1', 'dance2', 'dance3', 'dance4', 'dance5',
                'mermaid', 'graduation', 'dragon', 'money', 'jellyfish', 'pupil',
                // 单人/动物特效
                'flying', 'rose', 'crystalrose',
                // 双人特效
                'hug', 'frenchkiss', 'coupleheart'
            ]
        }
    },
    {
        id: 'wanx2.1-i2v-turbo',
        name: '万相2.1-I2V (Turbo)',
        provider: '阿里通义实验室',
        description: '图生视频极速版，支持部分首帧特效模板',
        protocol: PROTOCOLS.ASYNC_I2V,
        endpoint: '/services/aigc/image2video/video-synthesis',
        requestFormat: 'videoEffect',
        outputType: OUTPUT_TYPES.VIDEO,
        defaultRes: '720P',
        resolutions: ['480P', '720P'],
        effectType: 'i2v', // 首帧特效
        capabilities: {
            template: true,
            prompt_extend: true,
            // 支持的特效模板列表（Turbo版支持较少）
            supportedTemplates: [
                'squish', 'rotation', 'poke', 'inflate', 'dissolve',
                'carousel', 'singleheart',
                'flying', 'rose', 'crystalrose',
                'hug', 'frenchkiss', 'coupleheart'
            ]
        }
    },
    // 人物变装特效模型（基于首尾帧模型训练，但只需首帧）
    {
        id: 'wanx2.1-kf2v-plus',
        name: '万相2.1 (人物变装)',
        provider: '阿里通义实验室',
        description: '人物变装特效，支持汉服、机甲、杂志封面等风格',
        protocol: PROTOCOLS.ASYNC_KF2V,
        endpoint: '/services/aigc/image2video/video-synthesis',
        requestFormat: 'videoEffect',
        outputType: OUTPUT_TYPES.VIDEO,
        defaultRes: '720P',
        resolutions: ['720P'],
        effectType: 'kf2v',
        capabilities: {
            template: true,
            prompt_extend: true,
            supportedTemplates: ['hanfu-1', 'solaron', 'magazine', 'mech1', 'mech2']
        }
    }
];

// Keyframe-to-Video Models Configuration (首尾帧生视频)
export const KF2V_MODELS = [
    {
        id: 'wan2.2-kf2v-flash',
        name: '万相2.2-KF2V (Flash)',
        provider: '阿里通义实验室',
        description: '万相2.2极速版，较上代模型速度提升50%，稳定性与成功率全面提升',
        protocol: PROTOCOLS.ASYNC_KF2V,
        endpoint: '/services/aigc/image2video/video-synthesis',
        requestFormat: 'keyframeToVideo',
        outputType: OUTPUT_TYPES.VIDEO,
        defaultRes: '720P',
        resolutions: ['480P', '720P', '1080P'],
        capabilities: {
            prompt_extend: true,
            negative_prompt: true,
            seed: true,
            last_frame: true // 支持尾帧
        }
    },
    {
        id: 'wanx2.1-kf2v-plus',
        name: '万相2.1-KF2V (Plus)',
        provider: '阿里通义实验室',
        description: '万相2.1专业版，复杂运动，物理规律还原，画面细腻',
        protocol: PROTOCOLS.ASYNC_KF2V,
        endpoint: '/services/aigc/image2video/video-synthesis',
        requestFormat: 'keyframeToVideo',
        outputType: OUTPUT_TYPES.VIDEO,
        defaultRes: '720P',
        resolutions: ['720P'],
        capabilities: {
            prompt_extend: true,
            negative_prompt: true,
            seed: true,
            last_frame: true // 支持尾帧
        }
    }
];

// Reference-to-Video Models Configuration
export const R2V_MODELS = [
    {
        id: 'wan2.6-r2v',
        name: '万相2.6-R2V (参考生视频)',
        provider: '阿里通义实验室',
        description: '基于参考视频的角色形象和音色生成，支持多镜头叙事',
        protocol: PROTOCOLS.ASYNC_R2V,
        endpoint: '/services/aigc/video-generation/video-synthesis',
        requestFormat: 'referenceToVideo',
        outputType: OUTPUT_TYPES.VIDEO,
        defaultRes: '1920*1080',
        // 分辨率必须是具体数值，不能是 720P/1080P
        resolutions: [
            // 720P 档位
            '1280*720', '720*1280', '960*960', '1088*832', '832*1088',
            // 1080P 档位
            '1920*1080', '1080*1920', '1440*1440', '1632*1248', '1248*1632'
        ],
        capabilities: {
            shot_type: true,
            negative_prompt: true,
            seed: true,
            multi_character: true,
            watermark: true,
            duration: true // 支持 5/10 秒
        }
    }
];

// Video Editing Unified Model (VACE Plus) Configuration
export const VACE_PLUS_MODELS = [
    {
        id: 'wanx2.1-vace-plus',
        name: '万相2.1 (VACE+编辑)',
        provider: '阿里通义实验室',
        description: '通义万相视频编辑统一模型，支持多图参考、视频重绘、局部编辑、视频延展和画面扩展',
        protocol: PROTOCOLS.ASYNC_VACE_PLUS,
        endpoint: '/services/aigc/video-generation/video-synthesis',
        requestFormat: 'videoEditing',
        outputType: OUTPUT_TYPES.VIDEO,
        defaultRes: '1280*720',
        resolutions: ['1280*720', '720*1280', '960*960', '832*1088', '1088*832'],
        capabilities: {
            prompt_extend: true,
            obj_or_bg: true,
            seed: true,
            watermark: true,
            functions: ['image_reference', 'video_repainting', 'video_edit', 'video_outpainting', 'video_extension']
        }
    }
];

// Image Models Configuration
export const IMAGE_MODELS = [
    // Qwen Image Edit models (通义千问图像编辑模型)
    {
        id: 'qwen-image-edit-max',
        name: '通义千问-图像编辑-Max',
        provider: '阿里通义实验室',
        description: '通义千问图像编辑Max模型，支持多图输入和多图输出，可精确修改图内文字、增删或移动物体、改变主体动作、迁移图片风格及增强画面细节',
        category: MODEL_CATEGORIES.IMAGE_EDITING,
        protocol: PROTOCOLS.SYNC_MULTIMODAL,
        endpoint: '/services/aigc/multimodal-generation/generation',
        requestFormat: 'multimodalMessages',
        outputType: OUTPUT_TYPES.IMAGE,
        async: false, // 改为同步模式
        defaultRes: '1024*1024',
        resolutions: ['1024*1024', '1536*1024', '1024*1536', '768*1152', '1152*768', '960*1280', '1280*960', '720*1280', '1280*720'],
        capabilities: {
            negative_prompt: true,
            prompt_extend: true,
            watermark: true,
            seed: true,
            n: true // 输出图像数量 (1-6张)
        }
    },
    {
        id: 'qwen-image-edit-plus',
        name: '通义千问-图像编辑-Plus',
        provider: '阿里通义实验室',
        description: '通义千问图像编辑Plus模型，支持单图编辑和多图融合',
        category: MODEL_CATEGORIES.IMAGE_EDITING,
        protocol: PROTOCOLS.SYNC_MULTIMODAL,
        endpoint: '/services/aigc/multimodal-generation/generation',
        requestFormat: 'multimodalMessages',
        outputType: OUTPUT_TYPES.IMAGE,
        async: false, // 改为同步模式
        defaultRes: '1024*1024',
        resolutions: ['1024*1024', '1536*1024', '1024*1536', '768*1152', '1152*768', '960*1280', '1280*960', '720*1280', '1280*720'],
        capabilities: {
            negative_prompt: true,
            prompt_extend: true,
            watermark: true,
            seed: true,
            n: true // 输出图像数量 (1-6张)
        }
    },
    {
        id: 'qwen-image-edit',
        name: '通义千问-图像编辑',
        provider: '阿里通义实验室',
        description: '通义千问图像编辑基础模型，支持单图编辑和多图融合，仅支持输出1张图片',
        category: MODEL_CATEGORIES.IMAGE_EDITING,
        protocol: PROTOCOLS.SYNC_MULTIMODAL,
        endpoint: '/services/aigc/multimodal-generation/generation',
        requestFormat: 'multimodalMessages',
        outputType: OUTPUT_TYPES.IMAGE,
        async: false, // 改为同步模式
        defaultRes: '1024*1024',
        resolutions: ['1024*1024'],
        capabilities: {
            negative_prompt: true,
            watermark: true,
            seed: true
        }
    },
    // Wanxiang Image Editing models (通义万相图像编辑模型)
    {
        id: 'wanx2.1-imageedit',
        name: '万相2.1-通用图像编辑',
        provider: '阿里通义实验室',
        description: '万相2.1通用图像编辑模型，支持全局风格化、局部风格化、指令编辑、局部重绘、去文字水印、扩图、图像超分、图像上色、线稿生图、参考卡通形象生图',
        category: MODEL_CATEGORIES.IMAGE_EDITING,
        protocol: PROTOCOLS.ASYNC_T2I,
        endpoint: '/services/aigc/image2image/image-synthesis',
        requestFormat: 'functionImageEdit',
        outputType: OUTPUT_TYPES.IMAGE,
        defaultRes: '1024*1024',
        resolutions: ['1024*1024'],
        capabilities: {
            negative_prompt: false,
            watermark: true,
            seed: true,
            n: true, // 输出图像数量 (1-4张)
            functions: [
                'stylization_all',      // 全局风格化
                'stylization_local',    // 局部风格化  
                'description_edit',     // 指令编辑
                'description_edit_with_mask', // 局部重绘
                'remove_watermark',     // 去文字水印
                'expand',              // 扩图
                'super_resolution',    // 图像超分
                'colorization',        // 图像上色
                'doodle',             // 线稿生图
                'control_cartoon_feature' // 参考卡通形象生图
            ]
        }
    },
    {
        id: 'wan2.5-i2i-preview',
        name: '万相2.5-通用图像编辑 (Preview)',
        provider: '阿里通义实验室',
        description: '万相2.5通用图像编辑模型，支持单图编辑、多图融合，支持1-3张图片输入、1-4张图片输出',
        category: MODEL_CATEGORIES.IMAGE_SYNTHESIS,
        protocol: PROTOCOLS.SYNC_MULTIMODAL,
        endpoint: '/services/aigc/multimodal-generation/generation',
        requestFormat: 'imageArraySynthesis',
        outputType: OUTPUT_TYPES.IMAGE,
        async: false, // 官方文档明确说明仅支持同步调用
        defaultRes: '1280*1280',
        resolutions: ['1280*1280', '1536*1024', '1024*1536', '768*1152', '1152*768', '960*1280', '1280*960', '720*1280', '1280*720'],
        capabilities: {
            negative_prompt: true,
            prompt_extend: true,
            watermark: true,
            seed: true,
            n: true // 输出图像数量 (1-4张)
        }
    },
    {
        id: 'wan2.6-image',
        name: '万相2.6-Image (图像生成与编辑)',
        provider: '阿里通义实验室',
        description: '万相2.6图像生成与编辑模型，支持图像编辑和图文混排输出',
        category: MODEL_CATEGORIES.TEXT_TO_IMAGE,
        protocol: PROTOCOLS.ASYNC_T2I,
        endpoint: '/services/aigc/image-generation/generation',
        requestFormat: 'multimodalMessages',
        outputType: OUTPUT_TYPES.IMAGE,
        defaultRes: '1280*1280',
        resolutions: ['1280*1280', '1104*1472', '1472*1104', '960*1696', '1696*960', '768*768', '512*512'],
        capabilities: {
            negative_prompt: true,
            prompt_extend: true,
            watermark: true,
            seed: true,
            enable_interleave: true,
            max_images: true,
            n: true
        }
    },
    {
        id: 'wan2.6-t2i',
        name: '万相2.6-T2I (文生图)',
        provider: '阿里通义实验室',
        description: '万相2.6文生图模型，支持在总像素面积与宽高比约束内自由选尺寸',
        category: MODEL_CATEGORIES.TEXT_TO_IMAGE,
        protocol: PROTOCOLS.ASYNC_T2I,
        endpoint: '/services/aigc/text2image/image-synthesis',
        requestFormat: 'text2image',
        outputType: OUTPUT_TYPES.IMAGE,
        defaultRes: '1280*1280',
        resolutions: ['1280*1280', '1104*1472', '1472*1104', '960*1696', '1696*960'],
        capabilities: {
            negative_prompt: true,
            prompt_extend: true,
            watermark: true,
            seed: true
        }
    },
    {
        id: 'wan2.5-t2i-preview',
        name: '万相2.5-T2I (预览)',
        provider: '阿里通义实验室',
        description: '万相2.5文生图预览版，支持自由尺寸选择',
        category: MODEL_CATEGORIES.TEXT_TO_IMAGE,
        protocol: PROTOCOLS.ASYNC_T2I,
        endpoint: '/services/aigc/text2image/image-synthesis',
        requestFormat: 'text2image',
        outputType: OUTPUT_TYPES.IMAGE,
        defaultRes: '1280*1280',
        resolutions: ['1280*1280', '1104*1472', '1472*1104', '960*1696', '1696*960'],
        capabilities: {
            negative_prompt: true,
            prompt_extend: true,
            watermark: true,
            seed: true
        }
    },
    {
        id: 'wan2.2-t2i-flash',
        name: '万相2.2-T2I (极速版)',
        provider: '阿里通义实验室',
        description: '万相2.2极速版，较2.1模型速度提升50%',
        category: MODEL_CATEGORIES.TEXT_TO_IMAGE,
        protocol: PROTOCOLS.ASYNC_T2I,
        endpoint: '/services/aigc/text2image/image-synthesis',
        requestFormat: 'text2image',
        outputType: OUTPUT_TYPES.IMAGE,
        defaultRes: '1024*1024',
        resolutions: ['1024*1024', '768*768', '512*512'],
        capabilities: {
            negative_prompt: true,
            prompt_extend: true,
            watermark: true,
            seed: true
        }
    },
    {
        id: 'wan2.2-t2i-plus',
        name: '万相2.2-T2I (专业版)',
        provider: '阿里通义实验室',
        description: '万相2.2专业版，较2.1模型稳定性与成功率全面提升',
        category: MODEL_CATEGORIES.TEXT_TO_IMAGE,
        protocol: PROTOCOLS.ASYNC_T2I,
        endpoint: '/services/aigc/text2image/image-synthesis',
        requestFormat: 'text2image',
        outputType: OUTPUT_TYPES.IMAGE,
        defaultRes: '1024*1024',
        resolutions: ['1024*1024', '768*768', '512*512'],
        capabilities: {
            negative_prompt: true,
            prompt_extend: true,
            watermark: true,
            seed: true
        }
    },
    {
        id: 'wanx2.1-t2i-turbo',
        name: '万相2.1-T2I (极速版)',
        provider: '阿里通义实验室',
        description: '万相2.1极速版',
        category: MODEL_CATEGORIES.TEXT_TO_IMAGE,
        protocol: PROTOCOLS.ASYNC_T2I,
        endpoint: '/services/aigc/text2image/image-synthesis',
        requestFormat: 'text2image',
        outputType: OUTPUT_TYPES.IMAGE,
        defaultRes: '1024*1024',
        resolutions: ['1024*1024', '768*768', '512*512'],
        capabilities: {
            negative_prompt: true,
            prompt_extend: true,
            watermark: true,
            seed: true
        }
    },
    {
        id: 'wanx2.1-t2i-plus',
        name: '万相2.1-T2I (专业版)',
        provider: '阿里通义实验室',
        description: '万相2.1专业版',
        category: MODEL_CATEGORIES.TEXT_TO_IMAGE,
        protocol: PROTOCOLS.ASYNC_T2I,
        endpoint: '/services/aigc/text2image/image-synthesis',
        requestFormat: 'text2image',
        outputType: OUTPUT_TYPES.IMAGE,
        defaultRes: '1024*1024',
        resolutions: ['1024*1024', '768*768', '512*512'],
        capabilities: {
            negative_prompt: true,
            prompt_extend: true,
            watermark: true,
            seed: true
        }
    },
    {
        id: 'wanx2.0-t2i-turbo',
        name: '万相2.0-T2I (极速版)',
        provider: '阿里通义实验室',
        description: '万相2.0极速版',
        category: MODEL_CATEGORIES.TEXT_TO_IMAGE,
        protocol: PROTOCOLS.ASYNC_T2I,
        endpoint: '/services/aigc/text2image/image-synthesis',
        requestFormat: 'text2image',
        outputType: OUTPUT_TYPES.IMAGE,
        defaultRes: '1024*1024',
        resolutions: ['1024*1024', '768*768', '512*512'],
        capabilities: {
            negative_prompt: true,
            prompt_extend: true,
            watermark: true,
            seed: true
        }
    },
    {
        id: 'wanx-v1',
        name: '通义万相-V1 (文生图)',
        provider: '阿里通义实验室',
        description: '通义万相V1版本，支持多种图像风格和参考图生成',
        category: MODEL_CATEGORIES.TEXT_TO_IMAGE,
        protocol: PROTOCOLS.ASYNC_T2I,
        endpoint: '/services/aigc/text2image/image-synthesis',
        requestFormat: 'text2image',
        outputType: OUTPUT_TYPES.IMAGE,
        defaultRes: '1024*1024',
        resolutions: ['1024*1024', '720*1280', '768*1152', '1280*720'],
        capabilities: {
            style: true,
            negative_prompt: true,
            watermark: true,
            seed: true,
            ref_img: true,
            ref_strength: true,
            ref_mode: true
        }
    },
    {
        id: 'wanx-sketch-to-image-lite',
        name: '万相-涂鸦作画 (Lite)',
        provider: '阿里通义实验室',
        description: '通义万相涂鸦作画模型，通过手绘图案和文字描述生成精美涂鸦绘画作品',
        category: MODEL_CATEGORIES.IMAGE_EDITING,
        protocol: PROTOCOLS.ASYNC_T2I,
        endpoint: '/services/aigc/image2image/image-synthesis',
        requestFormat: 'sketchToImage',
        outputType: OUTPUT_TYPES.IMAGE,
        defaultRes: '768*768',
        resolutions: ['768*768'],
        capabilities: {
            sketch_input: true,
            style: true,
            n: true, // 输出图像数量 (1-4张)
            sketch_weight: true, // 草图权重
            sketch_extraction: true, // 草图提取
            sketch_color: true // 草图颜色
        }
    },
    {
        id: 'wanx-x-painting',
        name: '万相-图像局部重绘',
        provider: '阿里通义实验室',
        description: '通义万相图像局部重绘模型，根据原始图片、局部区域涂抹图和提示词文字内容，在涂抹区域生成与文字描述相对应的内容',
        category: MODEL_CATEGORIES.IMAGE_EDITING,
        protocol: PROTOCOLS.ASYNC_T2I,
        endpoint: '/services/aigc/image2image/image-synthesis',
        requestFormat: 'localRepaint',
        outputType: OUTPUT_TYPES.IMAGE,
        defaultRes: '1024*1024',
        resolutions: ['1024*1024', '720*1280', '1280*720'],
        capabilities: {
            base_image_input: true,
            mask_image_input: true,
            prompt_required: true,
            n: true, // 输出图像数量 (1-4张)
            style: true,
            mask_color: true // 掩码颜色
        }
    },
    {
        id: 'wanx-style-repaint-v1',
        name: '万相-人像风格重绘',
        provider: '阿里通义实验室',
        description: '人像风格重绘模型支持将人物照片，转换为多种预设或自定义的艺术风格',
        category: MODEL_CATEGORIES.IMAGE_EDITING,
        protocol: PROTOCOLS.ASYNC_T2I,
        endpoint: '/services/aigc/image2image/image-synthesis',
        requestFormat: 'styleRepaint',
        outputType: OUTPUT_TYPES.IMAGE,
        defaultRes: '1024*1024',
        resolutions: ['1024*1024'],
        capabilities: {
            image_input: true,
            style_index: true,
            style_ref_url: true,
            n: true // 输出图像数量 (1张)
        }
    },
    {
        id: 'image-out-painting',
        name: '图像画面扩展 (OutPainting)',
        provider: '阿里通义实验室',
        description: '图像画面扩展（扩图）模型，支持按宽高比扩图、按比例扩图、在上下左右四个方向添加像素扩图等多种扩展方式',
        category: MODEL_CATEGORIES.IMAGE_EDITING,
        protocol: PROTOCOLS.ASYNC_T2I,
        endpoint: '/services/aigc/image2image/out-painting',
        requestFormat: 'outPainting',
        outputType: OUTPUT_TYPES.IMAGE,
        defaultRes: '1024*1024',
        resolutions: ['1024*1024'],
        capabilities: {
            image_input: true,
            angle: true,
            output_ratio: true,
            x_scale: true,
            y_scale: true,
            top_offset: true,
            bottom_offset: true,
            left_offset: true,
            right_offset: true,
            best_quality: true,
            limit_image_size: true,
            add_watermark: true
        }
    },
    {
        id: 'shoemodel-v1',
        name: '鞋靴模特 (Virtual Shoe Model)',
        provider: '阿里通义实验室',
        description: '鞋靴模特模型支持输入多视角鞋靴系列图片，对输入模特模板图的鞋子区域进行鞋靴AI试穿，实现模特鞋靴布局重绘生成',
        category: MODEL_CATEGORIES.SPECIAL_EFFECT,
        protocol: PROTOCOLS.ASYNC_T2I,
        endpoint: '/services/aigc/virtualmodel/generation/',
        requestFormat: 'virtualModel',
        outputType: OUTPUT_TYPES.IMAGE,
        defaultRes: '1024*1024',
        resolutions: ['1024*1024'],
        capabilities: {
            template_image: true,
            shoe_images: true,
            scale: true,
            n: true
        }
    },
    {
        id: 'wanx-background-generation-v2',
        name: '图像背景生成 (Background Generation)',
        provider: '阿里通义实验室',
        description: '通义万相-图像背景生成模型为主体商品生成背景图，适用于电商和海报场景。支持多种引导方式：文本、图像、图文结合、边缘元素引导等。',
        category: MODEL_CATEGORIES.SPECIAL_EFFECT,
        protocol: PROTOCOLS.ASYNC_T2I,
        endpoint: '/services/aigc/background-generation/generation/',
        requestFormat: 'backgroundGeneration',
        outputType: OUTPUT_TYPES.IMAGE,
        defaultRes: '1024*1024',
        resolutions: ['1024*1024'],
        capabilities: {
            base_image_required: true,
            ref_image_support: true,
            ref_prompt_support: true,
            neg_ref_prompt: true,
            n: true,
            model_version: true,
            noise_level: true,
            ref_prompt_weight: true,
            reference_edge: true
        }
    },
    {
        id: 'aitryon',
        name: 'AI试衣-基础版',
        provider: '阿里通义实验室',
        description: 'AI试衣基础版模型，快速生成试衣效果图，适用于对速度要求高的场景',
        category: MODEL_CATEGORIES.SPECIAL_EFFECT,
        protocol: PROTOCOLS.ASYNC_T2I,
        endpoint: '/services/aigc/image2image/image-synthesis',
        requestFormat: 'aiTryon',
        outputType: OUTPUT_TYPES.IMAGE,
        defaultRes: '1024*1024',
        resolutions: ['1024*1024'],
        capabilities: {
            person_image_required: true,
            garment_image_support: true,
            top_garment_support: true,
            bottom_garment_support: true,
            resolution_control: true,
            restore_face: true,
            pricing: '0.20元/张'
        }
    },
    {
        id: 'aitryon-plus',
        name: 'AI试衣-Plus版',
        provider: '阿里通义实验室',
        description: 'AI试衣Plus版模型，提升清晰度、纹理细节、Logo还原效果，适用于质量优先的场景',
        category: MODEL_CATEGORIES.SPECIAL_EFFECT,
        protocol: PROTOCOLS.ASYNC_T2I,
        endpoint: '/services/aigc/image2image/image-synthesis',
        requestFormat: 'aiTryon',
        outputType: OUTPUT_TYPES.IMAGE,
        defaultRes: '1024*1024',
        resolutions: ['1024*1024'],
        capabilities: {
            person_image_required: true,
            garment_image_support: true,
            top_garment_support: true,
            bottom_garment_support: true,
            resolution_control: true,
            restore_face: true,
            enhanced_quality: true,
            improved_texture: true,
            logo_preservation: true,
            pricing: '0.50元/张'
        }
    },
    {
        id: 'wordart-semantic',
        name: '创意文字-文字变形',
        provider: '阿里通义实验室',
        description: '文字轮廓语义变形，支持通过自然语言提示词实现文字边缘智能变形、艺术纹理与材质融合',
        category: MODEL_CATEGORIES.CREATIVE,
        protocol: PROTOCOLS.ASYNC_T2I,
        endpoint: '/services/aigc/wordart/semantic',
        requestFormat: 'wordartSemantic',
        outputType: OUTPUT_TYPES.IMAGE,
        defaultRes: '1024*1024',
        resolutions: ['1024*1024', '1280*720', '720*1280'],
        capabilities: {
            text_input: true,
            prompt_required: true,
            font_selection: true,
            custom_font_support: true,
            output_format_png: true,
            output_format_svg: true,
            batch_generation: true,
            steps_control: true,
            pricing: '0.04元/张'
        }
    },
    {
        id: 'wordart-texture',
        name: '创意文字-文字纹理',
        provider: '阿里通义实验室',
        description: '为文字添加立体材质、光影、场景融合等艺术效果，支持自定义风格、预设风格和风格参考图',
        category: MODEL_CATEGORIES.CREATIVE,
        protocol: PROTOCOLS.ASYNC_T2I,
        endpoint: '/services/aigc/wordart/texture',
        requestFormat: 'wordartTexture',
        outputType: OUTPUT_TYPES.IMAGE,
        defaultRes: '1024*1024',
        resolutions: ['1024*1024', '1280*720', '720*1280'],
        capabilities: {
            text_input: true,
            image_input: true,
            prompt_required: true,
            texture_style_material: true,
            texture_style_scene: true,
            texture_style_lighting: true,
            preset_styles: true,
            reference_image: true,
            font_selection: true,
            alpha_channel: true,
            batch_generation: true,
            image_short_size: true,
            pricing: '0.04元/张'
        }
    }
];

// Digital Human Models Configuration
export const DIGITAL_HUMAN_MODELS = [
    {
        id: 'wan2.2-s2v-detect',
        name: '数字人-图像检测',
        provider: '阿里通义实验室',
        description: '数字人wan2.2-s2v-detect模型，用于检测输入图片是否符合wan2.2-s2v模型的输入规范，检查输入图像是否满足要求（如清晰度、单人、正面）',
        protocol: PROTOCOLS.ASYNC_S2V,
        endpoint: '/services/aigc/digitalhuman/image-detection',
        requestFormat: 'digitalHumanDetect',
        defaultRes: '1024*1024',
        resolutions: ['1024*1024'],
        capabilities: {
            image_validation: true,
            face_detection: true,
            quality_check: true,
            humanoid_check: true
        }
    },
    {
        id: 'wan2.2-s2v',
        name: '数字人-语音驱动视频',
        provider: '阿里通义实验室',
        description: '数字人wan2.2-s2v模型支持基于单张图片和音频，生成动作自然的说话、唱歌或表演视频，不限制形象画幅，支持肖像、全身或半身的人物图像',
        protocol: PROTOCOLS.ASYNC_S2V,
        endpoint: '/services/aigc/digitalhuman/speech-driven-video',
        requestFormat: 'digitalHumanS2V',
        outputType: OUTPUT_TYPES.VIDEO,
        defaultRes: '480P',
        resolutions: ['480P', '720P'],
        capabilities: {
            audio_driven: true,
            speech_sync: true,
            facial_expression: true,
            lip_sync: true,
            motion_animation: true,
            style_speech: true,
            style_singing: true,
            style_performance: true
        }
    },
    {
        id: 'wan2.2-animate-mix',
        name: '视频换人',
        provider: '阿里通义实验室',
        description: '通义万相-视频换人模型能够依据人物图片和参考视频，将视频中的主角替换为图片中的角色，同时保留原视频的场景、光照和色调，实现无缝换人',
        protocol: PROTOCOLS.ASYNC_I2V,
        endpoint: '/services/aigc/image2video/video-synthesis',
        requestFormat: 'videoCharacterSwap',
        outputType: OUTPUT_TYPES.VIDEO,
        defaultRes: '480P',
        resolutions: ['480P', '720P'],
        capabilities: {
            image_input: true,
            video_input: true,
            character_swap: true,
            scene_preservation: true,
            lighting_preservation: true,
            tone_preservation: true,
            mode_selection: true,
            wan_std: true,
            wan_pro: true
        }
    },
    {
        id: 'wan2.2-animate-move',
        name: '图生动作',
        provider: '阿里通义实验室',
        description: '通义万相-图生动作模型，可基于人物图片和参考视频，生成人物动作视频。将视频角色的动作/表情迁移到图片角色中，赋予图片角色动态表现力',
        protocol: PROTOCOLS.ASYNC_I2V,
        endpoint: '/services/aigc/image2video/video-synthesis',
        requestFormat: 'imageMotionTransfer',
        outputType: OUTPUT_TYPES.VIDEO,
        defaultRes: '480P',
        resolutions: ['480P', '720P'],
        capabilities: {
            image_input: true,
            video_input: true,
            motion_transfer: true,
            expression_transfer: true,
            action_replication: true,
            mode_selection: true,
            wan_std: true,
            wan_pro: true
        }
    },
    {
        id: 'emoji-v1',
        name: '表情包视频生成',
        provider: '阿里通义实验室',
        description: '表情包视频生成模型基于一张人物肖像或半身头像，结合预设动态模板，生成具有丰富表情的视频',
        protocol: PROTOCOLS.ASYNC_I2V,
        endpoint: '/services/aigc/image2video/video-synthesis',
        requestFormat: 'emojiVideo',
        outputType: OUTPUT_TYPES.VIDEO,
        defaultRes: '480P',
        resolutions: ['480P', '720P'],
        capabilities: {
            image_input: true,
            face_detection: true,
            expression_templates: true,
            driven_id_selection: true,
            face_bbox_required: true,
            ext_bbox_required: true,
            templates: [
                'mengwa_kaixin', 'dagong_zhuakuang', 'mengwa_dengyan', 'dagong_wunai',
                'mengwa_gandong', 'dagong_weixiao', 'mengwa_jidong', 'jingdian_tiaopi',
                'mengwa_kun_1', 'jingdian_deyi_1', 'mengwa_jiaoxie', 'jingdian_qidai',
                'dagong_kaixin', 'jingdian_landuo_1', 'dagong_yangwang', 'jingdian_xianqi',
                'dagong_kunhuo', 'jingdian_lei', 'mengwa_renzhen_1', 'dagong_ganji',
                'mengwa_kun_1', 'dagong_kaixin', 'jingdian_xianqi', 'mengwa_kaixin'
            ]
        }
    }
];

// Image Translation Models Configuration
export const IMAGE_TRANSLATION_MODELS = [
    {
        id: 'qwen-mt-image',
        name: '通义千问-图像翻译',
        provider: '阿里通义实验室',
        description: '通义千问图像翻译模型，可精准翻译图像中的文字，并保留原始排版',
        protocol: PROTOCOLS.ASYNC_T2I,
        endpoint: '/services/aigc/image2image/image-synthesis',
        requestFormat: 'imageTranslation',
        outputType: OUTPUT_TYPES.IMAGE,
        defaultRes: '1024*1024',
        resolutions: ['1024*1024'],
        capabilities: {
            source_lang: true,
            target_lang: true,
            image_segment: true,
            domain_hint: true,
            sensitives: true,
            terminologies: true
        }
    }
];

// Combined models array for lookup
// 注意顺序：KF2V_MODELS 必须在 VIDEO_EFFECT_MODELS 之前，
// 因为 wanx2.1-kf2v-plus 同时存在于两个数组中，
// KF2V 场景需要使用 keyframeToVideo 格式
const ALL_MODELS = [
    ...VIDEO_MODELS,
    ...I2V_MODELS,
    ...KF2V_MODELS,           // 必须在 VIDEO_EFFECT_MODELS 之前
    ...VIDEO_EFFECT_MODELS,
    ...R2V_MODELS,
    ...VACE_PLUS_MODELS,
    ...IMAGE_MODELS,
    ...DIGITAL_HUMAN_MODELS,
    ...IMAGE_TRANSLATION_MODELS
];

// Art Styles Configuration for Image Generation
export const STYLES = [
    { value: '<auto>', label: '智能匹配 (Auto)' },
    { value: '3d-render', label: '3D 渲染 (3D Render)' },
    { value: 'anime', label: '动漫 (Anime)' },
    { value: 'oil-painting', label: '油画 (Oil Painting)' },
    { value: 'watercolor', label: '水彩 (Watercolor)' },
    { value: 'sketch', label: '素描 (Sketch)' },
    { value: 'photography', label: '摄影 (Photography)' },
    { value: 'digital-art', label: '数字艺术 (Digital Art)' },
    { value: 'fantasy-art', label: '奇幻艺术 (Fantasy Art)' },
    { value: 'pixel-art', label: '像素艺术 (Pixel Art)' },
    { value: 'steampunk', label: '蒸汽朋克 (Steampunk)' },
    { value: 'cyberpunk', label: '赛博朋克 (Cyberpunk)' },
    { value: 'art-nouveau', label: '新艺术主义 (Art Nouveau)' },
    { value: 'impressionism', label: '印象派 (Impressionism)' },
    { value: 'surrealism', label: '超现实主义 (Surrealism)' }
];

// Video Effect Templates Configuration
export const VIDEO_EFFECT_TEMPLATES = {
    // General Effects (通用特效)
    general: [
        { value: 'squish', label: '解压捏捏 (Squish)' },
        { value: 'rotation', label: '转圈圈 (Rotation)' },
        { value: 'poke', label: '戳戳乐 (Poke)' },
        { value: 'inflate', label: '气球膨胀 (Inflate)' },
        { value: 'dissolve', label: '分子扩散 (Dissolve)' },
        { value: 'melt', label: '热浪融化 (Melt)' },
        { value: 'icecream', label: '冰淇淋星球 (Icecream)' },
    ],
    // Single Person Effects (单人特效)
    single: [
        { value: 'carousel', label: '时光木马 (Carousel)' },
        { value: 'singleheart', label: '爱你哟 (Single Heart)' },
        { value: 'dance1', label: '摇摆时刻 (Dance 1)' },
        { value: 'dance2', label: '头号甩舞 (Dance 2)' },
        { value: 'dance3', label: '星摇时刻 (Dance 3)' },
        { value: 'dance4', label: '指感节奏 (Dance 4)' },
        { value: 'dance5', label: '舞动开关 (Dance 5)' },
        { value: 'mermaid', label: '人鱼觉醒 (Mermaid)' },
        { value: 'graduation', label: '学术加冕 (Graduation)' },
        { value: 'dragon', label: '巨兽追袭 (Dragon)' },
        { value: 'money', label: '财从天降 (Money)' },
        { value: 'jellyfish', label: '水母之约 (Jellyfish)' },
        { value: 'pupil', label: '瞳孔穿越 (Pupil)' }
    ],
    // Single Person or Animal Effects (单人或动物特效)
    singleAnimal: [
        { value: 'flying', label: '魔法悬浮 (Flying)' },
        { value: 'rose', label: '赠人玫瑰 (Rose)' },
        { value: 'crystalrose', label: '闪亮玫瑰 (Crystal Rose)' }
    ],
    // Two Person Effects (双人特效)
    couple: [
        { value: 'hug', label: '爱的抱抱 (Hug)' },
        { value: 'frenchkiss', label: '唇齿相依 (French Kiss)' },
        { value: 'coupleheart', label: '双倍心动 (Couple Heart)' }
    ],
    // Person Transformation Effects (人物变装特效)
    kf2v: [
        { value: 'hanfu-1', label: '唐韵翩然 (汉服)' },
        { value: 'solaron', label: '机甲变身 (Solaron)' },
        { value: 'magazine', label: '闪耀封面 (杂志)' },
        { value: 'mech1', label: '机械觉醒 (Mech 1)' },
        { value: 'mech2', label: '赛博登场 (Mech 2)' }
    ]
};

// Model lookup helper
export const getModelById = (id) => ALL_MODELS.find(model => model.id === id);
