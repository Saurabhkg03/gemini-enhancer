'use client';
import React, { useState } from 'react';
import { 
    Sparkles, CheckCircle2, ChevronRight, 
    BookOpen, ChevronDown, FileText, Trash2, Edit2, X, Check, Plus
} from 'lucide-react';
import { LatexText } from './ui/LatexText';

export const QuestionCard = ({ question, title, type = 'original', isKatexLoaded, autoHeight = false, onUpdate }) => {
    const [isOpen, setIsOpen] = useState(true);
    const [editingImageIdx, setEditingImageIdx] = useState(null);
    const [tempUrl, setTempUrl] = useState("");
    const [isAddingImage, setIsAddingImage] = useState(false);

    if (!question || (Object.keys(question).length === 0)) return (
        <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 p-4 text-center">
            No data available
        </div>
    );
    
    const isEnhanced = type === 'enhanced';

    // --- Image Handlers ---

    const handleDeleteImage = (idx) => {
        if (!onUpdate) return;
        const newImages = question.explanation_images.filter((_, i) => i !== idx);
        onUpdate({ ...question, explanation_images: newImages });
    };

    const startEditing = (idx, url) => {
        setEditingImageIdx(idx);
        setTempUrl(url);
        setIsAddingImage(false);
    };

    const saveImageEdit = () => {
        if (!onUpdate) return;
        const newImages = [...(question.explanation_images || [])];
        
        if (isAddingImage) {
            newImages.push({ original_url: tempUrl, local_path: "" });
        } else {
            newImages[editingImageIdx] = { ...newImages[editingImageIdx], original_url: tempUrl };
        }

        onUpdate({ ...question, explanation_images: newImages });
        setEditingImageIdx(null);
        setIsAddingImage(false);
        setTempUrl("");
    };

    const cancelEdit = () => {
        setEditingImageIdx(null);
        setIsAddingImage(false);
        setTempUrl("");
    };

    return (
        <div className={`flex flex-col ${autoHeight ? 'h-auto' : 'h-full min-h-0'} bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none border transition-all duration-300 overflow-hidden ${isEnhanced ? 'border-violet-200 dark:border-violet-900/50 shadow-violet-50 dark:shadow-none' : 'border-slate-200 dark:border-slate-800'}`}>
            <div className={`px-4 sm:px-6 py-3 sm:py-4 border-b flex items-center justify-between flex-shrink-0 ${isEnhanced ? 'bg-violet-50/50 dark:bg-violet-900/20 border-violet-100 dark:border-violet-900/50' : 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'}`}>
                <h3 className={`font-bold flex items-center gap-2 text-sm sm:text-base ${isEnhanced ? 'text-violet-700 dark:text-violet-300' : 'text-slate-700 dark:text-slate-300'}`}>
                    {isEnhanced ? <Sparkles className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    {title}
                </h3>
            </div>
            <div className={`flex-1 ${autoHeight ? '' : 'min-h-0 overflow-y-auto'} p-4 sm:p-6 custom-scrollbar space-y-6`}>
                <div>
                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 sm:mb-3">Question</h4>
                    <LatexText text={question.question_text || question.question_html} images={question.question_images} isKatexLoaded={isKatexLoaded} />
                </div>
                {question.question_type === 'mcq' && question.options && (
                    <div className="space-y-2.5">
                         <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 sm:mb-3">Options</h4>
                        {question.options.map((opt, idx) => (
                            <div key={idx} className={`p-2 sm:p-3 rounded-xl border flex items-start gap-2 sm:gap-3 transition-colors ${opt.is_correct ? 'bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900/50' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
                                <span className={`flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full text-xs sm:text-sm font-bold ${opt.is_correct ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>{opt.label}</span>
                                <div className="flex-1 pt-0.5"><LatexText text={opt.text || opt.text_html} isKatexLoaded={isKatexLoaded} /></div>
                                {opt.is_correct && <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />}
                            </div>
                        ))}
                    </div>
                )}
                <div className={`rounded-xl border overflow-hidden flex-shrink-0 ${isEnhanced ? 'border-violet-200 dark:border-violet-900/30' : 'border-slate-200 dark:border-slate-800'}`}>
                    <button onClick={() => setIsOpen(!isOpen)} className={`w-full flex items-center justify-between p-3 text-sm font-medium transition-colors ${isEnhanced ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/30' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                        <span className="flex items-center gap-2"><BookOpen className="w-4 h-4" /> Explanation</span>
                        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    {isOpen && (
                        <div className={`p-4 ${isEnhanced ? 'bg-violet-50/30 dark:bg-violet-900/10' : 'bg-white dark:bg-slate-900'}`}>
                            <LatexText text={question.explanation_text || question.explanation_html} isKatexLoaded={isKatexLoaded} />
                            
                            {/* --- Enhanced Image Manager --- */}
                            <div className="mt-4">
                                {question.explanation_images?.length > 0 && (
                                    <div className="flex flex-wrap gap-3">
                                        {question.explanation_images.map((img, idx) => (
                                            <div key={idx} className="relative group">
                                                 {editingImageIdx === idx ? (
                                                     <div className="w-64 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg z-10 flex flex-col gap-2">
                                                         <input 
                                                            type="text" 
                                                            value={tempUrl} 
                                                            onChange={(e) => setTempUrl(e.target.value)}
                                                            className="text-xs p-2 border rounded bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-white w-full"
                                                            placeholder="Image URL..."
                                                         />
                                                         <div className="flex gap-2 justify-end">
                                                             <button onClick={cancelEdit} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><X className="w-4 h-4 text-red-500" /></button>
                                                             <button onClick={saveImageEdit} className="p-1 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded"><Check className="w-4 h-4 text-emerald-500" /></button>
                                                         </div>
                                                     </div>
                                                 ) : (
                                                    <>
                                                        <img 
                                                            src={img.original_url || img.local_path} 
                                                            alt="Explanation" 
                                                            className="h-24 sm:h-32 w-auto object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1" 
                                                            onError={(e) => {e.target.src="https://placehold.co/400x300?text=Image+Error"}} 
                                                        />
                                                        {/* Edit Overlay (Only for Enhanced View) */}
                                                        {isEnhanced && onUpdate && (
                                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                                                                <button onClick={() => startEditing(idx, img.original_url)} className="p-1.5 bg-white/90 text-slate-700 rounded-full hover:text-indigo-600 transition-colors" title="Edit Link"><Edit2 className="w-4 h-4" /></button>
                                                                <button onClick={() => handleDeleteImage(idx)} className="p-1.5 bg-white/90 text-slate-700 rounded-full hover:text-red-600 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                                            </div>
                                                        )}
                                                    </>
                                                 )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                {/* Add Image Button */}
                                {isEnhanced && onUpdate && !isAddingImage && (
                                    <button 
                                        onClick={() => { setIsAddingImage(true); setTempUrl(""); }}
                                        className="mt-3 text-xs flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full transition-colors"
                                    >
                                        <Plus className="w-3 h-3" /> Add Image
                                    </button>
                                )}

                                {isAddingImage && (
                                    <div className="mt-3 w-full max-w-md p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex gap-2 items-center">
                                        <input 
                                            type="text" 
                                            value={tempUrl} 
                                            onChange={(e) => setTempUrl(e.target.value)}
                                            className="flex-1 text-sm p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="Paste image URL here..."
                                            autoFocus
                                        />
                                        <button onClick={saveImageEdit} className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"><Check className="w-4 h-4" /></button>
                                        <button onClick={cancelEdit} className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-300"><X className="w-4 h-4" /></button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};