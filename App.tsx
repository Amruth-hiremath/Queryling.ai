import React, { useState, useRef, useEffect } from 'react';
import { Message, SidebarData, FeedbackReport, ChatStyle, Persona, Language, SessionRecord } from './types';
import * as GeminiService from './services/geminiService';
import WelcomeScreen from './components/WelcomeScreen';
import ChatMessage from './components/ChatMessage';
import Sidebar from './components/Sidebar';
import FeedbackModal from './components/FeedbackModal';
import ReportLoading from './components/ReportLoading';
import TypingIndicator from './components/TypingIndicator';
import Tooltip from './components/Tooltip';
import StudyToolsModal from './components/StudyToolsModal';
import LiveVoiceModal from './components/LiveVoiceModal'; // Import New Modal
import { Send, Menu, X, BarChart2, Image as ImageIcon, Sparkles, Sun, Moon, Palette, TrendingUp, GraduationCap, Radio, LogOut } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { t } from './utils/i18n';

const THEME_COLORS = [
  { id: 'indigo', name: 'Indigo', class: 'bg-indigo-500' },
  { id: 'emerald', name: 'Emerald', class: 'bg-emerald-500' },
  { id: 'rose', name: 'Rose', class: 'bg-rose-500' },
  { id: 'amber', name: 'Amber', class: 'bg-amber-500' },
  { id: 'violet', name: 'Violet', class: 'bg-violet-500' },
  { id: 'cyan', name: 'Cyan', class: 'bg-cyan-500' },
];

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
        return window.localStorage.getItem('theme') === 'dark' || 
               (!('theme' in window.localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const [themeColor, setThemeColor] = useState<string>(() => {
      if (typeof window !== 'undefined') {
          return window.localStorage.getItem('themeColor') || 'indigo';
      }
      return 'indigo';
  });

  const [chatStyle, setChatStyle] = useState<ChatStyle>('standard');
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [topic, setTopic] = useState('');
  const [persona, setPersona] = useState<Persona>('student');
  const [customPersonaInstruction, setCustomPersonaInstruction] = useState<string | undefined>(undefined);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [language, setLanguage] = useState<Language>('en');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarData, setSidebarData] = useState<SidebarData>({ summary: '', keyTerms: [], relatedConcepts: [], masteryScore: 0 });
  const [isSidebarUpdating, setIsSidebarUpdating] = useState(false);
  const [thinkingStep, setThinkingStep] = useState(0);
  const thinkingSteps = ["Analyzing your logic...", "Finding gaps in explanation...", "Formulating a confused question...", "Double checking understanding..."];
  const [isVoiceModeOpen, setIsVoiceModeOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [visualizationImage, setVisualizationImage] = useState<string | null>(null);
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackReport, setFeedbackReport] = useState<FeedbackReport | null>(null);
  const [generatingFeedback, setGeneratingFeedback] = useState(false);
  const [showStudyTools, setShowStudyTools] = useState(false);
  const [showExitPrompt, setShowExitPrompt] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const changeTheme = (color: string) => {
      setThemeColor(color);
      localStorage.setItem('themeColor', color);
      setShowThemePicker(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking, isStreaming]);

  useEffect(() => {
    if (isThinking) {
      const interval = setInterval(() => {
        setThinkingStep(prev => (prev + 1) % thinkingSteps.length);
      }, 1500);
      return () => clearInterval(interval);
    }
    setThinkingStep(0);
  }, [isThinking]);

  useEffect(() => {
      if (!hasStarted) return;
      if (persona === 'custom') return;

      const score = sidebarData.masteryScore;
      let leveledUp = false;
      let newLevel = currentLevel;
      let newPersona = persona;

      if (score >= 80 && currentLevel < 3) {
          newLevel = 3; newPersona = 'skeptic'; leveledUp = true;
      } else if (score >= 40 && score < 80 && currentLevel < 2) {
          newLevel = 2; newPersona = 'student'; leveledUp = true;
      }

      if (leveledUp) {
          setCurrentLevel(newLevel);
          setPersona(newPersona);
          GeminiService.injectPersonaUpdate(newPersona);
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
          setMessages(prev => [...prev, {
              id: `sys-${Date.now()}`,
              role: 'model',
              text: `**LEVEL UP!** Your mastery has increased. I am evolving into a **${newPersona.toUpperCase()}** to challenge you further.`,
              type: 'levelup'
          }]);
      }
  }, [sidebarData.masteryScore, hasStarted]);

  const getAvatarEmotion = () => {
    if (isThinking) return "🤔";
    if (isStreaming) return "🗣️";
    if (inputText.length > 50) return "😮"; 
    if (inputText.length > 0) return "👂"; 
    return "😐"; 
  };

  const handleStart = async (selectedTopic: string, selectedPersona: Persona, selectedLanguage: Language, customInstruction?: string) => {
    setTopic(selectedTopic);
    setPersona(selectedPersona);
    setLanguage(selectedLanguage);
    setCustomPersonaInstruction(customInstruction);
    
    if (selectedPersona === 'child') { setCurrentLevel(1); setChatStyle('bubble'); }
    else if (selectedPersona === 'student') { setCurrentLevel(2); setChatStyle('standard'); }
    else if (selectedPersona === 'skeptic') { setCurrentLevel(3); setChatStyle('scifi'); }
    else if (selectedPersona === 'custom') { setCurrentLevel(2); setChatStyle('standard'); }

    setHasStarted(true);
    setIsThinking(true);
    setMessages([]);

    try {
      const response = await GeminiService.startChatSession(selectedTopic, selectedPersona, selectedLanguage, customInstruction);
      const text = response.text || "I'm ready. What is this topic about?"; 
      setMessages([{ id: Date.now().toString(), role: 'model', text, type: 'challenge' }]);
    } catch (error) {
      console.error(error);
      setMessages([{ id: 'error', role: 'model', text: "Oops, I got distracted. Can we try that again?", type: 'normal' }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleResumeSession = (record: SessionRecord) => {
      if (!record.messages || record.messages.length === 0) return;
      
      setTopic(record.topic);
      setPersona(record.persona);
      if (record.language) setLanguage(record.language);
      if (record.customInstruction) setCustomPersonaInstruction(record.customInstruction);
      setMessages(record.messages);
      if (record.sidebarData) setSidebarData(record.sidebarData);
      
      if (record.persona === 'child') { setCurrentLevel(1); setChatStyle('bubble'); }
      else if (record.persona === 'student') { setCurrentLevel(2); setChatStyle('standard'); }
      else if (record.persona === 'skeptic') { setCurrentLevel(3); setChatStyle('scifi'); }
      else if (record.persona === 'custom') { setCurrentLevel(2); setChatStyle('standard'); }

      setHasStarted(true);
      GeminiService.startChatSession(record.topic, record.persona, record.language || language, record.customInstruction, record.messages);
      setMessages(prev => [...prev, { id: `sys-resume-${Date.now()}`, role: 'model', text: `*Session Resumed.* Welcome back! Where were we?`, type: 'normal' }]);
  };

  const handleConceptClick = (concept: string) => {
      const question = `How does "${concept}" relate to what I just explained?`;
      setInputText(question);
      inputRef.current?.focus();
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleVoiceModeClose = (transcripts: Message[]) => {
      setIsVoiceModeOpen(false);
      if (transcripts.length > 0) {
          setMessages(prev => [...prev, ...transcripts]);
          setIsSidebarUpdating(true);
          GeminiService.analyzeContextForSidebar([...messages, ...transcripts], topic, language)
            .then(data => { setSidebarData(data); setIsSidebarUpdating(false); })
            .catch(() => setIsSidebarUpdating(false));
      }
  };

  const handleVisualize = async () => {
    if (!sidebarData.summary) return;
    setIsVisualizing(true);
    try {
        const imageUrl = await GeminiService.generateVisualization(topic, sidebarData.summary, persona);
        setVisualizationImage(imageUrl);
    } catch (e) { console.error(e); } finally { setIsVisualizing(false); }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() && !selectedImage) return;
    const currentImage = selectedImage;
    const currentText = inputText;
    setInputText('');
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: currentText, image: currentImage || undefined };
    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);
    const minDelayPromise = new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const aiMsgId = (Date.now() + 1).toString();
      const base64Data = currentImage ? currentImage.split(',')[1] : null;
      let firstChunkReceived = false;

      const fullText = await GeminiService.sendMessageStream(currentText, base64Data, (chunkText) => {
          if (!firstChunkReceived) {
              firstChunkReceived = true;
              minDelayPromise.then(() => {
                 setIsThinking(false);
                 setIsStreaming(true);
                 setMessages(prev => [...prev, { id: aiMsgId, role: 'model', text: chunkText, type: determineMessageType(chunkText) }]);
              });
          } else {
               minDelayPromise.then(() => {
                  setMessages(prev => prev.map(msg => msg.id === aiMsgId ? { ...msg, text: chunkText, type: determineMessageType(chunkText) } : msg));
               });
          }
      });
      
      await minDelayPromise;
      setIsStreaming(false);
      if (!firstChunkReceived) setIsThinking(false);

      setIsSidebarUpdating(true);
      GeminiService.analyzeContextForSidebar([...messages, userMsg, { id: aiMsgId, role: 'model', text: fullText }], topic, language)
        .then(data => { setSidebarData(data); setIsSidebarUpdating(false); })
        .catch(() => setIsSidebarUpdating(false));
    } catch (error) {
       setIsThinking(false);
       setIsStreaming(false);
       setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "I'm having trouble understanding right now. Could you check your connection?", type: 'normal' }]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFinishSession = async () => {
    setGeneratingFeedback(true);
    setShowExitPrompt(false);
    try {
        const report = await GeminiService.generateFinalFeedback(messages, topic, language);
        setFeedbackReport(report);
        setShowFeedback(true);
        const cleanMessages = messages.map(({ image, ...rest }) => rest);
        const sessionRecord: SessionRecord = {
          id: Date.now().toString(), date: new Date().toISOString(), topic, persona, score: report.score,
          summary: report.summary, language, messages: cleanMessages, sidebarData, customInstruction: customPersonaInstruction
        };
        try {
          const existing = window.localStorage.getItem('queryling_history');
          const history = existing ? JSON.parse(existing) : [];
          history.push(sessionRecord);
          if (history.length > 20) history.shift();
          window.localStorage.setItem('queryling_history', JSON.stringify(history));
        } catch (e) { console.error(e); }
    } catch (e) { alert("Couldn't generate report."); } finally { setGeneratingFeedback(false); }
  };

  const handleRestart = () => {
    setHasStarted(false); setTopic(''); setMessages([]);
    setSidebarData({ summary: '', keyTerms: [], relatedConcepts: [], masteryScore: 0 });
    setVisualizationImage(null); setShowFeedback(false); setFeedbackReport(null);
    setShowExitPrompt(false); setCurrentLevel(1); setPersona('student'); setCustomPersonaInstruction(undefined); setLanguage('en');
  };

  const determineMessageType = (text: string): Message['type'] => {
    const lower = text.toLowerCase();
    if (lower.includes('confused') || lower.includes('?') || lower.includes('what do you mean')) return 'challenge';
    if (lower.includes('got it') || lower.includes('makes sense')) return 'feedback';
    return 'normal';
  };

  const getBackgroundClass = () => {
      switch(chatStyle) {
          case 'cyberpunk': return "bg-slate-950 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]";
          case 'scifi': return "bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black";
          case 'bubble': return "bg-blue-50/30 dark:bg-slate-900 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px]";
          default: return "bg-[#fafafa] dark:bg-slate-950";
      }
  };

  if (!hasStarted) {
    return <WelcomeScreen onStart={handleStart} onResume={handleResumeSession} darkMode={darkMode} toggleDarkMode={toggleDarkMode} themeColor={themeColor} setThemeColor={setThemeColor} chatStyle={chatStyle} setChatStyle={setChatStyle} />;
  }

  return (
    <div className={`flex h-screen font-sans relative transition-colors duration-300 ${getBackgroundClass()}`}>
      {generatingFeedback && <ReportLoading themeColor={themeColor} language={language} />}
      {sidebarOpen && <div className="fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <AnimatePresence>
        {showExitPrompt && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-sm w-full border border-slate-200 dark:border-slate-700">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">{t('endSessionTitle', language)}</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">{t('endSessionDesc', language)}</p>
                    <div className="flex flex-col gap-3">
                        <div className="space-y-1">
                            <button onClick={handleFinishSession} className={`w-full py-3 bg-${themeColor}-600 text-white rounded-xl font-semibold shadow-md flex items-center justify-center gap-2`}>{t('generateReport', language)}</button>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 px-1 italic leading-tight">{t('reportSaveExplanation', language)}</p>
                        </div>
                        <button onClick={handleRestart} className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2">{t('exitToHome', language)}</button>
                        <button onClick={() => setShowExitPrompt(false)} className="w-full py-2 text-slate-400 text-xs font-medium uppercase tracking-wider">{t('cancel', language)}</button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
      <LiveVoiceModal isOpen={isVoiceModeOpen} onClose={handleVoiceModeClose} topic={topic} persona={persona} language={language} customInstruction={customPersonaInstruction} themeColor={themeColor} />
      <div className="flex-1 flex flex-col h-full relative z-10 transition-all">
        <header className={`h-16 flex items-center justify-between px-4 lg:px-8 shadow-sm z-20 border-b ${chatStyle === 'minimal' ? 'bg-transparent border-transparent' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-9 h-9 bg-gradient-to-br from-${themeColor}-500 to-${themeColor}-600 rounded-lg flex items-center justify-center text-white`}><Sparkles size={18} /></div>
            <div>
                <h1 className="font-bold text-lg serif text-slate-900 dark:text-slate-100 leading-none">Queryling</h1>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span className={`font-medium text-${themeColor}-600 dark:text-${themeColor}-400 truncate max-w-[150px]`}>{topic}</span>
                    <span className="capitalize">{persona}</span>
                    <span className="flex items-center gap-1"><TrendingUp size={12} />Lvl {currentLevel}</span>
                </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <Tooltip content="Live Voice Mode"><button onClick={() => setIsVoiceModeOpen(true)} className="p-2 text-slate-400 hover:text-indigo-600"><Radio size={20} /></button></Tooltip>
             <Tooltip content="Study Tools"><button onClick={() => setShowStudyTools(true)} className="p-2 text-slate-400 hover:text-indigo-600"><GraduationCap size={20} /></button></Tooltip>
             <button onClick={toggleDarkMode} className="p-2 text-slate-400">{darkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
             <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1"></div>
             <button onClick={() => setShowExitPrompt(true)} className="p-2 text-slate-400 hover:text-red-500"><LogOut size={20} /></button>
             <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-slate-500 lg:hidden">{sidebarOpen ? <X size={24} /> : <Menu size={24} />}</button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto px-4 lg:px-0 py-6 scroll-smooth"><div className="max-w-3xl mx-auto w-full">{messages.map((msg) => (<ChatMessage key={msg.id} message={msg} themeColor={themeColor} chatStyle={chatStyle} />))}{isThinking && <TypingIndicator text={thinkingSteps[thinkingStep]} themeColor={themeColor} />}<div ref={messagesEndRef} className="h-4" /></div></div>
        <div className={`p-4 lg:p-6 backdrop-blur-md border-t ${chatStyle === 'minimal' ? 'bg-white/90 dark:bg-black/90 border-transparent' : 'bg-white/80 dark:bg-slate-900/80 border-slate-100 dark:border-slate-800'}`}>
            <div className="max-w-3xl mx-auto">
                {selectedImage && <div className="mb-3 relative inline-block"><img src={selectedImage} className="h-24 w-auto rounded-xl shadow-md" /><button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-white dark:bg-slate-800 rounded-full p-1.5 shadow-sm hover:text-red-500"><X size={14} /></button></div>}
                <div className={`relative flex items-end gap-2 p-2 rounded-2xl border transition-all ${chatStyle === 'minimal' ? 'border-b-2 border-t-0 border-x-0 rounded-none' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'}`}>
                    <div className="flex flex-col items-center justify-center w-10 h-10 mb-1 ml-1 flex-shrink-0"><span className="text-2xl animate-bounce-subtle">{getAvatarEmotion()}</span></div>
                    <div className="flex items-center gap-1 mb-1.5 ml-1 border-l border-slate-200 dark:border-slate-800 pl-2"><Tooltip content="Upload diagram"><button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-indigo-600"><ImageIcon size={20} /></button></Tooltip><input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" /></div>
                    <textarea ref={inputRef} value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={handleKeyDown} placeholder={t('inputPlaceholder', language)} className="flex-1 max-h-48 py-3 px-2 bg-transparent border-none focus:ring-0 text-slate-800 dark:text-slate-200 resize-none" rows={1} />
                    <button onClick={handleSendMessage} disabled={(!inputText.trim() && !selectedImage) || isThinking || isStreaming} className={`mb-1 p-2.5 bg-${themeColor}-600 text-white rounded-xl disabled:opacity-50 disabled:bg-slate-300 shadow-md`}><Send size={18} /></button>
                </div>
            </div>
        </div>
      </div>
      <div className={`fixed inset-y-0 right-0 z-30 w-80 bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800 shadow-xl transform transition-transform duration-300 lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <Sidebar data={sidebarData} topic={topic} isUpdating={isSidebarUpdating} visualizationImage={visualizationImage} isVisualizing={isVisualizing} onVisualize={handleVisualize} themeColor={themeColor} onConceptClick={handleConceptClick} language={language} />
      </div>
      <FeedbackModal isOpen={showFeedback} report={feedbackReport} onRestart={handleRestart} themeColor={themeColor} />
      <StudyToolsModal isOpen={showStudyTools} onClose={() => setShowStudyTools(false)} messages={messages} topic={topic} themeColor={themeColor} language={language} />
    </div>
  );
};

export default App;