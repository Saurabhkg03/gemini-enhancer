'use client';
import React, { useState, useRef, useEffect } from 'react';
import { 
    Sparkles, Loader2, Download, CheckCheck, 
    RotateCcw, RotateCw, Eye, X, Copy,
    FastForward, Menu, FileText, Cog, Moon, Sun,
    LogOut, Cloud, CloudUpload, ArrowLeft, MoreVertical
} from 'lucide-react';
import { Button } from './ui/Button';

export const AppHeader = ({
    ui, setUi, activeFileId, files, stats,
    handleBatchEnhance, handleBatchApprove, apiKey,
    handleUndo, historyIndex, handleRedo, history,
    toggleDarkMode, isDarkMode, downloadJSON,
    handleLogout, handleBackToDashboard
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-30 flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <button onClick={() => setUi(p => ({...p, isSidebarOpen: !p.isSidebarOpen}))} className="lg:hidden p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex-shrink-0">
                    {ui.isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

                {/* Back Button - Only show if file is active */}
                {activeFileId && (
                    <button onClick={handleBackToDashboard} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg mr-1 flex-shrink-0" title="Back to Dashboard">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                )}

                {!activeFileId && <div className="bg-indigo-600 p-2 rounded-lg hidden sm:block flex-shrink-0"><Sparkles className="w-5 h-5 text-white" /></div>}
                
                <div className="flex flex-col min-w-0">
                    <h1 className={`font-bold text-base sm:text-lg text-slate-900 dark:text-white truncate ${activeFileId ? '' : ''}`}>Gemini Enhancer</h1>
                    {/* Mobile Saved Indicator */}
                    {activeFileId && (
                        <div className="flex items-center gap-2 sm:hidden">
                            {ui.isSaving ? (
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 animate-pulse flex items-center gap-1"><CloudUpload className="w-3 h-3"/> Saving</span>
                            ) : (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><Cloud className="w-3 h-3"/> Saved</span>
                            )}
                        </div>
                    )}
                </div>

                {activeFileId && files.find(f => f.id === activeFileId) && (
                     <div className="hidden xl:flex items-center ml-4 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium max-w-[200px] truncate">
                        <FileText className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                        <span className="truncate">{files.find(f => f.id === activeFileId).name}</span>
                     </div>
                )}
                
                {/* Desktop Saved Indicator */}
                <div className="hidden sm:flex items-center">
                    {ui.isSaving && (
                        <div className="flex items-center gap-2 ml-3 px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium animate-pulse">
                            <CloudUpload className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Saving...</span>
                        </div>
                    )}
                    {!ui.isSaving && activeFileId && (
                        <div className="hidden sm:flex items-center gap-1 ml-3 px-2 py-1 text-emerald-600 dark:text-emerald-500 text-xs font-medium">
                            <Cloud className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Saved</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
                {/* Workflow Actions - Always visible or adaptive */}
                <div className="flex items-center gap-1 sm:gap-2 mr-1 sm:mr-2 pr-2 sm:border-r border-slate-200 dark:border-slate-800">
                    {/* Batch Controls - Hide on very small screens if needed */}
                    <div className="hidden md:flex items-center gap-2 mr-2">
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Batch:</span>
                        <input type="number" min="1" max="50" value={ui.batchSize} onChange={e => setUi(p => ({ ...p, batchSize: parseInt(e.target.value) || 1 }))} className="w-12 px-2 py-1 bg-slate-100 dark:bg-slate-800 border-transparent rounded-md text-xs focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white" disabled={ui.isBatchRunning} />
                        <Button onClick={handleBatchEnhance} disabled={ui.isBatchRunning || !apiKey} variant="primary" className="!p-1.5 !px-2 text-xs h-8" title="Run Batch">
                            {ui.isBatchRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FastForward className="w-3.5 h-3.5" />}
                        </Button>
                        <Button onClick={handleBatchApprove} disabled={stats.enhanced === 0} variant="success" className="!p-1.5 !px-2 text-xs h-8" title="Approve All">
                            <CheckCheck className="w-3.5 h-3.5" />
                        </Button>
                    </div>

                    {/* Undo/Redo - Essential workflow */}
                    <div className="flex items-center gap-1">
                        <button onClick={handleUndo} disabled={historyIndex <= 0} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-30" title="Undo"><RotateCcw className="w-4 h-4" /></button>
                        <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-30" title="Redo"><RotateCw className="w-4 h-4" /></button>
                    </div>
                </div>

                <Button variant="ghost" onClick={() => setUi(p => ({...p, showJson: true}))} title="View JSON" className="!p-2 hidden sm:flex"><Eye className="w-5 h-5" /></Button>

                {/* Menu Dropdown */}
                <div className="relative" ref={menuRef}>
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={`p-2 rounded-lg transition-colors ${isMenuOpen ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                        <MoreVertical className="w-5 h-5" />
                    </button>

                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden origin-top-right animate-in fade-in zoom-in-95 duration-100">
                            <div className="p-2 border-b border-slate-100 dark:border-slate-800 sm:hidden">
                                <p className="px-2 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">Batch Actions</p>
                                <div className="flex items-center gap-2 px-2 pb-2">
                                     <input type="number" min="1" max="50" value={ui.batchSize} onChange={e => setUi(p => ({ ...p, batchSize: parseInt(e.target.value) || 1 }))} className="w-12 px-2 py-1 bg-slate-50 dark:bg-slate-800 border rounded text-xs" disabled={ui.isBatchRunning} />
                                     <Button onClick={handleBatchEnhance} disabled={ui.isBatchRunning || !apiKey} variant="primary" className="!p-1.5 flex-1 h-8 text-xs">Run</Button>
                                     <Button onClick={handleBatchApprove} disabled={stats.enhanced === 0} variant="success" className="!p-1.5 flex-1 h-8 text-xs">Approve</Button>
                                </div>
                            </div>

                            <div className="p-1">
                                <button onClick={() => { setUi(p => ({...p, showJson: true})); setIsMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg sm:hidden">
                                    <Eye className="w-4 h-4" /> View JSON
                                </button>
                                <button onClick={() => { downloadJSON(); setIsMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">
                                    <Download className="w-4 h-4" /> Export JSON
                                </button>
                                <button onClick={() => { setUi(p => ({...p, showSettings: true})); setIsMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">
                                    <Cog className="w-4 h-4" /> Settings
                                </button>
                                <button onClick={() => { toggleDarkMode(); setIsMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">
                                    {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />} {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                                </button>
                            </div>
                            <div className="border-t border-slate-100 dark:border-slate-800 p-1">
                                <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                                    <LogOut className="w-4 h-4" /> Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};