'use client';
import React from 'react';
import { 
    UploadCloud, FileText, ChevronRight, 
    Loader2, Cog, LogOut, Sun, Moon, Sparkles,
    Download, Trash2
} from 'lucide-react';
import { Button } from './ui/Button';
import { SettingsModal } from './SettingsModal';

export const Dashboard = ({
    apiKey, setApiKey, toggleDarkMode, isDarkMode, setUi,
    files, ui,
    // Auth props
    userId, handleLogout, isCheckingFiles,
    // SettingsModal props
    handleFileUpload, handleFileDelete, loadFileData, activeFileId,
    handleFileDownload // New prop
}) => {
    return (
        <>
            <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
                {/* Dashboard Header */}
                <header className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center sticky top-0 z-10">
                     <div className="flex items-center gap-3">
                        <div className="bg-indigo-600 p-2 rounded-lg"><Sparkles className="w-5 h-5 text-white" /></div>
                        <h1 className="font-bold text-xl text-slate-900 dark:text-white">Dashboard</h1>
                    </div>
                    <div className="flex items-center gap-3">
                         <button onClick={toggleDarkMode} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Toggle Theme">
                            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
                        <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                            <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 max-w-5xl w-full mx-auto p-6 sm:p-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Left Col: Welcome & Key */}
                        <div className="md:col-span-1 space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Welcome back!</h2>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your question banks and API settings here.</p>
                            </div>
                            
                            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Gemini API Key</label>
                                <input 
                                    type="password" 
                                    value={apiKey} 
                                    onChange={e => { setApiKey(e.target.value); localStorage.setItem("gemini_api_key", e.target.value); }} 
                                    placeholder="Paste API Key..." 
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                                />
                                <p className="text-xs text-slate-400 mt-2">Required for enhancements.</p>
                            </div>
                        </div>

                        {/* Right Col: Actions */}
                        <div className="md:col-span-2 space-y-6">
                            {/* Recent Files */}
                            {files.length > 0 && (
                                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                                        <h3 className="font-bold text-slate-900 dark:text-white">Recent Files</h3>
                                        <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-full font-medium">{files.length} Files</span>
                                    </div>
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[300px] overflow-y-auto custom-scrollbar">
                                        {files.map(file => (
                                            <div key={file.id} onClick={() => loadFileData(file)} className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer">
                                                <div className="flex items-center gap-4 overflow-hidden">
                                                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2.5 rounded-xl shrink-0">
                                                        <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                                    </div>
                                                    <div className="truncate">
                                                        <p className="font-medium text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{file.name}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">Last edited: {new Date(file.updated_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleFileDownload(file); }}
                                                        className="p-2 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                        title="Download JSON"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleFileDelete(file.id); }}
                                                        className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title="Delete Permanently"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors ml-1" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Upload Box */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-1">
                                <label className={`flex flex-col items-center justify-center p-8 sm:p-12 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all cursor-pointer group ${ui.isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" disabled={ui.isUploading} />
                                    {ui.isUploading ? (
                                        <div className="flex flex-col items-center gap-3 text-indigo-600 dark:text-indigo-400">
                                            <Loader2 className="w-10 h-10 animate-spin" />
                                            <span className="font-medium">Uploading & Processing...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                                                <UploadCloud className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Upload New Question Bank</h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 text-center max-w-xs">Drag & drop your JSON file here or click to browse</p>
                                            <span className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-medium shadow-lg shadow-slate-200 dark:shadow-none group-hover:-translate-y-1 transition-transform">Select File</span>
                                        </>
                                    )}
                                </label>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Reuse Settings Modal for file management if needed, though Dashboard covers most */}
            <SettingsModal 
                isOpen={ui.showSettings} 
                onClose={() => setUi(p => ({...p, showSettings: false}))}
                files={files}
                onUpload={handleFileUpload}
                onDelete={handleFileDelete}
                onLoad={(file) => {
                    if (!file.original_data) {
                            // ... fetch logic
                    } else {
                        loadFileData(file);
                    }
                }}
                isUploading={ui.isUploading}
                userId={userId}
                activeFileId={activeFileId}
                handleLogin={() => {}} // No login needed here
                handleLogout={handleLogout}
                isCheckingFiles={isCheckingFiles}
            />
        </>
    );
};