import React, { useState } from 'react';
import { Message, Flashcard, Language } from '../types';
import * as GeminiService from '../services/geminiService';
import { BookOpen, Layers, X, Copy, Check, RotateCw, Download, FileText, ChevronLeft, ChevronRight, Loader2, Sparkles, Lightbulb, ThumbsUp, ThumbsDown, HelpCircle, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { t } from '../utils/i18n';

interface StudyToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  topic: string;
  themeColor: string;
  language: Language;
}

const StudyToolsModal: React.FC<StudyToolsModalProps> = ({ isOpen, onClose, messages, topic, themeColor, language }) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'cards'>('guide');
  const [guideContent, setGuideContent] = useState<string>('');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState({ guide: false, cards: false });
  const [copied, setCopied] = useState(false);
  
  // Flashcard State
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);

  if (!isOpen) return null;

  const generateGuide = async () => {
    setLoading(true);
    try {
        const content = await GeminiService.generateStudyGuide(messages, topic, language);
        setGuideContent(content);
        setGenerated(prev => ({ ...prev, guide: true }));
    } catch (e) {
        setGuideContent("Failed to generate guide.");
    } finally {
        setLoading(false);
    }
  };

  const generateCards = async () => {
    setLoading(true);
    try {
        const cards = await GeminiService.generateFlashcards(messages, topic, language);
        setFlashcards(cards);
        setGenerated(prev => ({ ...prev, cards: true }));
        setCurrentCardIndex(0);
        setIsFlipped(false);
        setShowHint(false);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const copyGuide = () => {
    navigator.clipboard.writeText(guideContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadGuide = () => {
    const blob = new Blob([guideContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${topic.replace(/\s+/g, '_')}_study_guide.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const nextCard = () => {
    setIsFlipped(false);
    setShowHint(false);
    setTimeout(() => setCurrentCardIndex(prev => (prev + 1) % flashcards.length), 300);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setShowHint(false);
    setTimeout(() => setCurrentCardIndex(prev => (prev - 1 + flashcards.length) % flashcards.length), 300);
  };

  const handleConfidence = (level: 'hard' | 'good' | 'easy') => {
      // In a real app, this would update SR algorithm.
      // Here, just visual feedback then move next.
      nextCard();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh] animate-slide-up border border-slate-200 dark:border-slate-700">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <BookOpen className={`text-${themeColor}-500`} size={20} />
                {t('studyTools', language)}
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={24} />
            </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800">
            <button 
                onClick={() => setActiveTab('guide')}
                className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors relative ${activeTab === 'guide' ? `text-${themeColor}-600 dark:text-${themeColor}-400` : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
                <FileText size={16} />
                {t('smartGuide', language)}
                {activeTab === 'guide' && <motion.div layoutId="activeTab" className={`absolute bottom-0 left-0 right-0 h-0.5 bg-${themeColor}-500`} />}
            </button>
            <button 
                onClick={() => setActiveTab('cards')}
                className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors relative ${activeTab === 'cards' ? `text-${themeColor}-600 dark:text-${themeColor}-400` : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
                <Layers size={16} />
                {t('flashcardForge', language)}
                {activeTab === 'cards' && <motion.div layoutId="activeTab" className={`absolute bottom-0 left-0 right-0 h-0.5 bg-${themeColor}-500`} />}
            </button>
        </div>

        {/* Content Area - Conditional Overflow */}
        <div className={`flex-1 relative bg-slate-50/50 dark:bg-slate-900/50 p-6 ${activeTab === 'guide' ? 'overflow-hidden' : 'overflow-y-auto custom-scrollbar'}`}>
            
            {/* Guide Tab */}
            {activeTab === 'guide' && (
                <div className="h-full flex flex-col">
                    {!generated.guide ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8">
                            <div className={`w-16 h-16 bg-${themeColor}-100 dark:bg-${themeColor}-900/30 rounded-full flex items-center justify-center mb-6 text-${themeColor}-600 dark:text-${themeColor}-400`}>
                                <FileText size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">{t('createGuide', language)}</h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
                                {t('guideDesc', language)}
                            </p>
                            <button 
                                onClick={generateGuide}
                                disabled={loading}
                                className={`flex items-center gap-2 px-6 py-3 bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white rounded-xl font-semibold shadow-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:scale-100`}
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                                {t('generateGuide', language)}
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-end gap-2 mb-4">
                                <button onClick={copyGuide} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                    {copied ? t('copied', language) : t('copyMarkdown', language)}
                                </button>
                                <button onClick={downloadGuide} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                                    <Download size={14} />
                                    {t('download', language)}
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm">
                                <article className="prose dark:prose-invert prose-slate max-w-none prose-headings:text-slate-800 dark:prose-headings:text-slate-100 prose-p:text-slate-600 dark:prose-p:text-slate-300">
                                    <ReactMarkdown>{guideContent}</ReactMarkdown>
                                </article>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Flashcards Tab */}
            {activeTab === 'cards' && (
                <div className="min-h-full flex flex-col">
                     {!generated.cards ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8">
                            <div className={`w-16 h-16 bg-${themeColor}-100 dark:bg-${themeColor}-900/30 rounded-full flex items-center justify-center mb-6 text-${themeColor}-600 dark:text-${themeColor}-400`}>
                                <Layers size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">{t('forgeFlashcards', language)}</h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
                                {t('flashcardsDesc', language)}
                            </p>
                            <button 
                                onClick={generateCards}
                                disabled={loading}
                                className={`flex items-center gap-2 px-6 py-3 bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white rounded-xl font-semibold shadow-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:scale-100`}
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                                {t('forgeDeck', language)}
                            </button>
                        </div>
                    ) : flashcards.length > 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-8">
                            
                            {/* Progress Bar */}
                            <div className="w-full max-w-xl flex items-center justify-between mb-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                                <span>Card {currentCardIndex + 1} of {flashcards.length}</span>
                                <div className="flex-1 mx-3 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <motion.div 
                                        className={`h-full bg-${themeColor}-500`} 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${((currentCardIndex + 1) / flashcards.length) * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Card Container */}
                            <div className="relative w-full max-w-xl aspect-[1.6/1] perspective-1000 group">
                                <motion.div 
                                    className="w-full h-full relative preserve-3d"
                                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                                    transition={{ duration: 0.5, type: "spring", stiffness: 200, damping: 20 }}
                                >
                                    {/* Front */}
                                    <div 
                                        onClick={() => setIsFlipped(true)}
                                        className="absolute inset-0 backface-hidden bg-white dark:bg-slate-800 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] border border-slate-200 dark:border-slate-700 flex flex-col cursor-pointer overflow-hidden"
                                    >
                                        <div className={`h-1.5 w-full bg-gradient-to-r from-${themeColor}-400 to-${themeColor}-600`} />
                                        <div className="flex-1 p-8 flex flex-col items-center justify-center text-center relative">
                                            <span className="absolute top-6 left-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('question', language)}</span>
                                            
                                            <p className="text-xl md:text-2xl font-medium text-slate-800 dark:text-slate-100 leading-relaxed font-serif">
                                                {flashcards[currentCardIndex].front}
                                            </p>

                                            <AnimatePresence>
                                                {showHint && flashcards[currentCardIndex].hint && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0 }}
                                                        className="mt-6 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-sm rounded-lg border border-amber-100 dark:border-amber-900/30 max-w-sm"
                                                    >
                                                        <span className="font-bold mr-1">{t('hint', language)}:</span> {flashcards[currentCardIndex].hint}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                                            {flashcards[currentCardIndex].hint ? (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setShowHint(!showHint); }}
                                                    className="flex items-center gap-1.5 hover:text-amber-500 transition-colors px-2 py-1 rounded hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                                >
                                                    <Lightbulb size={14} />
                                                    {t('showHint', language)}
                                                </button>
                                            ) : <div />}
                                            
                                            <span className="flex items-center gap-1.5">
                                                <RotateCw size={12} /> {t('clickFlip', language)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Back */}
                                    <div className="absolute inset-0 backface-hidden bg-slate-900 dark:bg-slate-950 rounded-2xl shadow-xl border border-slate-800 dark:border-slate-800 flex flex-col overflow-hidden rotate-y-180">
                                        <div className="flex-1 p-8 flex flex-col items-center justify-center text-center relative">
                                            <span className="absolute top-6 left-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('answer', language)}</span>
                                            
                                            <p className="text-lg md:text-xl font-medium text-slate-100 leading-relaxed font-serif">
                                                {flashcards[currentCardIndex].back}
                                            </p>
                                        </div>

                                        {/* Confidence Ratings */}
                                        <div className="p-4 bg-black/20 border-t border-white/10">
                                            <p className="text-center text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-3">{t('confidence', language)}</p>
                                            <div className="flex justify-center gap-3">
                                                <button 
                                                    onClick={() => handleConfidence('hard')}
                                                    className="flex-1 py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold uppercase transition-all hover:scale-105 active:scale-95"
                                                >
                                                    {t('hard', language)}
                                                </button>
                                                <button 
                                                    onClick={() => handleConfidence('good')}
                                                    className="flex-1 py-2 px-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold uppercase transition-all hover:scale-105 active:scale-95"
                                                >
                                                    {t('good', language)}
                                                </button>
                                                <button 
                                                    onClick={() => handleConfidence('easy')}
                                                    className="flex-1 py-2 px-3 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-xs font-bold uppercase transition-all hover:scale-105 active:scale-95"
                                                >
                                                    {t('easy', language)}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Manual Nav Controls */}
                            <div className="mt-8 flex items-center gap-8 z-10 pb-4">
                                <button 
                                    onClick={prevCard} 
                                    className={`p-4 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-${themeColor}-600 dark:hover:text-${themeColor}-400 hover:scale-110 active:scale-95 transition-all`}
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                
                                <button 
                                    onClick={() => setIsFlipped(!isFlipped)} 
                                    className="px-6 py-2 rounded-full bg-slate-200/50 dark:bg-slate-800/50 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                                >
                                    {isFlipped ? t('question', language) : t('answer', language)}
                                </button>

                                <button 
                                    onClick={nextCard} 
                                    className={`p-4 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-${themeColor}-600 dark:hover:text-${themeColor}-400 hover:scale-110 active:scale-95 transition-all`}
                                >
                                    <ChevronRight size={24} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-500">
                            {t('noCards', language)}
                        </div>
                    )}
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default StudyToolsModal;