'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
    Sparkles, Loader2, UploadCloud, Download, CheckCircle2, 
    ChevronLeft, ChevronRight, Check, BookOpen, ChevronDown,
    AlertCircle, FileText, Zap, RotateCcw, RotateCw, Eye, X, Copy,
    FastForward, Menu, CheckCheck, Code, List, Cog, Trash2, Plus, File,
    Moon, Sun
} from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { 
    getFirestore, collection, addDoc, deleteDoc, updateDoc, getDocs, 
    doc, getDoc, query, orderBy, serverTimestamp, limit 
} from 'firebase/firestore';

// --- FIREBASE SETUP ---
const getFirebaseConfig = () => {
    if (typeof __firebase_config !== 'undefined') {
        return JSON.parse(__firebase_config);
    }
    return {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
    };
};

const firebaseConfig = getFirebaseConfig();
const appId = typeof __app_id !== 'undefined' ? __app_id : 'gemini-enhancer';

let app, auth, db;
if (firebaseConfig?.apiKey && typeof window !== 'undefined') {
    try {
        app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        auth = getAuth(app);
        db = getFirestore(app);
    } catch (e) {
        console.error("Firebase initialization failed:", e);
    }
}

// --- PROMPTS ---
const PROMPTS = {
    MULTIMODAL: `You are an expert revision tutor. Provide a CONCISE, clear explanation for the "QUESTION" based on provided images.

Formatting Rules (STRICT):
1. Output MUST be clean HTML. Do NOT use markdown code blocks (\`\`\`).
2. Structure:
   - Use <h3> for short section headers (e.g., <h3>Analysis</h3>).
   - Use <ul> or <ol> for steps and given values.
   - Use <p> for standard text.
3. Math:
   - Block equations: wrap in $$...$$ and place on their own line.
   - Inline math: wrap in $...$.
4. Brevity: Skip lengthy derivations if standard. Focus on key steps to reach the solution.

Final Output Template:
<div class="mtq_explanation-text space-y-3">
  <h3>Key Concept</h3>
  <p>...concise explanation...</p>
  <h3>Solution</h3>
  <ul>
    <li>Step 1: ...</li>
    <li>Step 2: ... $$ formula $$</li>
  </ul>
  <p><b>Final Answer: ...</b></p>
</div>`,

    REPHRASE: `You are an expert technical editor. Rewrite the "ORIGINAL EXPLANATION" to be CONCISE, structured, and professional.

Goals:
1. SHORTEN: Remove redundant words and filler text. Make it punchy.
2. FORMAT: Use HTML (<h3>, <ul>, <p>) to break up wall-of-text paragraphs.
3. MATH: Ensure all math uses strict LaTeX delimiters ($...$ inline, $$...$$ block).

Output ONLY the revised HTML wrapped in <div class="mtq_explanation-text space-y-3">...</div>.`,

    TEXT_GEN: `You are an expert revision tutor. Provide a CONCISE step-by-step solution for the "QUESTION".

Formatting Rules (STRICT):
1. NO markdown blocks. Output raw HTML only.
2. Use <h3> for headers, <ul>/<ol> for steps, <p> for text.
3. Use $$...$$ for block math, $...$ for inline math.
4. Keep it short and direct. Focus on the mathematical steps.

Final Output Template:
<div class="mtq_explanation-text space-y-3">
  <h3>Analysis</h3>
  <p>...</p>
  <h3>Derivation</h3>
  <ol>
     <li>... $$ math $$</li>
     <li>...</li>
  </ol>
  <p><b>Conclusion: ...</b></p>
</div>`
};

