import React, { useState, useEffect } from 'react';
import { Key, ShieldCheck, X, ExternalLink } from 'lucide-react';

const ApiKeyModal = ({ isOpen, onClose, currentKey, onSave }) => {
    const [key, setKey] = useState('');

    useEffect(() => {
        if (isOpen) {
            setKey(currentKey || '');
        }
    }, [isOpen, currentKey]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(key);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative w-full max-w-lg transform transition-all">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
                    {/* Header */}
                    <div className="px-8 pt-8 pb-6 bg-gradient-to-br from-violet-50 to-purple-50 border-b border-violet-100">
                        <div className="flex items-start justify-between">
                            <div className="flex gap-4">
                                <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg">
                                    <Key className="w-6 h-6 text-white" strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-1">API 配置</h3>
                                    <p className="text-sm text-gray-600">连接到阿里云百炼平台</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-white/50 rounded-xl"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="space-y-3">
                            <label htmlFor="apiKey" className="block text-sm font-semibold text-gray-700">
                                访问密钥 (API Key)
                            </label>
                            <input
                                type="password"
                                id="apiKey"
                                value={key}
                                onChange={(e) => setKey(e.target.value)}
                                placeholder="sk-xxxxxxxxxxxxxxxx"
                                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl 
                         focus:border-violet-400 focus:ring-4 focus:ring-violet-100 focus:bg-white
                         outline-none text-gray-900 placeholder-gray-400 font-mono text-sm
                         transition-all duration-300"
                                autoFocus
                            />
                            <div className="flex items-start gap-3 p-4 bg-violet-50 border border-violet-200 rounded-xl">
                                <ShieldCheck size={18} className="text-violet-600 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-violet-700 leading-relaxed font-medium">
                                    您的密钥仅存储在本地浏览器中，不会上传到任何服务器
                                </p>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!key.trim()}
                            className="w-full h-14 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 
                       text-white font-bold text-lg rounded-2xl shadow-lg shadow-violet-500/30
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
                       transition-all duration-300 flex items-center justify-center gap-3"
                        >
                            <ShieldCheck size={20} />
                            保存配置
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="px-8 py-5 bg-gray-50 border-t border-gray-200">
                        <a
                            href="https://bailian.console.aliyun.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-violet-600 hover:text-violet-700 transition-colors font-semibold inline-flex items-center gap-2"
                        >
                            还没有密钥？前往阿里云控制台获取
                            <ExternalLink size={14} />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApiKeyModal;
