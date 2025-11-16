'use client';
import React from 'react';
import { 
    Loader2, UploadCloud, X, Cog, Trash2, File, FileText, LogIn, LogOut
} from 'lucide-react';
import { Button } from './ui/Button';

export const SettingsModal = ({ 
    isOpen, onClose, files, onUpload, onDelete, onLoad, isUploading, 
    userId, activeFileId, handleLogin, handleLogout, isCheckingFiles 
}) => {
    if (!isOpen) return null;

    const renderContent = () => {
        if (isCheckingFiles) {
            return (
                <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-xl text-sm flex items-center justify-center gap-2 border border-amber-100 dark:border-amber-900/30">
                    <Loader2 className="w-4 h-4 animate-spin" /> Connecting...
                </div>
            );
        }

        if (!userId) {
            return (
                <div className="text-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Log in to save your question banks to the cloud and access them from anywhere.
                    </p>
                    <Button variant="primary" onClick={handleLogin} className="w-full">
                        <LogIn className="w-4 h-4" />
                        <span>Login with Google</span>
                    </Button>
                </div>
            );
        }

        return (
            <>
                <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex justify-between items-center">
                        Saved Question Banks
                        {files.length > 0 && <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400">{files.length}</span>}
                    </h4>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                        {files.length === 0 ? (
                            <div className="text-sm text-slate-500 dark:text-slate-400 italic p-6 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-2">
                                <File className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                                <p>No files saved yet.</p>
                            </div>
                        ) : (
                            files.map(file => (
                                <div key={file.id} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${file.id === activeFileId ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-900/50' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'} group`}>
                                    {/* ... existing file mapping code ... */}
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`p-2 rounded-lg border shrink-0 ${file.id === activeFileId ? 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-200 dark:border-indigo-800' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'}`}>
                                            <FileText className={`w-4 h-4 ${file.id === activeFileId ? 'text-indigo-700 dark:text-indigo-300' : 'text-indigo-600 dark:text-indigo-400'}`} />
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className={`text-sm font-medium truncate ${file.id === activeFileId ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`} title={file.name}>{file.name}</p>
                                            <p className={`text-xs ${file.id === activeFileId ? 'text-indigo-400 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                                {new Date(file.updated_at).toLocaleDateString()}
                                                {file.id === activeFileId && <span className="ml-2 font-semibold text-indigo-600 dark:text-indigo-400">— Active</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                            {file.id !== activeFileId && (
                                            <Button variant="primary" onClick={() => onLoad(file)} className="!py-1.5 !px-3 text-xs">Load</Button>
                                            )}
                                        <button onClick={() => onDelete(file.id)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Delete file">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Upload New</h4>
                    <label className={`flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all cursor-pointer group ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        <input type="file" accept=".json" onChange={onUpload} className="hidden" disabled={!userId || isUploading} />
                        {isUploading ? (
                            <div className="flex flex-col items-center gap-2 text-indigo-600 dark:text-indigo-400">
                                <Loader2 className="w-8 h-8 animate-spin" />
                                <span className="font-medium">Uploading...</span>
                            </div>
                        ) : (
                            <>
                                <UploadCloud className="w-8 h-8 text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 mb-2 transition-colors" />
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">Click to Select JSON File</span>
                            </>
                        )}
                    </label>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
                    <Button variant="outline" onClick={handleLogout} className="w-full">
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                    </Button>
                </div>
            </>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Cog className="w-5 h-5 text-slate-600 dark:text-slate-400" /> Settings
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    </button>
                </div>
                <div className="p-6 space-y-6">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};