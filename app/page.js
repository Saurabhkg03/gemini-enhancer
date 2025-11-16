'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Loader2 } from 'lucide-react';

// Libs, Hooks, and Components
import { supabase } from './lib/supabase';
import { 
    PROMPTS, cleanHtmlForPrompt, 
    cleanOutputExplanation, urlToGenerativePart 
} from './lib/gemini';
import { useKatex } from './hooks/useKatex';
import { useDarkMode } from './hooks/useDarkMode';
import { JsonViewerModal } from './components/JsonViewerModal';
import { SettingsModal } from './components/SettingsModal';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { AppHeader } from './components/AppHeader';
import { Sidebar } from './components/Sidebar';
import { EditorView } from './components/EditorView';

// Helper for chunking large arrays
const chunkArray = (array, size) => {
    const chunked = [];
    for (let i = 0; i < array.length; i += size) {
        chunked.push(array.slice(i, i + size));
    }
    return chunked;
};

// --- MAIN APP ---
export default function Home() {
    const [apiKey, setApiKey] = useState("");
    
    // Data State
    const [data, setData] = useState({ original: null, enhanced: null }); 
    const [questionIds, setQuestionIds] = useState([]); // Map index -> DB ID
    
    const [ui, setUi] = useState({ 
        idx: 0, subject: null, loading: false, isClient: false, showJson: false, showSettings: false,
        batchSize: 5, isBatchRunning: false, batchProgress: { current: 0, total: 0 },
        isSidebarOpen: false, isUploading: false, isCheckingFiles: true,
        isSaving: false 
    });
    
    const [status, setStatus] = useState({});
    
    // Optimized History (Stores diffs only)
    const [history, setHistory] = useState([]); 
    const [historyIndex, setHistoryIndex] = useState(-1);

    const [userId, setUserId] = useState(null);
    const [files, setFiles] = useState([]);
    const [activeFileId, setActiveFileId] = useState(null);
    
    // Refs for debouncing
    const saveQueue = useRef(new Set()); // Track which indices need saving
    const saveTimeoutRef = useRef(null);
    
    // Track auth initialization state to prevent duplicate work
    const authInitialized = useRef(false);
    const userIdRef = useRef(null); // Ref to track userId without triggering re-renders in callbacks

    const isKatexLoaded = useKatex();
    const { isDarkMode, toggleDarkMode } = useDarkMode();

    // Keep ref in sync with state
    useEffect(() => {
        userIdRef.current = userId;
    }, [userId]);

    // --- AUTH & SETUP ---
    const handleLogin = async () => {
        if (!supabase) return;
        await supabase.auth.signInWithOAuth({ provider: 'google' });
    };

    const handleLogout = async () => {
        if (ui.isSaving || saveQueue.current.size > 0) {
             await processSaveQueue(); // Flush pending saves
        }
        if (!supabase) return;
        await supabase.auth.signOut();
        resetState();
    };

    const resetState = () => {
        setData({ original: null, enhanced: null });
        setStatus({});
        setQuestionIds([]);
        setFiles([]);
        setHistory([]);
        setHistoryIndex(-1);
        setActiveFileId(null);
        setUserId(null);
        setUi(p => ({ ...p, idx: 0 }));
    };

    const handleBackToDashboard = async () => {
        if (saveQueue.current.size > 0) await processSaveQueue();
        setData({ original: null, enhanced: null });
        setStatus({});
        setQuestionIds([]);
        setHistory([]);
        setHistoryIndex(-1);
        setActiveFileId(null);
        setUi(p => ({ ...p, idx: 0 }));
        if (userId) fetchFiles(userId);
    };

    useEffect(() => {
        setUi(prev => ({ ...prev, isClient: true }));
        const storedKey = localStorage.getItem("gemini_api_key");
        if (storedKey) setApiKey(storedKey);

        if (!supabase) {
             setUi(prev => ({ ...prev, isCheckingFiles: false }));
             return;
        }

        // Safety timeout: If auth hangs for 4s, stop loading anyway to show Landing/Login
        const safetyTimeout = setTimeout(() => {
            if (!authInitialized.current) {
                console.warn("Auth check timed out, forcing UI load");
                setUi(prev => ({ ...prev, isCheckingFiles: false }));
            }
        }, 4000);

        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    setUserId(session.user.id);
                    // Fetch files but don't block completely if it takes too long? 
                    // Actually better to wait for files so dashboard isn't empty.
                    await fetchFiles(session.user.id);
                }
            } catch (error) {
                console.error("Error checking session:", error);
            } finally {
                authInitialized.current = true;
                setUi(prev => ({ ...prev, isCheckingFiles: false }));
                clearTimeout(safetyTimeout);
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
             if (event === 'SIGNED_IN' && session) {
                 // Only act if we detected a USER CHANGE or if it's a fresh sign-in event
                 // that wasn't handled by initAuth
                 setUserId(prevId => {
                    if (prevId !== session.user.id) {
                        // New user or login event: Fetch files in background
                        fetchFiles(session.user.id);
                        return session.user.id;
                    }
                    return prevId;
                 });
                 
                 // Ensure loading is off (in case onAuthStateChange fires before initAuth finishes)
                 if (authInitialized.current) {
                    setUi(prev => ({ ...prev, isCheckingFiles: false }));
                 }

             } else if (event === 'SIGNED_OUT') {
                 resetState();
                 setUi(prev => ({ ...prev, isCheckingFiles: false }));
             }
        });
        return () => {
            subscription.unsubscribe();
            clearTimeout(safetyTimeout);
        };
    }, []);

    // --- DATA FETCHING (Optimized) ---
    const fetchFiles = async (uid) => {
         if (!supabase || !uid) return;
         try {
             const { data: fileList, error } = await supabase
                .from('question_banks')
                .select('id, name, updated_at')
                .eq('user_id', uid)
                .order('updated_at', { ascending: false });
             
             if (!error && fileList) setFiles(fileList);
         } catch (e) { 
             console.error("Error fetching files", e);
         }
    };

    const loadFileData = async (fileDoc) => {
        setUi(prev => ({ ...prev, loading: true }));
        try {
            // Fetch questions from the NEW table
            const { data: questions, error } = await supabase
                .from('questions')
                .select('id, index, original_data, enhanced_data, status')
                .eq('bank_id', fileDoc.id)
                .order('index', { ascending: true });

            if (error) throw error;
            if (!questions || questions.length === 0) throw new Error("No questions found in this bank.");

            // Reconstruct the arrays for the UI
            const original = questions.map(q => q.original_data);
            const enhanced = questions.map(q => q.enhanced_data);
            const statusMap = questions.reduce((acc, q, i) => ({ ...acc, [i]: q.status }), {});
            const ids = questions.map(q => q.id);

            setData({ original, enhanced });
            setStatus(statusMap);
            setQuestionIds(ids);
            
            // Initialize History
            setHistory([]);
            setHistoryIndex(-1);
            
            setActiveFileId(fileDoc.id);
            saveQueue.current.clear(); // Clear any pending saves from previous file
            setUi(prev => ({ ...prev, idx: 0, showSettings: false }));

        } catch (e) {
            console.error("Load failed:", e);
            alert("Failed to load file data. It might be using the old format.");
        } finally {
            setUi(prev => ({ ...prev, loading: false }));
        }
    };

    // --- UPLOAD LOGIC (Batched) ---
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !userId || !supabase) return;
        setUi(prev => ({ ...prev, isUploading: true }));
        
        try {
            const text = await file.text();
            const json = JSON.parse(text);
            if (!Array.isArray(json)) throw new Error("Root must be an array");
             
            // 1. Create Question Bank Header
            const { data: bank, error: bankError } = await supabase
                .from('question_banks')
                .insert({ user_id: userId, name: file.name, status: {} }) 
                .select()
                .single();

            if (bankError) throw bankError;

            // 2. Prepare Rows for Batch Insert
            const rows = json.map((item, i) => ({
                bank_id: bank.id,
                user_id: userId,
                index: i,
                original_data: item,
                enhanced_data: item, // Start identical
                status: 'pending'
            }));

            // 3. Insert in Chunks (to avoid request size limits)
            const chunks = chunkArray(rows, 100); // 100 rows per request
            
            // We can do this in parallel requests for speed
            const uploadPromises = chunks.map(chunk => 
                supabase.from('questions').insert(chunk)
            );
            
            await Promise.all(uploadPromises);

            setFiles(prev => [bank, ...prev]);
            loadFileData(bank); // Load it back to confirm everything is correct

        } catch (err) { 
            console.error("Upload error:", err);
            alert("Failed to upload: " + err.message); 
        } finally { 
            setUi(prev => ({ ...prev, isUploading: false })); 
            e.target.value = '';
        }
    };

    const handleFileDelete = async (fileId) => {
        if (!userId || !supabase || !confirm("Are you sure?")) return;
        try {
            // Cascade delete will handle the questions
            await supabase.from('question_banks').delete().eq('id', fileId);
            setFiles(prev => prev.filter(f => f.id !== fileId));
            if (fileId === activeFileId) handleBackToDashboard();
        } catch (e) { alert("Failed to delete file."); }
    };

    // NEW: Download directly from dashboard
    const handleFileDownload = async (file) => {
        if (!supabase || !userId) return;
        document.body.style.cursor = 'wait';
        try {
             const { data: questions, error } = await supabase
                .from('questions')
                .select('enhanced_data')
                .eq('bank_id', file.id)
                .order('index', { ascending: true });

            if (error) throw error;
            
            // Map to extract just the json object from the column
            const exportData = questions.map(q => q.enhanced_data);
            const a = document.createElement('a');
            a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
            a.download = `${file.name.replace(/\.json$/i, '')}_enhanced.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (e) {
            console.error("Download failed:", e);
            alert("Failed to download file.");
        } finally {
            document.body.style.cursor = 'default';
        }
    };

    // --- ATOMIC SAVING LOGIC (The "Fast as F***" Part) ---

    const processSaveQueue = async () => {
        if (saveQueue.current.size === 0) return;

        const indicesToSave = Array.from(saveQueue.current);
        saveQueue.current.clear(); // Clear immediately to capture new changes during save
        setUi(p => ({ ...p, isSaving: true }));

        try {
            // Create update promises for each changed question
            const updates = indicesToSave.map(idx => {
                const qId = questionIds[idx];
                if (!qId) return null;
                
                return supabase
                    .from('questions')
                    .update({
                        enhanced_data: data.enhanced[idx],
                        status: status[idx]
                    })
                    .eq('id', qId);
            }).filter(Boolean);

            // Run updates in parallel
            await Promise.all(updates);
            
            // Update timestamp on parent bank (fire and forget)
            supabase.from('question_banks').update({ updated_at: new Date() }).eq('id', activeFileId);

        } catch (e) {
            console.error("Save failed:", e);
            // Re-queue failed items? For now, just alert/log
        } finally {
            if (saveQueue.current.size === 0) setUi(p => ({ ...p, isSaving: false }));
        }
    };

    // Debounced Saver
    useEffect(() => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        if (saveQueue.current.size > 0) {
            saveTimeoutRef.current = setTimeout(processSaveQueue, 1000); // Save 1s after last change
        }
        return () => clearTimeout(saveTimeoutRef.current);
    });

    // --- OPTIMIZED HISTORY & UPDATES ---

    const updateDataOptimistic = (idx, newEnhancedItem, newStatus) => {
        // 1. Create Deep Copy of Previous State to break references
        // JSON.parse(JSON.stringify()) is a simple way to deep copy for plain data objects
        const prevEnhanced = JSON.parse(JSON.stringify(data.enhanced[idx]));
        const prevStatus = status[idx];

        // 2. Update React State Instantly
        const newDataEnhanced = [...data.enhanced];
        newDataEnhanced[idx] = newEnhancedItem;
        
        setData(p => ({ ...p, enhanced: newDataEnhanced }));
        setStatus(p => ({ ...p, [idx]: newStatus }));

        // 3. Add to History (Diff only)
        // We store the DEEP COPIED previous state, so it's safe from future mutations
        const newHistoryItem = {
            idx,
            prev: { enhanced: prevEnhanced, status: prevStatus },
            next: { enhanced: newEnhancedItem, status: newStatus }
        };
        
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newHistoryItem);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);

        // 4. Queue for Cloud Save
        saveQueue.current.add(idx);
        setUi(p => ({ ...p, isSaving: true })); // Visual feedback
    };

    const handleUndo = useCallback(() => {
        if (historyIndex < 0) return;
        const item = history[historyIndex];
        
        // Revert State
        const newDataEnhanced = [...data.enhanced];
        // Use the deep-copied previous state
        newDataEnhanced[item.idx] = item.prev.enhanced;
        
        setData(p => ({ ...p, enhanced: newDataEnhanced }));
        setStatus(p => ({ ...p, [item.idx]: item.prev.status }));

        setHistoryIndex(prev => prev - 1);
        
        // Ensure the reverted state is saved to DB
        saveQueue.current.add(item.idx);
        setUi(p => ({ ...p, isSaving: true }));
    }, [history, historyIndex, data]);

    const handleRedo = useCallback(() => {
        if (historyIndex >= history.length - 1) return;
        const item = history[historyIndex + 1];

        // Apply Next State
        const newDataEnhanced = [...data.enhanced];
        newDataEnhanced[item.idx] = item.next.enhanced;
        
        setData(p => ({ ...p, enhanced: newDataEnhanced }));
        setStatus(p => ({ ...p, [item.idx]: item.next.status }));

        setHistoryIndex(prev => prev + 1);
        
        // Ensure the re-applied state is saved to DB
        saveQueue.current.add(item.idx);
        setUi(p => ({ ...p, isSaving: true }));
    }, [history, historyIndex, data]);

    // --- ACTION HANDLERS ---

    // NEW: Handler for direct question updates (from Image editing, etc.)
    const handleQuestionUpdate = (newQuestionData) => {
        // Keep current status (or mark as enhanced/approved if you prefer)
        const currentStatus = status[ui.idx];
        updateDataOptimistic(ui.idx, newQuestionData, currentStatus);
    };

    const handleApprove = () => {
        updateDataOptimistic(ui.idx, data.enhanced[ui.idx], 'approved');
        if (ui.idx < data.original.length - 1) setUi(p => ({ ...p, idx: p.idx + 1 }));
    };

    const handleApproveOriginal = () => {
        const originalItem = data.original[ui.idx];
        // Create a copy of enhanced but with original text/images
        const revertedItem = {
            ...data.enhanced[ui.idx],
            explanation_html: originalItem.explanation_html,
            explanation_text: originalItem.explanation_text,
            explanation_images: originalItem.explanation_images
        };
        updateDataOptimistic(ui.idx, revertedItem, 'approved');
        if (ui.idx < data.original.length - 1) setUi(p => ({ ...p, idx: p.idx + 1 }));
    };

    const handleBatchApprove = () => {
        // Batch approve is complex with atomic rows. 
        // Strategy: Update local state for all, queue all indices.
        const newStatus = { ...status };
        const indices = [];
        
        Object.keys(status).forEach(key => {
            const idx = parseInt(key);
            if (status[idx] === 'enhanced' || status[idx] === 'batch-enhanced') {
                newStatus[idx] = 'approved';
                indices.push(idx);
                saveQueue.current.add(idx);
            }
        });

        if (indices.length === 0) return alert("Nothing to approve.");

        // We don't support full undo for batch yet to keep history simple, or we group them.
        // For now, simple state update.
        setStatus(newStatus);
        setUi(p => ({ ...p, isSaving: true }));
        // Trigger save immediately for batch
        processSaveQueue(); 
    };

    // Gemini Logic
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
            console.error(e);
            if (!isBatch) setStatus(prev => ({ ...prev, [index]: 'error' }));
            throw e;
        }
    };

    const handleEnhance = async () => {
        if (!apiKey) return alert("Enter API Key first");
        try {
            const result = await enhanceQuestionAtIndex(ui.idx);
            const newEnhancedItem = { 
                ...data.enhanced[ui.idx], 
                explanation_html: result.explanation_html, 
                explanation_text: result.explanation_text 
            };
            updateDataOptimistic(ui.idx, newEnhancedItem, result.status);
        } catch (e) { alert("Enhance failed."); }
    };

    const handleBatchEnhance = async () => {
        if (!apiKey) return alert("Enter API Key first");
        const startIdx = ui.idx;
        const endIdx = Math.min(startIdx + ui.batchSize, data.original.length);
        const indices = [];
        for (let i = startIdx; i < endIdx; i++) {
            if (status[i] === 'pending' || status[i] === 'error') indices.push(i);
        }
        if (indices.length === 0) return alert("No pending questions.");

        setUi(p => ({ ...p, isBatchRunning: true, batchProgress: { current: 0, total: indices.length } }));
        
        // Process sequentially or parallel? Parallel is faster but might hit rate limits.
        // Let's do sequential for safety, but update UI optimistically.
        for (const idx of indices) {
            try {
                setUi(p => ({ ...p, idx, batchProgress: { ...p.batchProgress, current: (p.batchProgress.current || 0) + 1 } }));
                setStatus(prev => ({...prev, [idx]: 'enhancing'}));
                
                const result = await enhanceQuestionAtIndex(idx, true);
                const newEnhancedItem = { 
                    ...data.enhanced[idx], 
                    explanation_html: result.explanation_html, 
                    explanation_text: result.explanation_text 
                };
                
                // Directly update state without history for batch to save memory
                setData(prev => {
                    const next = [...prev.enhanced];
                    next[idx] = newEnhancedItem;
                    return { ...prev, enhanced: next };
                });
                setStatus(prev => ({...prev, [idx]: result.status}));
                
                // Queue for save
                saveQueue.current.add(idx);

            } catch (e) { 
                setStatus(prev => ({...prev, [idx]: 'error'}));
            }
        }
        
        setUi(p => ({ ...p, isBatchRunning: false, idx: startIdx }));
        processSaveQueue(); // Save all batch changes
    };

    // DOWNLOAD FUNCTION UPDATED TO DOWNLOAD CURRENT STATE
    const downloadJSON = () => {
        // We use 'data.enhanced' which holds the current, in-memory state of all questions
        // This includes all your recent approvals, edits, and changes.
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
                    <p className="text-sm font-medium dark:text-slate-300">Loading...</p>
                </div>
            </div>
        );
    }

    if (!userId) return <LandingPage handleLogin={handleLogin} toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />;
    if (!data.original) return <Dashboard 
        apiKey={apiKey} setApiKey={setApiKey} toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} 
        setUi={setUi} files={files} ui={ui} userId={userId} handleLogout={handleLogout} 
        isCheckingFiles={ui.isCheckingFiles} handleFileUpload={handleFileUpload} 
        handleFileDelete={handleFileDelete} loadFileData={loadFileData} activeFileId={activeFileId}
        handleFileDownload={handleFileDownload} 
    />;

    return (
        <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
            {ui.isBatchRunning && (
                <div className="h-1 w-full bg-indigo-100 dark:bg-indigo-900 sticky top-0 z-50">
                    <div className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-300 ease-out" style={{ width: `${(ui.batchProgress.current / ui.batchProgress.total) * 100}%` }} />
                </div>
            )}
            <AppHeader ui={ui} setUi={setUi} activeFileId={activeFileId} files={files} stats={stats} handleBatchEnhance={handleBatchEnhance} handleBatchApprove={handleBatchApprove} apiKey={apiKey} handleUndo={handleUndo} historyIndex={historyIndex} handleRedo={handleRedo} history={history} toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} downloadJSON={downloadJSON} handleLogout={handleLogout} handleBackToDashboard={handleBackToDashboard} />
            <div className="flex-1 flex overflow-hidden relative">
                <Sidebar ui={ui} setUi={setUi} subjects={subjects} filteredList={filteredList} status={status} data={data} />
                <EditorView 
                    ui={ui} setUi={setUi} data={data} status={status} 
                    handleApproveOriginal={handleApproveOriginal} 
                    handleEnhance={handleEnhance} handleApprove={handleApprove} 
                    isKatexLoaded={isKatexLoaded}
                    onUpdateQuestion={handleQuestionUpdate} 
                />
            </div>
            <JsonViewerModal isOpen={ui.showJson} onClose={() => setUi(p => ({...p, showJson: false}))} data={data.enhanced} isKatexLoaded={isKatexLoaded} />
            <SettingsModal isOpen={ui.showSettings} onClose={() => setUi(p => ({...p, showSettings: false}))} files={files} onUpload={handleFileUpload} onDelete={handleFileDelete} onLoad={loadFileData} isUploading={ui.isUploading} userId={userId} activeFileId={activeFileId} handleLogin={handleLogin} handleLogout={handleLogout} isCheckingFiles={ui.isCheckingFiles} />
        </div>
    );
}