import React, { useState } from 'react';
import { FeedbackReport } from '../types';
import { Star, CheckCircle, AlertCircle, RefreshCcw, ExternalLink, BookOpen, Share2, Copy, Check } from 'lucide-react';

interface FeedbackModalProps {
  report: FeedbackReport | null;
  onRestart: () => void;
  isOpen: boolean;
  themeColor: string;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ report, onRestart, isOpen, themeColor }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !report) return null;

  const handleShare = () => {
    const text = `I just taught Queryling about "${report.summary.split('.')[0]}..." and scored ${report.score}/5! #Queryling #FeynmanTechnique`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md animate-fade-in transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[85vh] transition-colors duration-300">
        
        {/* Header */}
        <div className={`bg-gradient-to-r from-${themeColor}-600 to-${themeColor}-700 dark:from-${themeColor}-900 dark:to-${themeColor}-950 p-8 text-white text-center flex-shrink-0 relative overflow-hidden transition-colors duration-300`}>
            <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <h2 className="text-3xl font-bold mb-2 serif relative z-10">Session Report Card</h2>
            <div className="flex justify-center gap-2 my-4 relative z-10">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                        key={star} 
                        size={32} 
                        className={`filter drop-shadow-md transition-all duration-500 ${star <= report.score ? "fill-amber-400 text-amber-400 scale-110" : "text-white/20 scale-100"}`} 
                    />
                ))}
            </div>
            <p className="opacity-90 font-medium relative z-10">Queryling's understanding of your teaching</p>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
            {/* Summary */}
            <div className="mb-10 text-center px-4">
                <p className="text-slate-700 dark:text-slate-300 italic text-xl leading-relaxed font-light">"{report.summary}"</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                {/* Strengths */}
                <div className="bg-green-50/50 dark:bg-green-900/10 p-6 rounded-2xl border border-green-100 dark:border-green-900/20 transition-colors duration-300">
                    <h3 className="flex items-center gap-2 text-green-800 dark:text-green-400 font-bold mb-5 uppercase tracking-wide text-sm">
                        <CheckCircle size={18} />
                        Strong Points
                    </h3>
                    <ul className="space-y-4">
                        {report.strengths.map((s, i) => (
                            <li key={i} className="flex gap-3 text-slate-800 dark:text-slate-300">
                                <span className="bg-white dark:bg-slate-800 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-sm">{i+1}</span>
                                <span className="text-sm font-medium">{s}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Improvements with Links */}
                <div className="bg-amber-50/50 dark:bg-amber-900/10 p-6 rounded-2xl border border-amber-100 dark:border-amber-900/20 transition-colors duration-300">
                    <h3 className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold mb-5 uppercase tracking-wide text-sm">
                        <AlertCircle size={18} />
                        Recommended Study
                    </h3>
                    <ul className="space-y-4">
                        {report.improvements.map((imp, i) => (
                            <li key={i} className="flex gap-3 text-slate-800 dark:text-slate-300 flex-col sm:flex-row sm:items-start">
                                <div className="flex gap-3">
                                    <span className="bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-sm">{i+1}</span>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium mb-1.5">{imp.text}</p>
                                        {imp.url && (
                                            <a 
                                                href={imp.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className={`inline-flex items-center gap-1.5 text-xs text-${themeColor}-600 dark:text-${themeColor}-400 hover:text-${themeColor}-800 dark:hover:text-${themeColor}-300 font-semibold bg-white dark:bg-slate-800 px-2 py-1 rounded border border-${themeColor}-100 dark:border-slate-700 hover:border-${themeColor}-300 dark:hover:border-slate-500 transition-colors shadow-sm`}
                                            >
                                                <BookOpen size={12} />
                                                {imp.sourceTitle || "Learn more"}
                                                <ExternalLink size={10} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-center gap-4 flex-shrink-0 transition-colors duration-300">
            <button 
                onClick={handleShare}
                className={`flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-6 py-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition font-semibold text-sm tracking-wide`}
            >
                {copied ? <Check size={18} className="text-green-500" /> : <Share2 size={18} />}
                {copied ? "Copied!" : "Share Result"}
            </button>
            <button 
                onClick={onRestart}
                className={`flex items-center gap-2 bg-slate-900 dark:bg-${themeColor}-600 text-white px-8 py-3.5 rounded-xl hover:bg-slate-800 dark:hover:bg-${themeColor}-500 transition shadow-xl hover:shadow-2xl hover:-translate-y-1 transform duration-200 font-semibold text-sm tracking-wide`}
            >
                <RefreshCcw size={18} />
                Start New Session
            </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;