'use client';
import React from 'react';
import { Sparkles, LogIn, CheckCircle, Zap, Shield } from 'lucide-react';
import { Button } from './ui/Button';

export const LandingPage = ({ handleLogin, toggleDarkMode, isDarkMode }) => {
    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            {/* Navbar */}
            <nav className="px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-2">
                    <div className="bg-indigo-600 p-2 rounded-lg"><Sparkles className="w-5 h-5 text-white" /></div>
                    <span className="font-bold text-xl text-slate-900 dark:text-white">Gemini Enhancer</span>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={toggleDarkMode}>
                        {isDarkMode ? "Light Mode" : "Dark Mode"}
                    </Button>
                    <Button onClick={handleLogin}>
                        <LogIn className="w-4 h-4" /> Login
                    </Button>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="flex-1 flex items-center justify-center p-6">
                <div className="max-w-3xl w-full text-center space-y-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-medium">
                        <Zap className="w-4 h-4" /> AI-Powered Education
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                        Transform Your Question Banks with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">AI Precision</span>
                    </h1>
                    <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        Upload your JSON question banks and let Google's Gemini AI enhance them with detailed explanations, LaTeX math formatting, and improved clarity instantly.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Button onClick={handleLogin} className="!px-8 !py-4 text-lg w-full sm:w-auto shadow-xl shadow-indigo-200/50 dark:shadow-none">
                            Get Started with Google
                        </Button>
                        <Button variant="outline" className="!px-8 !py-4 text-lg w-full sm:w-auto bg-white dark:bg-slate-900">
                            View Demo
                        </Button>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 text-left">
                        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center mb-4">
                                <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h3 className="font-bold text-slate-900 dark:text-white mb-2">Instant Enhancement</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Automatically generate step-by-step explanations for every question.</p>
                        </div>
                        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center mb-4">
                                <Sparkles className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                            </div>
                            <h3 className="font-bold text-slate-900 dark:text-white mb-2">LaTeX & Math Support</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Perfect rendering for complex mathematical formulas and scientific notation.</p>
                        </div>
                        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                                <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="font-bold text-slate-900 dark:text-white mb-2">Secure Cloud Storage</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Your files are encrypted and stored safely, accessible only by you.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};