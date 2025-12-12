import React, { useState, useEffect } from 'react';
import { ArrowRight, BrainCircuit, Baby, GraduationCap, Search, Sparkles, Sun, Moon, Settings, X, Globe, UserPlus, Trophy, Calendar, ChevronLeft, PlayCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatStyle, Message, Language, Persona, SessionRecord } from '../types';
import ChatMessage from './ChatMessage'; // Import for preview
import { t, LANGUAGES } from '../utils/i18n';

interface WelcomeScreenProps {
  onStart: (topic: string, persona: Persona, language: Language, customInstruction?: string) => void;
  onResume: (record: SessionRecord) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  themeColor: string;
  setThemeColor: (color: string) => void;
  chatStyle: ChatStyle;
  setChatStyle: (style: ChatStyle) => void;
}

// Rotating Typewriter Component
const RotatingTypewriter: React.FC<{ prefix: string; words: string[] }> = ({ prefix, words }) => {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    setIndex(0);
    setSubIndex(0);
    setReverse(false);
  }, [words]);

  useEffect(() => {
    const timeout2 = setInterval(() => {
      setBlink((prev) => !prev);
    }, 500);
    return () => clearInterval(timeout2);
  }, []);

  useEffect(() => {
    if (!words || words.length === 0 || index >= words.length) return;

    if (subIndex === words[index].length + 1 && !reverse) {
      const timeout = setTimeout(() => {
        setReverse(true);
      }, 1500);
      return () => clearTimeout(timeout);
    }

    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % words.length);
      return;
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, reverse ? 50 : 100);

    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse, words]);

  const currentWord = (words && words[index]) || "";

  return (
    <span>
      {prefix} <span className="font-semibold text-slate-900 dark:text-slate-100">{currentWord.substring(0, subIndex)}</span>
      <span className={`${blink ? 'opacity-100' : 'opacity-0'} font-light ml-0.5`}>|</span>
    </span>
  );
};

const THEME_COLORS = [
  { id: 'indigo', name: 'Indigo', class: 'bg-indigo-500' },
  { id: 'emerald', name: 'Emerald', class: 'bg-emerald-500' },
  { id: 'rose', name: 'Rose', class: 'bg-rose-500' },
  { id: 'amber', name: 'Amber', class: 'bg-amber-500' },
  { id: 'violet', name: 'Violet', class: 'bg-violet-500' },
  { id: 'cyan', name: 'Cyan', class: 'bg-cyan-500' },
];

