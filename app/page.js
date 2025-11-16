'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { UploadScreen } from './components/UploadScreen';
import { AppHeader } from './components/AppHeader';
import { Sidebar } from './components/Sidebar';
import { EditorView } from './components/EditorView';

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

    // --- NEW AUTH FUNCTIONS ---
    const handleLogin = async () => {
        if (!supabase) return;
        try {
            await supabase.auth.signInWithOAuth({
                provider: 'google',
            });
        } catch (error) {
            console.error("Error during Google sign-in:", error);
        }
    };

    const handleLogout = async () => {
        if (!supabase) return;
        try {
            await supabase.auth.signOut();
            // Clear all local state on logout
            setData({ original: null, enhanced: null });
            setStatus({});
            setFiles([]);
            setHistory([]);
            setHistoryIndex(-1);
            setActiveFileId(null);
            setUserId(null);
        } catch (error) {
            console.error("Error during sign-out:", error);
        }
    };

    // Auth & Initial Load
    useEffect(() => {
        console.log("Auth useEffect: Running."); 
        setUi(prev => ({ ...prev, isClient: true }));
        const storedKey = localStorage.getItem("gemini_api_key");
        if (storedKey) setApiKey(storedKey);

        if (!supabase) {
             console.warn("Auth useEffect: Supabase client not found."); 
             setUi(prev => ({ ...prev, isCheckingFiles: false }));
             return;
        }
        console.log("Auth useEffect: Supabase client found."); 

        // Check for existing session on load
        const checkSession = async () => {
            console.log("checkSession: Starting..."); 
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                console.log("checkSession: getSession result", { session, error }); 
                if (error) throw error;
                if (session) {
                    console.log("checkSession: Session found, user:", session.user.id); 
                    setUserId(session.user.id);
                    await fetchAndAutoLoad(session.user.id);
                } else {
                    console.log("checkSession: No session found."); 
                    console.log("Setting isCheckingFiles: false (no session)"); 
                    setUi(prev => ({ ...prev, isCheckingFiles: false }));
                }
            } catch (error) {
                console.error("Error checking session:", error);
                console.log("Setting isCheckingFiles: false (session error)"); 
                setUi(prev => ({ ...prev, isCheckingFiles: false }));
            }
        };

        checkSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
             console.log("onAuthStateChange: Event triggered:", event); 
             if (event === 'SIGNED_IN' && session) {
                 console.log("onAuthStateChange: SIGNED_IN, fetching data."); 
                 setUserId(session.user.id);
                 await fetchAndAutoLoad(session.user.id);
             } else if (event === 'SIGNED_OUT') {
                 // Clear state if user signs out in another tab
                 console.log("onAuthStateChange: SIGNED_OUT, clearing state."); 
                 setData({ original: null, enhanced: null });
                 setStatus({});
                 setFiles([]);
                 setHistory([]);
                 setHistoryIndex(-1);
                 setActiveFileId(null);
                 setUserId(null);
             }
        });
        return () => subscription.unsubscribe();
    }, []);

    const fetchAndAutoLoad = async (uid) => {
        console.log(`fetchAndAutoLoad: Starting for user ${uid}`); 
        if (!supabase || !uid) {
             console.warn("fetchAndAutoLoad: Aborting, no supabase client or user ID."); 
             console.log("Setting isCheckingFiles: false (fetchAndAutoLoad abort)"); 
             setUi(prev => ({ ...prev, isCheckingFiles: false }));
             return;
        }
        try {
            const { data: fileList, error } = await supabase
                .from('question_banks')
                .select('id, name, updated_at, original_data, enhanced_data, status')
                .eq('user_id', uid)
                .order('updated_at', { ascending: false });

            console.log("fetchAndAutoLoad: Query result", { fileList, error }); 
            if (error) throw error;
            setFiles(fileList);

            if (fileList.length > 0) {
                console.log("Auto-loading most recent file:", fileList[0].name);
                loadFileData(fileList[0]);
            }
        } catch (e) {
            console.error("Error fetching files:", e);
        } finally {
             console.log("fetchAndAutoLoad: Reached finally block."); 
             console.log("Setting isCheckingFiles: false (fetchAndAutoLoad finally)"); 
             setUi(prev => ({ ...prev, isCheckingFiles: false }));
        }
    };

    const fetchFiles = async (uid) => {
         if (!supabase || !uid) return;
        try {
             const { data: fileList } = await supabase
                .from('question_banks')
                .select('id, name, updated_at') // Only fetch metadata for list
                .eq('user_id', uid)
                .order('updated_at', { ascending: false });
            if (fileList) setFiles(prev => fileList.map(f => ({...prev.find(p => p.id === f.id), ...f})));
        } catch (e) { console.error("Error fetching files:", e); }
    };

    // Save current progress to Supabase
    const saveProgress = useCallback(async (fileId, currentData, currentStatus) => {
        if (!supabase || !userId || !fileId) return;
        try {
             await supabase
                .from('question_banks')
                .update({
                    enhanced_data: currentData.enhanced,
                    status: currentStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', fileId);
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
            // Handle Supabase's automatic JSON parsing, no need for JSON.parse if it's already an object
            const original = typeof fileDoc.original_data === 'string' ? JSON.parse(fileDoc.original_data) : fileDoc.original_data;
            const enhanced = typeof fileDoc.enhanced_data === 'string' ? JSON.parse(fileDoc.enhanced_data) : fileDoc.enhanced_data;
            const loadedStatus = typeof fileDoc.status === 'string' ? JSON.parse(fileDoc.status) : fileDoc.status;

            if (!Array.isArray(original) || original.length === 0) throw new Error("Invalid file data");

            setData({ original, enhanced });
            setStatus(loadedStatus || original.reduce((acc, _, i) => ({ ...acc, [i]: 'pending' }), {}));
            setHistory([{ data: { original, enhanced }, status: loadedStatus }]);
            setHistoryIndex(0);
            setActiveFileId(fileDoc.id);
            setUi(prev => ({ ...prev, idx: 0, showSettings: false }));
        } catch (e) {
            console.error("Load failed:", e);
            alert("Failed to load file data: " + e.message);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !userId || !supabase) return;
        setUi(prev => ({ ...prev, isUploading: true }));
        try {
            const text = await file.text();
            if (!text || text.trim().length === 0) throw new Error("File is empty");
            const json = JSON.parse(text);

             if (!Array.isArray(json)) throw new Error("Root must be an array");
            
             const newDoc = {
                user_id: userId,
                name: file.name,
                original_data: json,
                enhanced_data: json,
                status: json.reduce((acc, _, i) => ({ ...acc, [i]: 'pending' }), {})
            };

            const { data: insertedData, error } = await supabase
                .from('question_banks')
                .insert(newDoc)
                .select()
                .single();

            if (error) throw error;

            loadFileData(insertedData);
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
        if (!userId || !supabase || !confirm("Are you sure you want to delete this file?")) return;
        try {
            await supabase.from('question_banks').delete().eq('id', fileId);
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
            const json = JSON.parse(text);
             if (!Array.isArray(json) || json.length === 0) throw new Error("Invalid JSON");
             const initialData = { original: json, enhanced: JSON.parse(JSON.stringify(json)) };
             const initialStatus = json.reduce((acc, _, i) => ({ ...acc, [i]: 'pending' }), {});
             setData(initialData);
             setStatus(initialStatus);
             setHistory([{ data: initialData, status: initialStatus }]);
             setHistoryIndex(0);
             setActiveFileId(null);
             setUi(prev => ({ ...prev, idx: 0 }));
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
            <UploadScreen
                apiKey={apiKey}
                setApiKey={setApiKey}
                toggleDarkMode={toggleDarkMode}
                isDarkMode={isDarkMode}
                setUi={setUi}
                files={files}
                handleLocalFileLoad={handleLocalFileLoad}
                ui={ui}
                // Auth props
                userId={userId}
                handleLogin={handleLogin}
                handleLogout={handleLogout}
                isCheckingFiles={ui.isCheckingFiles}
                // SettingsModal props
                handleFileUpload={handleFileUpload}
                handleFileDelete={handleFileDelete}
                loadFileData={loadFileData}
                supabase={supabase}
                activeFileId={activeFileId}
            />
        );
    }

    return (
        <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
            {ui.isBatchRunning && (
                <div className="h-1 w-full bg-indigo-100 dark:bg-indigo-900 sticky top-0 z-50">
                    <div className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-300 ease-out" style={{ width: `${(ui.batchProgress.current / ui.batchProgress.total) * 100}%` }} />
                </div>
            )}

            <AppHeader
                ui={ui}
                setUi={setUi}
                activeFileId={activeFileId}
                files={files}
                stats={stats}
                handleBatchEnhance={handleBatchEnhance}
                handleBatchApprove={handleBatchApprove}
                apiKey={apiKey}
                handleUndo={handleUndo}
                historyIndex={historyIndex}
                handleRedo={handleRedo}
                history={history}
                toggleDarkMode={toggleDarkMode}
                isDarkMode={isDarkMode}
                downloadJSON={downloadJSON}
                handleLogout={handleLogout}
            />

            <div className="flex-1 flex overflow-hidden relative">
                <Sidebar
                    ui={ui}
                    setUi={setUi}
                    subjects={subjects}
                    filteredList={filteredList}
                    status={status}
                    data={data}
                />

                <EditorView
                    ui={ui}
                    setUi={setUi}
                    data={data}
                    status={status}
                    handleApproveOriginal={handleApproveOriginal}
                    handleEnhance={handleEnhance}
                    handleApprove={handleApprove}
                    isKatexLoaded={isKatexLoaded}
                />
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
                onLoad={(file) => {
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
                // Auth props
                handleLogin={handleLogin}
                handleLogout={handleLogout}
                isCheckingFiles={ui.isCheckingFiles}
            />
        </div>
    );
}