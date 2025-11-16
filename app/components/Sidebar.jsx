'use client';
import React from 'react';
import { 
    Sparkles, Loader2, CheckCircle2, 
    AlertCircle, FastForward, X
} from 'lucide-react';

export const Sidebar = ({
    ui, setUi, subjects, filteredList,
    status, data
}) => {
    return (
        <>
            <aside className={`absolute md:relative z-20 h-full w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${ui.isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0 flex justify-between items-center">
                    <select className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" value={ui.subject || ''} onChange={e => setUi(p => ({ ...p, subject: e.target.value || null }))}>
                        <option value="">All Subjects</option>
                        {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                        <button onClick={() => setUi(p => ({...p, isSidebarOpen: false}))} className="md:hidden p-2 ml-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                    {filteredList.map(i => {
                        const st = status[i];
                        const isActive = i === ui.idx;
                        return (
                            <button 
                                key={i} 
                                onClick={() => setUi(p => ({ ...p, idx: i, isSidebarOpen: false }))} 
                                className={`w-full text-left p-3 rounded-xl border transition-all duration-200 group ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-900/50 shadow-sm' : 'bg-white dark:bg-slate-900 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}`}
                                // Optimization: content-visibility skips rendering off-screen items
                                style={{ contentVisibility: 'auto', containIntrinsicSize: '60px' }} 
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`font-semibold text-sm ${isActive ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>Question {i + 1}</span>
                                    {st === 'approved' && <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />}
                                    {st === 'enhanced' && <Sparkles className="w-4 h-4 text-violet-500 dark:text-violet-400" />}
                                    {st === 'batch-enhanced' && <FastForward className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />}
                                    {st === 'enhancing' && <Loader2 className="w-4 h-4 text-indigo-500 dark:text-indigo-400 animate-spin" />}
                                    {st === 'error' && <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400" />}
                                </div>
                                <div className={`text-xs truncate ${isActive ? 'text-indigo-600/70 dark:text-indigo-400/70' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-400'}`}>{data.original[i].topic || data.original[i].subject}</div>
                            </button>
                        );
                    })}
                </div>
            </aside>
            
            {ui.isSidebarOpen && <div className="fixed inset-0 bg-black/20 z-10 md:hidden" onClick={() => setUi(p => ({...p, isSidebarOpen: false}))} />}
        </>
    );
};