const CHAT_STYLES: { id: ChatStyle; name: string; description: string }[] = [
  { id: 'standard', name: 'Standard', description: 'Clean and professional.' },
  { id: 'bubble', name: 'Bubble', description: 'Playful rounded bubbles.' },
  { id: 'scifi', name: 'Sci-Fi', description: 'High-tech translucent glass.' },
  { id: 'cyberpunk', name: 'Cyberpunk', description: 'Sharp edges and neon accents.' },
  { id: 'minimal', name: 'Minimal', description: 'Focus purely on the text.' },
];

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ 
    onStart, 
    onResume,
    darkMode, 
    toggleDarkMode, 
    themeColor, 
    setThemeColor,
    chatStyle,
    setChatStyle
}) => {
  const [topic, setTopic] = useState('');
  const [persona, setPersona] = useState<Persona>('student');
  const [customPersonaInstruction, setCustomPersonaInstruction] = useState('');
  const [language, setLanguage] = useState<Language>('en');
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; duration: number; delay: number }[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTrophyRoomOpen, setIsTrophyRoomOpen] = useState(false);
  const [sessionArchive, setSessionArchive] = useState<SessionRecord[]>([]);
  const [activeSession, setActiveSession] = useState<SessionRecord | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<SessionRecord | null>(null);

  useEffect(() => {
    const newParticles = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 2,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 5
    }));
    setParticles(newParticles);
    
    if (typeof window !== 'undefined') {
        try {
            const saved = window.localStorage.getItem('queryling_history');
            if (saved) {
                setSessionArchive(JSON.parse(saved));
            }
            const active = window.localStorage.getItem('queryling_active_session');
            if (active) {
                setActiveSession(JSON.parse(active));
            }
        } catch(e) { console.error("Could not load history"); }
    }
  }, []);

  useEffect(() => {
    if (!isTrophyRoomOpen) {
        setSelectedRecord(null);
    }
  }, [isTrophyRoomOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      onStart(topic, persona, language, customPersonaInstruction);
    }
  };

  const handleResume = (record: SessionRecord) => {
    if (record.messages && record.messages.length > 0) {
        onResume(record);
        setIsTrophyRoomOpen(false);
    } else {
        alert("This session cannot be resumed (no chat history saved).");
    }
  };

  const previewMessage: Message = {
    id: 'preview',
    role: 'model',
    text: "I'm ready to learn! How does this look?",
    type: 'normal'
  };

  const getPreviewBackground = (style: ChatStyle) => {
      switch(style) {
          case 'cyberpunk': return "bg-slate-950 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]";
          case 'scifi': return "bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-900 to-black";
          case 'bubble': return "bg-blue-50/30 dark:bg-slate-900 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px]";
          case 'minimal': return "bg-white dark:bg-black";
          default: return "bg-slate-50 dark:bg-slate-950/50";
      }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        duration: 0.8, 
        staggerChildren: 0.15,
        delayChildren: 0.2
      } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
    visible: { 
      opacity: 1, 
      y: 0, 
      filter: 'blur(0px)',
      transition: { duration: 0.8, ease: [0.2, 0.65, 0.3, 0.9] as [number, number, number, number] } 
    }
  };

  const backgroundBlobVariants = (delay: number) => ({
    animate: {
      scale: [1, 1.2, 0.9, 1.1, 1],
      x: [0, 60, -60, 30, 0],
      y: [0, -40, 40, -20, 0],
      rotate: [0, 20, -20, 10, 0],
      transition: {
        duration: 20,
        delay: delay,
        repeat: Infinity,
        repeatType: "mirror" as const,
        ease: "easeInOut" as const
      }
    }
  });

  return (
    <div className={`relative flex flex-col items-center justify-center min-h-screen overflow-hidden bg-[#fafafa] dark:bg-slate-950 text-slate-800 dark:text-slate-100 selection:bg-${themeColor}-100 dark:selection:bg-${themeColor}-900 selection:text-${themeColor}-900 dark:selection:text-${themeColor}-100 transition-colors duration-500`}>
      <div className="absolute top-6 right-6 z-50 flex gap-3">
          {activeSession && (
              <button 
                  onClick={() => onResume(activeSession)}
                  className={`flex items-center gap-2 px-4 py-2 bg-${themeColor}-600 rounded-full text-white text-xs font-bold animate-pulse shadow-lg hover:scale-105 transition-all`}
              >
                <Clock size={14} /> Resume Active
              </button>
          )}
          <button 
              onClick={() => setIsTrophyRoomOpen(true)}
              className="p-3 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-white/60 dark:border-slate-700 shadow-sm hover:scale-105 transition-all text-slate-600 dark:text-slate-300"
              title="Archive"
          >
              <Trophy size={20} className={sessionArchive.length > 0 ? "text-amber-500" : ""} />
          </button>
          <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-3 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-white/60 dark:border-slate-700 shadow-sm hover:scale-105 transition-all text-slate-600 dark:text-slate-300"
              title={t('appearance', language)}
          >
              <Settings size={20} />
          </button>
          <button 
              onClick={toggleDarkMode}
              className="p-3 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-white/60 dark:border-slate-700 shadow-sm hover:scale-105 transition-all text-slate-600 dark:text-slate-300"
              title={darkMode ? t('lightMode', language) : t('darkMode', language)}
          >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
      </div>

      <AnimatePresence>
        {isTrophyRoomOpen && (
             <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={() => setIsTrophyRoomOpen(false)}
             >
                <motion.div 
                   initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                   className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full h-[80vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700"
                   onClick={e => e.stopPropagation()}
                >
                   <AnimatePresence mode="wait">
                       {!selectedRecord ? (
                           <motion.div key="list" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full">
                               <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                                  <h3 className="text-xl font-bold serif flex items-center gap-2">
                                      <Trophy size={24} className="text-amber-500" />
                                      {t('archiveTitle', language)}
                                  </h3>
                                  <button onClick={() => setIsTrophyRoomOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={24} /></button>
                               </div>
                               <div className="p-6 overflow-y-auto custom-scrollbar">
                                  {sessionArchive.length === 0 ? (
                                      <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                                          <Trophy size={48} className="mx-auto mb-4 opacity-20" />
                                          <p>{t('noSessions', language)}</p>
                                          <p className="text-xs mt-2">{t('finishTrophy', language)}</p>
                                      </div>
                                  ) : (
                                      <div className="space-y-4">
                                          {sessionArchive.slice().reverse().map(record => (
                                              <motion.button 
                                                  key={record.id} onClick={() => setSelectedRecord(record)} layout whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                                  className={`w-full text-left p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 flex flex-col gap-2 hover:shadow-md hover:border-${themeColor}-200 transition-all group`}
                                              >
                                                  <div className="flex justify-between items-start w-full">
                                                      <h4 className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">{record.topic}</h4>
                                                      <div className="flex text-amber-500">
                                                          {[...Array(5)].map((_, i) => (
                                                              <Trophy key={i} size={14} fill={i < record.score ? "currentColor" : "none"} className={i < record.score ? "text-amber-500" : "text-slate-300 dark:text-slate-700"} />
                                                          ))}
                                                      </div>
                                                  </div>
                                                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{record.summary}</p>
                                                  <div className="flex justify-between items-center mt-2 text-[10px] text-slate-400 uppercase font-bold tracking-wider w-full">
                                                      <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(record.date).toLocaleDateString()}</span>
                                                      <span className={`px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300`}>
                                                        {t('persona' + record.persona.charAt(0).toUpperCase() + record.persona.slice(1) + 'Label', language)}
                                                      </span>
                                                  </div>
                                              </motion.button>
                                          ))}
                                      </div>
                                  )}
                               </div>
                           </motion.div>
                       ) : (
                           <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col h-full bg-white dark:bg-slate-900">
                                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50 dark:bg-slate-900">
                                    <button onClick={() => setSelectedRecord(null)} className="p-2 -ml-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"><ChevronLeft size={24} /></button>
                                    <h3 className="text-xl font-bold serif flex-1">{t('sessionDetails', language)}</h3>
                                    <button onClick={() => setIsTrophyRoomOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={24} /></button>
                                </div>
                                <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                         <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{selectedRecord.topic}</h2>
                                         <div className="flex flex-col gap-2">
                                            {selectedRecord.messages && selectedRecord.messages.length > 0 && (
                                                <button onClick={() => handleResume(selectedRecord!)} className={`flex items-center gap-2 px-4 py-2 bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white rounded-xl shadow-md font-semibold text-sm transition-transform active:scale-95`}><PlayCircle size={18} />{t('resumeChat', language)}</button>
                                            )}
                                         </div>
                                    </div>
                                    <div className="flex flex-wrap gap-4 mb-8 text-sm items-center pb-6 border-b border-slate-100 dark:border-slate-800">
                                         <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400"><Calendar size={16} /><span>{new Date(selectedRecord.date).toLocaleDateString()}</span><span className="opacity-50">•</span><span>{new Date(selectedRecord.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
                                         <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 capitalize text-xs font-bold flex items-center shadow-sm">
                                            {selectedRecord.persona === 'custom' ? <UserPlus size={12} className="mr-1.5" /> : selectedRecord.persona === 'child' ? <Baby size={12} className="mr-1.5" /> : selectedRecord.persona === 'student' ? <GraduationCap size={12} className="mr-1.5" /> : <Search size={12} className="mr-1.5" />}
                                            {t('persona' + selectedRecord.persona.charAt(0).toUpperCase() + selectedRecord.persona.slice(1) + 'Label', language)}
                                         </span>
                                         <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/10 px-3 py-1 rounded-full border border-amber-100 dark:border-amber-900/30">
                                            {[...Array(5)].map((_, i) => (<Trophy key={i} size={14} fill={i < selectedRecord!.score ? "currentColor" : "none"} className={i < selectedRecord!.score ? "text-amber-500" : "text-slate-300 dark:text-slate-600"} />))}
                                            <span className="ml-2 text-xs font-bold text-amber-600 dark:text-amber-400">{selectedRecord.score}/5</span>
                                         </div>
                                    </div>
                                    <div className="prose dark:prose-invert max-w-none">
                                        <h4 className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-4">{t('sessionSummary', language)}</h4>
                                        <p className="text-lg leading-relaxed whitespace-pre-wrap">{selectedRecord.summary}</p>
                                    </div>
                                </div>
                           </motion.div>
                       )}
                   </AnimatePresence>
                </motion.div>
             </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsSettingsOpen(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center"><h3 className="text-xl font-bold serif">{t('appearance', language)}</h3><button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={24} /></button></div>
              <div className="p-6 space-y-8">
                <div className={`rounded-2xl p-6 border border-slate-100 dark:border-slate-800 transition-all duration-300 ${getPreviewBackground(chatStyle)}`}><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 text-center">{t('livePreview', language)}</p><div className="pointer-events-none"><ChatMessage message={previewMessage} themeColor={themeColor} chatStyle={chatStyle} /></div></div>
                <div className="space-y-3"><label className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t('colorAccent', language)}</label><div className="flex flex-wrap gap-3">{THEME_COLORS.map(c => (<button key={c.id} onClick={() => setThemeColor(c.id)} className={`w-8 h-8 rounded-full ${c.class} ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 transition-all ${themeColor === c.id ? 'ring-slate-400 dark:ring-slate-500 scale-110' : 'ring-transparent hover:scale-110'}`} />))}</div></div>
                <div className="space-y-3"><label className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t('interfaceStyle', language)}</label><div className="grid grid-cols-2 gap-2">{CHAT_STYLES.map(s => (<button key={s.id} onClick={() => setChatStyle(s.id)} className={`px-4 py-3 rounded-xl border text-left transition-all ${chatStyle === s.id ? `bg-${themeColor}-50 border-${themeColor}-200 dark:bg-${themeColor}-900/20 dark:border-${themeColor}-800 ring-1 ring-${themeColor}-500/30` : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}><div className={`font-semibold text-sm ${chatStyle === s.id ? `text-${themeColor}-700 dark:text-${themeColor}-300` : 'text-slate-700 dark:text-slate-300'}`}>{s.name}</div><div className="text-[10px] text-slate-500 dark:text-slate-500 leading-tight mt-0.5">{s.description}</div></button>))}</div></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div variants={backgroundBlobVariants(0)} animate="animate" className={`absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-${themeColor}-300/20 dark:bg-${themeColor}-900/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen transition-colors duration-500`} />
        <motion.div variants={backgroundBlobVariants(5)} animate="animate" className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-300/20 dark:bg-cyan-900/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen transition-colors duration-500" />
        <motion.div variants={backgroundBlobVariants(2)} animate="animate" className={`absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-${themeColor}-200/30 dark:bg-${themeColor}-900/10 rounded-full blur-[80px] mix-blend-multiply dark:mix-blend-screen transition-colors duration-500`} />
        {particles.map((p) => (<motion.div key={p.id} className={`absolute rounded-full bg-${themeColor}-400/30 dark:bg-${themeColor}-400/20`} style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }} animate={{ y: [0, -100, 0], x: [0, Math.sin(p.id) * 50, 0], opacity: [0, 0.7, 0], scale: [0.8, 1.2, 0.8] }} transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "linear" }} />))}
        <div className="absolute inset-0 opacity-20 dark:opacity-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="relative z-10 w-full max-w-6xl px-6 py-12 flex flex-col lg:flex-row items-start lg:items-center gap-16 lg:gap-24">
        <div className="flex-1 text-center lg:text-left space-y-10 pt-10">
            <motion.div variants={itemVariants} className="space-y-6">
                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 border border-${themeColor}-100 dark:border-${themeColor}-900/50 text-${themeColor}-700 dark:text-${themeColor}-300 text-xs font-bold uppercase tracking-widest shadow-sm backdrop-blur-sm`}><Sparkles size={14} className="animate-pulse" /><span>{t('tagline', language)}</span></div>
                <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-slate-900 dark:text-white serif leading-[0.9]">{t('heroTitle', language)}</h1>
                <div className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 font-light leading-relaxed max-w-xl mx-auto lg:mx-0 h-24 md:h-auto"><RotatingTypewriter prefix={t('typingPrefix', language)} words={t('typingWords', language) as unknown as string[]} /><br className="hidden md:block" /><span className="text-lg md:text-xl opacity-80 mt-2 block">{t('heroSubtitle', language)}</span></div>
            </motion.div>
            <motion.div variants={itemVariants} className="grid gap-5 text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto lg:mx-0">
                {[1, 2, 3].map(step => (
                    <div key={step} className="flex items-center gap-4 p-4 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/60 dark:border-slate-800 shadow-sm backdrop-blur-sm transition-transform hover:scale-[1.02]">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-${themeColor}-100 to-white dark:from-${themeColor}-900 dark:to-slate-800 flex items-center justify-center flex-shrink-0 text-${themeColor}-600 dark:text-${themeColor}-300 font-bold shadow-sm border border-${themeColor}-50`}>{step}</div>
                        <p className="font-medium">{t(`step${step}`, language)}</p>
                    </div>
                ))}
            </motion.div>
        </div>

        <motion.div variants={itemVariants} className="flex-1 w-full max-w-lg">
            <div className="glass-panel p-1 rounded-[2.5rem] shadow-[0_40px_100px_-30px_rgba(50,50,93,0.15)] bg-gradient-to-b from-white/80 to-white/40 dark:from-slate-800/80 dark:to-slate-900/40 border border-white/80 dark:border-slate-700/50 backdrop-blur-xl">
                <div className="bg-white/50 dark:bg-slate-900/60 rounded-[2.2rem] p-8 border border-white/50 dark:border-slate-700/50">
                  <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-3"><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">{t('selectLanguage', language)}</label>
                          <div className="grid grid-cols-2 gap-3">{LANGUAGES.map((l) => (<button key={l.id} type="button" onClick={() => setLanguage(l.id as Language)} className={`flex items-center px-4 py-3 rounded-xl border text-left transition-all duration-200 ${language === l.id ? `bg-${themeColor}-600 text-white border-${themeColor}-600 shadow-md` : 'bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white'}`}><span className={`text-[10px] font-bold uppercase tracking-wider w-8 shrink-0 ${language === l.id ? 'text-white/70' : 'text-slate-400'}`}>{l.id === 'en' ? 'US' : l.id === 'ja' ? 'JP' : ['hi','kn','te','ta','ml'].includes(l.id) ? 'IN' : l.id.toUpperCase()}</span><span className={`font-bold text-sm ${language === l.id ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>{l.name}</span></button>))}</div>
                      </div>
                      <div className="space-y-3"><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">{t('selectPersona', language)}</label>
                          <div className="grid grid-cols-1 gap-2">
                              {[
                                  { id: 'child', icon: Baby, label: t('personaChildLabel', language), desc: t('personaChildDesc', language) },
                                  { id: 'student', icon: GraduationCap, label: t('personaStudentLabel', language), desc: t('personaStudentDesc', language) },
                                  { id: 'skeptic', icon: Search, label: t('personaSkepticLabel', language), desc: t('personaSkepticDesc', language) },
                                  { id: 'custom', icon: UserPlus, label: t('personaCustomLabel', language), desc: t('personaCustomDesc', language) },
                              ].map((p) => (
                                  <button key={p.id} type="button" onClick={() => setPersona(p.id as Persona)} className={`relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 text-left ${persona === p.id ? `bg-${themeColor}-50/80 dark:bg-${themeColor}-900/30 border-${themeColor}-500/30` : 'bg-white/60 dark:bg-slate-800/60 border-transparent hover:bg-white'}`}><div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${persona === p.id ? `bg-${themeColor}-600 text-white` : `bg-white dark:bg-slate-700 text-slate-400`}`}><p.icon size={16} /></div><div><p className={`text-sm font-bold ${persona === p.id ? `text-${themeColor}-900 dark:text-${themeColor}-300` : 'text-slate-700 dark:text-slate-300'}`}>{p.label}</p><p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{p.desc}</p></div></button>
                              ))}
                          </div>
                      </div>
                      <AnimatePresence>{persona === 'custom' && (<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden"><textarea value={customPersonaInstruction} onChange={(e) => setCustomPersonaInstruction(e.target.value)} placeholder={t('customPlaceholder', language)} className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" rows={3} /></motion.div>)}</AnimatePresence>
                      <div className="space-y-3"><label htmlFor="topic" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">{t('subjectToMaster', language)}</label><div className="relative group"><input type="text" id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={t('subjectPlaceholder', language)} className={`w-full px-5 py-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-${themeColor}-500/10 focus:border-${themeColor}-500 transition-all shadow-sm`} autoFocus /><div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity"><BrainCircuit className={`text-${themeColor}-400`} size={20} /></div></div></div>
                      <button type="submit" disabled={!topic.trim() || (persona === 'custom' && !customPersonaInstruction.trim())} className={`w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-bold text-white shadow-xl transition-all duration-300 transform ${topic.trim() && (persona !== 'custom' || customPersonaInstruction.trim()) ? `bg-slate-900 dark:bg-${themeColor}-600 hover:bg-${themeColor}-600 hover:-translate-y-1` : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}`}><span className="text-lg">{t('beginSession', language)}</span><ArrowRight size={20} /></button>
                  </form>
                </div>
            </div>
        </motion.div>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 1 }} className="absolute bottom-6 w-full max-w-6xl px-6 lg:px-6"><div className="text-[10px] font-medium tracking-widest text-slate-400 dark:text-slate-600 uppercase text-center lg:text-left">{t('poweredBy', language)}</div></motion.div>
    </div>
  );
};

export default WelcomeScreen;