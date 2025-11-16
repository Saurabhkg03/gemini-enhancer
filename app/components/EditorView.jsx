'use client';
import React from 'react';
import { 
    Sparkles, Loader2, Check,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from './ui/Button';
import { QuestionCard } from './QuestionCard';

export const EditorView = ({
    ui, setUi, data, status,
    handleApproveOriginal, handleEnhance, handleApprove,
    isKatexLoaded
}) => {
    const currentSt = status[ui.idx];

    return (
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden bg-slate-50/50 dark:bg-slate-950/50 w-full">
            <div className="bg-white dark:bg-slate-900 px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center flex-shrink-0 flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    <button onClick={() => setUi(p => ({ ...p, idx: Math.max(0, p.idx - 1) }))} disabled={ui.idx === 0} className="p-1.5 sm:p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md disabled:opacity-50 transition-all shadow-sm dark:shadow-none disabled:shadow-none"><ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" /></button>
                    <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 px-2 sm:px-3"> {ui.idx + 1} / {data.original.length}</span>
                    <button onClick={() => setUi(p => ({ ...p, idx: Math.min(data.original.length - 1, p.idx + 1) }))} disabled={ui.idx === data.original.length - 1} className="p-1.5 sm:p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md disabled:opacity-50 transition-all shadow-sm dark:shadow-none disabled:shadow-none"><ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" /></button>
                </div>
                <div className="flex gap-2 sm:gap-3 flex-wrap">
                        <Button onClick={handleApproveOriginal} variant="outline" className="text-xs sm:text-sm !px-2 sm:!px-4">
                        Original
                    </Button>
                    <Button onClick={handleEnhance} disabled={currentSt === 'enhancing' || ui.isBatchRunning} variant={currentSt === 'enhanced' || currentSt === 'approved' || currentSt === 'batch-enhanced' ? 'outline' : 'primary'} className="text-xs sm:text-sm !px-2 sm:!px-4">
                        {currentSt === 'enhancing' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        <span className="hidden sm:inline">{currentSt === 'enhanced' || currentSt === 'approved' || currentSt === 'batch-enhanced' ? 'Re-Enhance' : 'Auto-Enhance'}</span>
                    </Button>
                    <Button onClick={handleApprove} disabled={currentSt !== 'enhanced' && currentSt !== 'approved' && currentSt !== 'batch-enhanced'} variant="success" className="text-xs sm:text-sm !px-2 sm:!px-4">
                        <Check className="w-4 h-4" /> <span className="hidden sm:inline">{currentSt === 'approved' ? 'Approved' : 'Approve'}</span>
                    </Button>
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="h-full min-h-[400px] lg:min-h-0">
                    <QuestionCard question={data.original[ui.idx]} title="Original Version" isKatexLoaded={isKatexLoaded} />
                </div>
                <div className={`flex flex-col h-full min-h-[400px] lg:min-h-0 transition-all duration-500 ${currentSt === 'enhancing' ? 'opacity-50 scale-[0.98] blur-[1px]' : 'opacity-100 scale-100'}`}>
                    <QuestionCard question={data.enhanced[ui.idx]} title="AI Enhanced Version" type="enhanced" isKatexLoaded={isKatexLoaded} />
                </div>
            </div>
        </main>
    );
};