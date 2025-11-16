'use client';
import { useState, useEffect } from 'react';

export const useKatex = () => {
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