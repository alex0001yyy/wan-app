/**
 * API Configuration Constants
 */

// API Base URL
export const API_BASE_URL = '/api/aliyun';

// Timeout settings (in milliseconds)
export const TIMEOUT = {
    REQUEST: 120000,  // 120 seconds for create task (sync multimodal may take longer)
    POLLING: 30000   // 30 seconds for status polling
};

// Retry settings
export const RETRY = {
    MAX_ATTEMPTS: 2,     // Maximum retry attempts
    INITIAL_DELAY: 1000, // Initial delay between retries (ms)
    BACKOFF_FACTOR: 1.5  // Exponential backoff multiplier
};

// Polling settings
export const POLLING = {
    INTERVAL: 2000,  // Poll every 2 seconds for better responsiveness
    INITIAL_INTERVAL: 1000,  // First few polls use 1 second interval
    MAX_INTERVAL: 5000,  // Max interval for long-running tasks
    STATUS_DONE: ['SUCCEEDED', 'FAILED', 'CANCELED', 'UNKNOWN']
};

// Storage keys
export const STORAGE = {
    TASKS: 'wan_app_tasks_v2',
    API_KEY: 'aliyun_api_key',
    LEGACY_TASKS: 'wan_video_history'
};
