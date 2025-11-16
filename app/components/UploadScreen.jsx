'use client';
import React from 'react';
import { 
    Sparkles, Loader2, UploadCloud, ChevronRight, 
    FileText, Cog, Moon, Sun
} from 'lucide-react';
import { SettingsModal } from './SettingsModal';

export const UploadScreen = ({
    apiKey, setApiKey, toggleDarkMode, isDarkMode, setUi,
    files, handleLocalFileLoad, ui,
    // Auth props
    userId, handleLogin, handleLogout, isCheckingFiles,
    // SettingsModal props
    handleFileUpload, handleFileDelete, loadFileData, supabase, activeFileId
}) => {
    return (
        <>
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:from-slate-950 dark:to-indigo-950/30">
                <div className="max-w-md w-full bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 text-center space-y-6 sm:space-y-8 relative">
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                        <button onClick={toggleDarkMode} className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors" title="Toggle Theme">
                            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                        <button onClick={() => setUi(p => ({...p, showSettings: true}))} className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors" title="Manage Saved Files">
                            <Cog className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="inline-flex p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl mb-2"><Sparkles className="w-12 h-12 text-indigo-600 dark:text-indigo-400" /></div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3">Gemini Enhancer</h1>
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm sm:text-base">Upgrade your educational content with AI-powered explanations.</p>
                    </div>
                    
                    <div className="space-y-4">
                        <input type="password" value={apiKey} onChange={e => { setApiKey(e.target.value); localStorage.setItem("gemini_api_key", e.target.value); }} placeholder="Paste Gemini API Key..." className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm dark:text-white dark:placeholder-slate-500" />
                        
                        {files.length > 0 ? (
                            <div className="space-y-3">
                                <button onClick={() => setUi(p => ({...p, showSettings: true}))} className="w-full p-4 flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-xl text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors font-medium group">
                                    <span className="flex items-center gap-2"><FileText className="w-5 h-5" /> Load from {files.length} saved file{files.length !== 1 ? 's' : ''}</span>
                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <div className="relative flex items-center py-2">
                                    <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                                    <span className="flex-shrink-0 mx-4 text-xs text-slate-400 dark:text-slate-600 font-medium uppercase tracking-wider">OR</span>
                                    <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                                </div>
                            </div>
                        ) : null}
                        
                            <label className={`group flex flex-col items-center justify-center p-6 sm:p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all cursor-pointer ${ui.loading ? 'opacity-50 pointer-events-none' : ''}`}>
                            <input type="file" accept=".json" onChange={handleLocalFileLoad} className="hidden" />
                            {ui.loading ? <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" /> : <><UploadCloud className="w-10 h-10 text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 mb-3 transition-colors" /><span className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">Upload Local JSON File</span></>}
                        </label>
                    </div>
                </div>
            </div>
            <SettingsModal 
                isOpen={ui.showSettings} 
                onClose={() => setUi(p => ({...p, showSettings: false}))}
                files={files}
                onUpload={handleFileUpload}
                onDelete={handleFileDelete}
                onLoad={(file) => {
                    // Ensure we load the full data if it wasn't fetched in the list view
                    if (!file.original_data) {
                            supabase.from('question_banks').select('*').eq('id', file.id).single().then(({ data }) => {
                                if (data) loadFileData(data);
                            });
                    } else {
                        loadFileData(file);
                    }
                }}
                isUploading={ui.isUploading}
                userId={userId}
                activeFileId={activeFileId}
                // Pass auth props down
                handleLogin={handleLogin}
                handleLogout={handleLogout}
                isCheckingFiles={isCheckingFiles}
            />
        </>
    );
};