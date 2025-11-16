'use client';
import React, { useRef, useEffect } from 'react';

export const LatexText = ({ text, images = [], isKatexLoaded }) => {
    const ref = useRef(null);

    useEffect(() => {
        if (typeof window === 'undefined' || !ref.current || !window.renderMathInElement) return;
        
        let processedText = (text || '')
            .replace(/\[latex\]/g, '\\(')
            .replace(/\[\/latex\]/g, '\\)')
            .replace(/\n/g, '<br/>');

        ref.current.innerHTML = processedText;

        if (isKatexLoaded) {
             setTimeout(() => {
                try {
                    window.renderMathInElement(ref.current, {
                        delimiters: [
                            { left: "$$", right: "$$", display: true },
                            { left: "\\[", right: "\\]", display: true },
                            { left: "$", right: "$", display: false },
                            { left: "\\(", right: "\\)", display: false }
                        ],
                        throwOnError: false,
                        trust: true 
                    });
                } catch (e) {
                    console.warn("KaTeX render warning:", e);
                }
             }, 0);
        }
    }, [text, isKatexLoaded]);

    return (
        <div className="space-y-4 w-full">
            <div ref={ref} className="prose prose-slate dark:prose-invert max-w-none prose-p:leading-relaxed prose-headings:font-semibold prose-strong:text-indigo-900 dark:prose-strong:text-indigo-300 text-slate-700 dark:text-slate-300 break-words text-sm sm:text-base" />
            {images?.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                    {images.map((img, idx) => (
                        <img key={idx} src={img.original_url || img.local_path} alt="Figure" className="h-24 sm:h-32 w-auto object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1" onError={(e) => {e.target.src="https://placehold.co/400x300?text=Image+Error"}} />
                    ))}
                </div>
            )}
        </div>
    );
};