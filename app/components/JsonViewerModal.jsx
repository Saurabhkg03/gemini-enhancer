'use client';
import React, { useState, useEffect } from 'react';
import { Sparkles, FileText, Check, Copy, X, List, Code } from 'lucide-react';
import { Button } from './ui/Button';
import { QuestionCard } from './QuestionCard';

export const JsonViewerModal = ({ isOpen, onClose, data, isKatexLoaded }) => {
    const [copied, setCopied] = useState(false);
    const [viewMode, setViewMode] = useState('visual');

    useEffect(() => {
        if (isOpen) setViewMode('visual');
    }, [isOpen]);

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {viewMode === 'visual' ? <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" /> : <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
                        {viewMode === 'visual' ? 'Visual Preview' : 'Raw JSON'}
                    </h3>
                    <div className="flex items-center gap-3">
                        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                            <button 
                                onClick={() => setViewMode('visual')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'visual' ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            >
                                <List className="w-4 h-4" /> <span className="hidden sm:inline">Visual</span>
                            </button>
                            <button 
                                onClick={() => setViewMode('json')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'json' ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            >
                                <Code className="w-4 h-4" /> <span className="hidden sm:inline">JSON</span>
                            </button>
                        </div>

                        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

                        <Button variant="outline" onClick={handleCopy} className="!py-1.5 !px-3 text-sm hidden sm:flex">
                            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copied!' : 'Copy'}
                        </Button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                        </button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-hidden bg-slate-50 dark:bg-slate-950">
                    {viewMode === 'json' ? (
                         <div className="h-full overflow-auto p-6 custom-scrollbar">
                            <pre className="text-sm font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-all bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                {JSON.stringify(data, null, 2)}
                            </pre>
                        </div>
                    ) : (
                        <div className="h-full overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-6">
                            {data && data.length > 0 ? (
                                data.map((item, index) => (
                                    <div key={index} className="mb-6 last:mb-0">
                                        <div className="flex items-center gap-2 mb-2 px-2">
                                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">#{index + 1}</span>
                                            {item.subject && <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full">{item.subject}</span>}
                                        </div>
                                        <QuestionCard 
                                            question={item}
                                            title={`Enhanced Question ${index + 1}`}
                                            type="enhanced"
                                            isKatexLoaded={isKatexLoaded}
                                            autoHeight={true}
                                        />
                                    </div>
                                ))
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-600">
                                    No data to preview
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};