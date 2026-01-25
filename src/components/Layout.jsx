import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu, Settings } from 'lucide-react';

const Layout = ({ children, activeMenu, onSelectMenu, apiKeyLastChars, onOpenSettings }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex h-screen bg-[#f8f9fa] overflow-hidden font-sans text-gray-900">

            {/* Desktop Sidebar */}
            <div className="hidden lg:block w-64 h-full shrink-0 shadow-sm z-30 border-r border-gray-100 bg-white">
                <Sidebar activeMenu={activeMenu} onSelectMenu={onSelectMenu} />
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
                    <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-2xl h-full">
                        <Sidebar
                            activeMenu={activeMenu}
                            onSelectMenu={(menu) => {
                                onSelectMenu(menu);
                                setIsMobileMenuOpen(false);
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative">

                {/* Top Bar (Mobile Toggle + Settings) */}
                <div className="h-16 shrink-0 flex items-center justify-between px-6 bg-white border-b border-gray-100 z-20 shadow-sm">
                    <div className="flex items-center gap-3">
                        <button
                            className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <Menu size={20} />
                        </button>
                        {/* Breadcrumbs or Title could be dynamic based on activeMenu if passed as prop */}
                        <span className="text-sm font-bold text-gray-500 hidden sm:block">
                            创意工作台
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* API Key Status */}
                        <button
                            onClick={onOpenSettings}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${apiKeyLastChars
                                    ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                                    : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 animate-pulse'
                                }`}
                        >
                            {apiKeyLastChars ? (
                                <>
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                    Key: ...{apiKeyLastChars}
                                </>
                            ) : (
                                <>
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                    配置 API Key
                                </>
                            )}
                        </button>

                        <button
                            onClick={onOpenSettings}
                            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <Settings size={20} />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-200">
                    <div className="max-w-7xl mx-auto pb-10">
                        {children}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Layout;