// --- UTILITIES ---
const cleanHtmlForPrompt = (html) => html ? html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : "";
const cleanOutputExplanation = (text) => {
    if (!text) return "";
    const match = text.match(/<div class="mtq_explanation-text">[\s\S]*?<\/div>/);
    if (match) return match[0];
    return text.replace(/```html/g, '').replace(/```/g, '').trim();
};
const urlToGenerativePart = async (url) => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch`);
        const blob = await response.blob();
        
        if (blob.type === 'image/svg+xml') {
            console.warn("Skipping unsupported SVG image:", url);
            return null;
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve({ inlineData: { data: reader.result.split(',')[1], mimeType: blob.type } });
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) { console.warn("Image skip:", url); return null; }
};

// --- HOOKS ---
const useKatex = () => {
    const [isLoaded, setIsLoaded] = useState(false);
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (window.renderMathInElement) { setIsLoaded(true); return; }
        
        const loadCSS = href => { 
            if (document.querySelector(`link[href="${href}"]`)) return;
            const link = document.createElement('link'); 
            link.rel = 'stylesheet'; 
            link.href = href; 
            link.crossOrigin = 'anonymous'; 
            document.head.appendChild(link); 
        };
        const loadScript = src => new Promise((res, rej) => { 
            if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
            const script = document.createElement('script'); 
            script.src = src; 
            script.crossOrigin = 'anonymous'; 
            script.onload = res; 
            script.onerror = rej; 
            document.head.appendChild(script); 
        });

        loadCSS("https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css");
        loadScript("https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js")
            .then(() => loadScript("https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"))
            .then(() => setIsLoaded(true))
            .catch(e => console.error("KaTeX failed to load", e));
    }, []);
    return isLoaded;
};

const useDarkMode = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            setIsDarkMode(true);
            document.documentElement.classList.add('dark');
        } else {
            setIsDarkMode(false);
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleDarkMode = () => {
        setIsDarkMode(prev => {
            const newMode = !prev;
            if (newMode) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
            return newMode;
        });
    };

    return { isDarkMode, toggleDarkMode };
};

// --- COMPONENTS ---
const Button = ({ children, variant = 'primary', className = '', disabled, ...props }) => {
    const variants = {
        primary: "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-md shadow-indigo-200/50 dark:shadow-none disabled:shadow-none disabled:from-slate-400 disabled:to-slate-500 dark:disabled:from-slate-600 dark:disabled:to-slate-700",
        success: "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md shadow-emerald-200/50 dark:shadow-none disabled:shadow-none disabled:from-slate-400 disabled:to-slate-500 dark:disabled:from-slate-600 dark:disabled:to-slate-700",
        outline: "border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:border-slate-100 dark:disabled:border-slate-800",
        ghost: "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:hover:bg-transparent",
    };
    return (
        <button 
            disabled={disabled}
            className={`px-3 sm:px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 disabled:pointer-events-none ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

