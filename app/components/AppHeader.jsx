'use client';
import React from 'react';
import { 
    Sparkles, Loader2, Download, CheckCheck, 
    RotateCcw, RotateCw, Eye, X, Copy,
    FastForward, Menu, FileText, Cog, Moon, Sun,
    LogOut
} from 'lucide-react';
import { Button } from './ui/Button';

export const AppHeader = ({
    ui, setUi, activeFileId, files, stats,
    handleBatchEnhance, handleBatchApprove, apiKey,
    handleUndo, historyIndex, handleRedo, history,
    toggleDarkMode, isDarkMode, downloadJSON,
    handleLogout
}) => {
    return (
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-10 flex-shrink-0">
            <div className="flex items-center gap-3">
                <button onClick={() => setUi(p => ({...p, isSidebarOpen: !p.isSidebarOpen}))} className="md:hidden p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                    {ui.isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
                <div className="bg-indigo-600 p-2 rounded-lg hidden sm:block"><Sparkles className="w-5 h-5 text-white" /></div>
                <h1 className="font-bold text-lg text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-none">Gemini Enhancer</h1>
                {activeFileId && files.find(f => f.id === activeFileId) && (
                        <div className="hidden md:flex items-center ml-4 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium max-w-[200px] truncate">
                        <FileText className="w-3.5 h-3.5 mr-1.5" />
                        <span className="truncate">{files.find(f => f.id === activeFileId).name}</span>
                        </div>
                )}
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-4 hidden lg:block" />
                <div className="hidden lg:flex gap-2 text-sm font-medium">
                    <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full">{stats.approved} Approved</span>
                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full">{stats.total} Total</span>
                </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 mr-2 sm:mr-4 border-r border-slate-200 dark:border-slate-800 pr-2 sm:pr-4">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400 hidden lg:inline">Batch:</span>
                    <input type="number" min="1" max="50" value={ui.batchSize} onChange={e => setUi(p => ({ ...p, batchSize: parseInt(e.target.value) || 1 }))} className="w-12 sm:w-16 px-2 py-1.5 bg-slate-100 dark:bg-slate-800 border-transparent rounded-lg text-sm focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white" disabled={ui.isBatchRunning} />
                    <Button onClick={handleBatchEnhance} disabled={ui.isBatchRunning || !apiKey} variant="primary" className="!p-2 sm:!py-1.5 sm:!px-3 text-sm" title="Run Batch">
                        {ui.isBatchRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <FastForward className="w-4 h-4" />}
                        <span className="hidden sm:inline">{ui.isBatchRunning ? `${ui.batchProgress.current}/${ui.batchProgress.total}` : 'Run'}</span>
                    </Button>
                    <Button onClick={handleBatchApprove} disabled={stats.enhanced === 0} variant="success" className="!p-2 sm:!py-1.5 sm:!px-3 text-sm" title="Batch Approve All Enhanced">
                        <CheckCheck className="w-4 h-4" />
                        <span className="hidden sm:inline">Approve All</span>
                    </Button>
                </div>

                <div className="flex items-center gap-1 mr-2 border-r border-slate-200 dark:border-slate-800 pr-3 hidden sm:flex">
                    <button onClick={handleUndo} disabled={historyIndex <= 0} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50" title="Undo"><RotateCcw className="w-4 h-4" /></button>
                    <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50" title="Redo"><RotateCw className="w-4 h-4" /></button>
                </div>
                
                <button onClick={toggleDarkMode} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Toggle Theme">
                    {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                <button onClick={() => setUi(p => ({...p, showSettings: true}))} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Settings">
                    <Cog className="w-5 h-5" />
                </button>
                <button onClick={handleLogout} className="p-2 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800 rounded-lg transition-colors" title="Logout">
                    <LogOut className="w-5 h-5" />
                </button>
                <Button variant="ghost" onClick={() => setUi(p => ({...p, showJson: true}))} title="View JSON" className="!p-2"><Eye className="w-5 h-5" /></Button>
                <Button variant="outline" onClick={downloadJSON} className="hidden sm:flex"><Download className="w-4 h-4" /><span className="hidden sm:inline ml-2">Export</span></Button>
            </div>
        </header>
    );
};