const LatexText = ({ text, images = [], isKatexLoaded }) => {
    const ref = useRef(null);

    useEffect(() => {
        if (!ref.current || !window.renderMathInElement) return;
        
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

const QuestionCard = ({ question, title, type = 'original', isKatexLoaded, autoHeight = false }) => {
    const [isOpen, setIsOpen] = useState(true);
    if (!question || (Object.keys(question).length === 0)) return (
        <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 p-4 text-center">
            No data available
        </div>
    );
    
    const isEnhanced = type === 'enhanced';

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
                            <LatexText text={question.explanation_text || question.explanation_html} images={question.explanation_images} isKatexLoaded={isKatexLoaded} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const JsonViewerModal = ({ isOpen, onClose, data, isKatexLoaded }) => {
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

// --- SETTINGS MODAL ---
const SettingsModal = ({ isOpen, onClose, files, onUpload, onDelete, onLoad, isUploading, userId, activeFileId }) => {
    if (!isOpen) return null;

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
                    <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex justify-between items-center">
                            Saved Question Banks
                            {files.length > 0 && <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400">{files.length}</span>}
                        </h4>
                        {userId ? (
                             <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                                {files.length === 0 ? (
                                    <div className="text-sm text-slate-500 dark:text-slate-400 italic p-6 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-2">
                                        <File className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                                        <p>No files saved yet.</p>
                                    </div>
                                ) : (
                                    files.map(file => (
                                        <div key={file.id} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${file.id === activeFileId ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-900/50' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'} group`}>
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className={`p-2 rounded-lg border shrink-0 ${file.id === activeFileId ? 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-200 dark:border-indigo-800' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'}`}>
                                                    <FileText className={`w-4 h-4 ${file.id === activeFileId ? 'text-indigo-700 dark:text-indigo-300' : 'text-indigo-600 dark:text-indigo-400'}`} />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className={`text-sm font-medium truncate ${file.id === activeFileId ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`} title={file.name}>{file.name}</p>
                                                    <p className={`text-xs ${file.id === activeFileId ? 'text-indigo-400 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                                        {file.updatedAt?.seconds ? new Date(file.updatedAt.seconds * 1000).toLocaleDateString() : 'Just now'}
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
                        ) : (
                             <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-xl text-sm flex items-center justify-center gap-2 border border-amber-100 dark:border-amber-900/30">
                                <Loader2 className="w-4 h-4 animate-spin" /> Connecting...
                             </div>
                        )}
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
                </div>
            </div>
        </div>
    );
};

// --- MAIN APP ---
export default function Home() {
    const [apiKey, setApiKey] = useState("");
    const [data, setData] = useState({ original: null, enhanced: null });
    const [ui, setUi] = useState({ 
        idx: 0, subject: null, loading: false, isClient: false, showJson: false, showSettings: false,
        batchSize: 5, isBatchRunning: false, batchProgress: { current: 0, total: 0 },
        isSidebarOpen: false, isUploading: false, isCheckingFiles: true
    });
    const [status, setStatus] = useState({});
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [userId, setUserId] = useState(null);
    const [files, setFiles] = useState([]);
    const [activeFileId, setActiveFileId] = useState(null);
    const isKatexLoaded = useKatex();
    const { isDarkMode, toggleDarkMode } = useDarkMode();

    // Auth & Initial Load
    useEffect(() => {
        setUi(prev => ({ ...prev, isClient: true }));
        const storedKey = localStorage.getItem("gemini_api_key");
        if (storedKey) setApiKey(storedKey);

        if (!auth) {
             setUi(prev => ({ ...prev, isCheckingFiles: false }));
             return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
                 // Fetch files and then try to auto-load the most recent one
                await fetchAndAutoLoad(user.uid);
            } else {
                try {
                    if (typeof __initial_auth_token !== 'undefined') {
                        await signInWithCustomToken(auth, __initial_auth_token);
                    } else {
                        await signInAnonymously(auth);
                    }
                } catch (e) {
                    console.error("Auth failed:", e);
                    setUi(prev => ({ ...prev, isCheckingFiles: false }));
                }
            }
        });
        return () => unsubscribe();
    }, []);

    const fetchAndAutoLoad = async (uid) => {
        if (!db || !uid) return;
        try {
            const q = query(collection(db, `artifacts/${appId}/users/${uid}/files`), orderBy('updatedAt', 'desc'));
            const snapshot = await getDocs(q);
            const fileList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setFiles(fileList);

            // Auto-load the most recent file if it exists
            if (fileList.length > 0) {
                console.log("Auto-loading most recent file:", fileList[0].name);
                loadFileData(fileList[0]);
            }
        } catch (e) {
            console.error("Error fetching files:", e);
        } finally {
             setUi(prev => ({ ...prev, isCheckingFiles: false }));
        }
    };

    const fetchFiles = async (uid) => {
         if (!db || !uid) return;
        try {
            const q = query(collection(db, `artifacts/${appId}/users/${uid}/files`), orderBy('updatedAt', 'desc'));
            const snapshot = await getDocs(q);
            setFiles(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) { console.error("Error fetching files:", e); }
    };

    // Save current progress to Firestore
    const saveProgress = useCallback(async (fileId, currentData, currentStatus) => {
        if (!db || !userId || !fileId) return;
        try {
            const fileRef = doc(db, `artifacts/${appId}/users/${userId}/files`, fileId);
            await updateDoc(fileRef, {
                enhancedData: JSON.stringify(currentData.enhanced),
                status: currentStatus,
                updatedAt: serverTimestamp()
            });
            // Silently update file list timestamp in background
            fetchFiles(userId); 
        } catch (e) {
            console.error("Auto-save failed:", e);
        }
    }, [userId]);

    const updateDataWithHistory = useCallback((newData, newStatus) => {
        setData(newData);
        setStatus(newStatus);
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push({ data: newData, status: newStatus });
            return newHistory;
        });
        setHistoryIndex(prev => prev + 1);
        
        // Trigger auto-save if working on a saved file
        if (activeFileId) {
            saveProgress(activeFileId, newData, newStatus);
        }
    }, [historyIndex, activeFileId, saveProgress]);

    const handleUndo = useCallback(() => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setData(history[newIndex].data);
            setStatus(history[newIndex].status);
            // Optionally autosave on undo/redo too
             if (activeFileId) saveProgress(activeFileId, history[newIndex].data, history[newIndex].status);
        }
    }, [history, historyIndex, activeFileId, saveProgress]);

    const handleRedo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setData(history[newIndex].data);
            setStatus(history[newIndex].status);
             if (activeFileId) saveProgress(activeFileId, history[newIndex].data, history[newIndex].status);
        }
    }, [history, historyIndex, activeFileId, saveProgress]);

    const loadFileData = (fileDoc) => {
        try {
            // Handle both new robust structure and old simple structure for backward compatibility
            const original = typeof fileDoc.originalData === 'string' ? JSON.parse(fileDoc.originalData) : (fileDoc.data ? JSON.parse(fileDoc.data) : []);
            const enhanced = typeof fileDoc.enhancedData === 'string' ? JSON.parse(fileDoc.enhancedData) : JSON.parse(JSON.stringify(original));
            const loadedStatus = fileDoc.status || original.reduce((acc, _, i) => ({ ...acc, [i]: 'pending' }), {});

            if (!Array.isArray(original) || original.length === 0) throw new Error("Invalid file data");

            setData({ original, enhanced });
            setStatus(loadedStatus);
            setHistory([{ data: { original, enhanced }, status: loadedStatus }]);
            setHistoryIndex(0);
            setActiveFileId(fileDoc.id);
            setUi(prev => ({ ...prev, idx: 0, showSettings: false }));
        } catch (e) {
            console.error("Load failed:", e);
            alert("Failed to load file data: " + e.message);
        }
    };

    // Helper for local file load (temporary, not saved to Firestore yet)
    const loadLocalJson = (json) => {
         if (!Array.isArray(json) || json.length === 0) throw new Error("Invalid JSON");
         const initialData = { original: json, enhanced: JSON.parse(JSON.stringify(json)) };
         const initialStatus = json.reduce((acc, _, i) => ({ ...acc, [i]: 'pending' }), {});
         setData(initialData);
         setStatus(initialStatus);
         setHistory([{ data: initialData, status: initialStatus }]);
         setHistoryIndex(0);
         setActiveFileId(null); // Not saved yet
         setUi(prev => ({ ...prev, idx: 0 }));
    }

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !userId || !db) return;
        setUi(prev => ({ ...prev, isUploading: true }));
        try {
            const text = await file.text();
            if (!text || text.trim().length === 0) throw new Error("File is empty");
            const json = JSON.parse(text); // Validate JSON

             if (!Array.isArray(json)) throw new Error("Root must be an array");
            
            // Create robust document structure
            const newDoc = {
                name: file.name,
                originalData: JSON.stringify(json),
                enhancedData: JSON.stringify(json), // Initially same as original
                status: json.reduce((acc, _, i) => ({ ...acc, [i]: 'pending' }), {}),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, `artifacts/${appId}/users/${userId}/files`), newDoc);
            
            // Immediately load the new file
            loadFileData({ id: docRef.id, ...newDoc });
            await fetchFiles(userId);

        } catch (err) { 
            console.error("Upload error:", err);
            alert("Failed to upload: " + err.message); 
        } finally { 
            setUi(prev => ({ ...prev, isUploading: false })); 
            e.target.value = '';
        }
    };

    const handleFileDelete = async (fileId) => {
        if (!userId || !db || !confirm("Are you sure you want to delete this file?")) return;
        try {
            await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/files`, fileId));
            setFiles(prev => prev.filter(f => f.id !== fileId));
            if (fileId === activeFileId) {
                setData({ original: null, enhanced: null });
                setActiveFileId(null);
            }
        } catch (e) {
            alert("Failed to delete file.");
        }
    };

    const handleLocalFileLoad = async (e) => {
         const file = e.target.files[0];
        if (!file) return;
        setUi(prev => ({ ...prev, loading: true }));
        try {
            const text = await file.text();
            loadLocalJson(JSON.parse(text));
        } catch (err) { 
            alert("Failed to load local file: " + err.message); 
        } finally { 
            setUi(prev => ({ ...prev, loading: false })); 
        }
    }

    const enhanceQuestionAtIndex = async (index, isBatch = false) => {
        if (!apiKey) throw new Error("API Key missing");
        if (!isBatch) setStatus(prev => ({ ...prev, [index]: 'enhancing' }));

        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const q = data.enhanced[index];
            
            const imgUrls = [...new Set([
                ...(q.question_images?.map(i => i.original_url) || []),
                ...(q.question_html?.match(/src=["']([^"']+)["']/g)?.map(s => s.match(/src=["']([^"']+)["']/)[1]) || []),
                ...(q.explanation_images?.map(i => i.original_url) || []),
                ...(q.explanation_html?.match(/src=["']([^"']+)["']/g)?.map(s => s.match(/src=["']([^"']+)["']/)[1]) || [])
            ].filter(Boolean))];

            const imgParts = (await Promise.all(imgUrls.map(urlToGenerativePart))).filter(Boolean);
            const qText = cleanHtmlForPrompt(q.question_html || q.question_text);
            const qAns = q.options?.find(o => o.is_correct)?.label || "N/A";
            const origExpl = q.explanation_html || "";

            let prompt = { sys: PROMPTS.TEXT_GEN, user: `QUESTION: ${qText}\nCORRECT ANSWER: ${qAns}` };
            if (imgParts.length) prompt = { sys: PROMPTS.MULTIMODAL, user: prompt.user };
            else if (origExpl.length > 50) prompt = { sys: PROMPTS.REPHRASE, user: `QUESTION: ${qText}\nCORRECT ANSWER: ${qAns}\nORIGINAL EXPLANATION: ${origExpl}` };

            const result = await model.generateContent([prompt.sys, ...imgParts, prompt.user]);
            const responseText = await result.response.text();
            const cleaned = cleanOutputExplanation(responseText);
            
            if (!cleaned) throw new Error("Gemini returned empty or invalid format");

            return {
                index,
                explanation_html: cleaned,
                explanation_text: cleanHtmlForPrompt(cleaned),
                status: isBatch ? 'batch-enhanced' : 'enhanced'
            };

        } catch (e) {
            console.error(`Enhance error at index ${index}:`, e);
            if (!isBatch) setStatus(prev => ({ ...prev, [index]: 'error' }));
            throw e;
        }
    };

    const handleEnhance = async () => {
        if (!apiKey) return alert("Enter API Key first");
        try {
            const result = await enhanceQuestionAtIndex(ui.idx);
            const newEnhanced = [...data.enhanced];
            newEnhanced[result.index] = { ...newEnhanced[result.index], explanation_html: result.explanation_html, explanation_text: result.explanation_text };
            updateDataWithHistory({ ...data, enhanced: newEnhanced }, { ...status, [result.index]: result.status });
        } catch (e) {
            alert("Enhance failed: " + (e.message || "Unknown error"));
        }
    };

    const handleBatchEnhance = async () => {
        if (!apiKey) return alert("Enter API Key first");
        const startIdx = ui.idx;
        const endIdx = Math.min(startIdx + ui.batchSize, data.original.length);
        const indicesToProcess = [];
        for (let i = startIdx; i < endIdx; i++) {
            if (status[i] === 'pending' || status[i] === 'error') indicesToProcess.push(i);
        }

        if (indicesToProcess.length === 0) return alert("No pending questions to enhance in this range.");

        setUi(p => ({ ...p, isBatchRunning: true, batchProgress: { current: 0, total: indicesToProcess.length } }));

        let completed = 0;
        let currentDataEnhanced = [...data.enhanced];
        let currentStatus = { ...status };

        for (const idx of indicesToProcess) {
            try {
                setUi(p => ({ ...p, idx, batchProgress: { ...p.batchProgress, current: completed + 1 } }));
                setStatus(prev => ({...prev, [idx]: 'enhancing'}));
                const result = await enhanceQuestionAtIndex(idx, true);
                currentDataEnhanced[idx] = { ...currentDataEnhanced[idx], explanation_html: result.explanation_html, explanation_text: result.explanation_text };
                currentStatus[idx] = result.status;
                completed++;
            } catch (e) {
                console.warn(`Batch: failed at ${idx}`, e);
                currentStatus[idx] = 'error';
            }
             setStatus({...currentStatus});
        }
        updateDataWithHistory({ ...data, enhanced: currentDataEnhanced }, currentStatus);
        setUi(p => ({ ...p, isBatchRunning: false, idx: startIdx }));
    };

    const handleBatchApprove = () => {
        const newStatus = { ...status };
        let approvedCount = 0;
        Object.keys(status).forEach(idx => {
            if (status[idx] === 'enhanced' || status[idx] === 'batch-enhanced') {
                newStatus[idx] = 'approved';
                approvedCount++;
            }
        });
        if (approvedCount === 0) {
            alert("No enhanced questions to approve.");
            return;
        }
        updateDataWithHistory(data, newStatus);
    };

    const handleApprove = () => {
        const newStatus = { ...status, [ui.idx]: 'approved' };
        updateDataWithHistory(data, newStatus);
        if (ui.idx < data.original.length - 1) setUi(p => ({ ...p, idx: p.idx + 1 }));
    };

    const handleApproveOriginal = () => {
        const newEnhanced = [...data.enhanced];
        newEnhanced[ui.idx] = { 
            ...newEnhanced[ui.idx], 
            explanation_html: data.original[ui.idx].explanation_html,
            explanation_text: data.original[ui.idx].explanation_text,
            explanation_images: data.original[ui.idx].explanation_images
        };
        const newData = { ...data, enhanced: newEnhanced };
        const newStatus = { ...status, [ui.idx]: 'approved' };
        updateDataWithHistory(newData, newStatus);
        if (ui.idx < data.original.length - 1) setUi(p => ({ ...p, idx: p.idx + 1 }));
    };

    const downloadJSON = () => {
        if (!data.enhanced) return;
        const a = document.createElement('a');
        a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data.enhanced, null, 2));
        a.download = "enhanced_questions.json";
        a.click();
    };

    const stats = useMemo(() => {
        if (!data.original) return { total: 0, approved: 0, enhanced: 0 };
        const s = Object.values(status);
        return { total: data.original.length, approved: s.filter(x => x === 'approved').length, enhanced: s.filter(x => x === 'enhanced' || x === 'batch-enhanced').length };
    }, [data.original, status]);

    const filteredList = useMemo(() => data.original ? data.original.map((q, i) => ({ q, i })).filter(({ q }) => !ui.subject || q.subject === ui.subject).map(({ i }) => i) : [], [data.original, ui.subject]);
    const subjects = useMemo(() => data.original ? [...new Set(data.original.map(q => q.subject).filter(Boolean))].sort() : [], [data.original]);

    if (!ui.isClient) return null;

    if (ui.isCheckingFiles) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="flex flex-col items-center gap-3 text-indigo-600 dark:text-indigo-400">
                    <Loader2 className="w-10 h-10 animate-spin" />
                    <p className="text-sm font-medium dark:text-slate-300">Loading your workspace...</p>
                </div>
            </div>
        );
    }

    if (!data.original) {
        return (
            <>
                <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:from-slate-950 dark:to-indigo-950/30">
                    <div className="max-w-md w-full bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 text-center space-y-6 sm:space-y-8 relative">
                         <button onClick={() => setUi(p => ({...p, showSettings: true}))} className="absolute top-4 right-4 p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors" title="Manage Saved Files">
                            <Cog className="w-5 h-5" />
                        </button>
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
                    onLoad={loadFileData}
                    isUploading={ui.isUploading}
                    userId={userId}
                    activeFileId={activeFileId}
                />
            </>
        );
    }

    const currentSt = status[ui.idx];

    return (
        <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
            {ui.isBatchRunning && (
                <div className="h-1 w-full bg-indigo-100 dark:bg-indigo-900 sticky top-0 z-50">
                    <div className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-300 ease-out" style={{ width: `${(ui.batchProgress.current / ui.batchProgress.total) * 100}%` }} />
                </div>
            )}

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
                    <Button variant="ghost" onClick={() => setUi(p => ({...p, showJson: true}))} title="View JSON" className="!p-2"><Eye className="w-5 h-5" /></Button>
                    <Button variant="outline" onClick={downloadJSON} className="hidden sm:flex"><Download className="w-4 h-4" /><span className="hidden sm:inline ml-2">Export</span></Button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden relative">
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
                                <button key={i} onClick={() => setUi(p => ({ ...p, idx: i, isSidebarOpen: false }))} className={`w-full text-left p-3 rounded-xl border transition-all duration-200 group ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-900/50 shadow-sm' : 'bg-white dark:bg-slate-900 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}`}>
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
            </div>
            
            <JsonViewerModal 
                isOpen={ui.showJson} 
                onClose={() => setUi(p => ({...p, showJson: false}))} 
                data={data.enhanced} 
                isKatexLoaded={isKatexLoaded}
            />
            <SettingsModal 
                isOpen={ui.showSettings} 
                onClose={() => setUi(p => ({...p, showSettings: false}))}
                files={files}
                onUpload={handleFileUpload}
                onDelete={handleFileDelete}
                onLoad={loadFileData}
                isUploading={ui.isUploading}
                userId={userId}
                activeFileId={activeFileId}
            />
        </div>
    );
}