import React from 'react';
import { SidebarData, Language } from '../types';
import { Book, Tag, Compass, Trophy, Loader2, BrainCircuit, Image as ImageIcon, RefreshCcw, Sparkles, Network } from 'lucide-react';
import { motion } from 'framer-motion';
import MermaidDiagram from './MermaidDiagram';
import { t } from '../utils/i18n';

interface SidebarProps {
  data: SidebarData;
  topic: string;
  isUpdating: boolean;
  visualizationImage: string | null;
  isVisualizing: boolean;
  onVisualize: () => void;
  themeColor: string;
  onConceptClick: (concept: string) => void;
  language: Language;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    data, 
    topic, 
    isUpdating, 
    visualizationImage, 
    isVisualizing, 
    onVisualize,
    themeColor,
    onConceptClick,
    language
}) => {
  return (
    <div className="h-full bg-white dark:bg-slate-900 flex flex-col overflow-hidden relative transition-colors duration-300">
      
      {/* Sidebar Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 relative">
        <div className="flex justify-between items-start">
            <div>
                <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">{t('subjectMatter', language)}</h3>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-snug break-words serif">{topic || "..."}</h2>
            </div>
            {isUpdating && (
                <div className={`animate-spin text-${themeColor}-500 dark:text-${themeColor}-400`}>
                    <Loader2 size={16} />
                </div>
            )}
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto p-6 space-y-8 transition-opacity duration-500 ${isUpdating ? 'opacity-60' : 'opacity-100'}`}>
        
        {/* Mastery Gauge */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 relative overflow-hidden transition-colors duration-300">
           {isUpdating && (
                <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 z-10 animate-pulse"></div>
           )}
           <div className="flex items-center justify-between mb-3">
              <div className={`flex items-center gap-2 text-${themeColor}-900 dark:text-${themeColor}-300 font-semibold text-sm`}>
                  <Trophy size={16} className="text-amber-500" />
                  <span>{t('mastery', language)}</span>
              </div>
              <span className="text-lg font-bold text-slate-700 dark:text-slate-200">{data.masteryScore || 0}%</span>
           </div>
           <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 mb-3">
              <div 
                  className="bg-gradient-to-r from-amber-400 to-orange-500 h-2 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(251,191,36,0.4)]"
                  style={{ width: `${data.masteryScore || 0}%` }}
              ></div>
           </div>
           <p className="text-xs text-slate-500 dark:text-slate-400 text-center font-medium">
              {data.masteryScore < 30 ? t('explainSimply', language) : 
               data.masteryScore < 70 ? t('gettingThere', language) : t('excellentTeaching', language)}
           </p>
        </div>

        {/* Live Logic Graph */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-1 transition-colors duration-300">
             <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div className={`flex items-center gap-2 text-${themeColor}-600 dark:text-${themeColor}-400`}>
                    <Network size={16} />
                    <h3 className="font-semibold text-xs uppercase tracking-wide">{t('logicGraph', language)}</h3>
                </div>
             </div>
             <div className="p-3">
                 {data.mermaidCode ? (
                    <MermaidDiagram chart={data.mermaidCode} themeColor={themeColor} />
                 ) : (
                    <div className="h-32 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-xs text-center p-4 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                        <Network size={24} className="mb-2 opacity-50" />
                        ...
                    </div>
                 )}
             </div>
        </div>

        {/* Mental Model Visualization */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-1 transition-colors duration-300">
             <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div className={`flex items-center gap-2 text-${themeColor}-600 dark:text-${themeColor}-400`}>
                    <BrainCircuit size={16} />
                    <h3 className="font-semibold text-xs uppercase tracking-wide">{t('mentalModel', language)}</h3>
                </div>
                {visualizationImage && !isVisualizing && (
                    <button onClick={onVisualize} className={`text-slate-400 dark:text-slate-500 hover:text-${themeColor}-600 dark:hover:text-${themeColor}-400 transition-colors`}>
                        <RefreshCcw size={14} />
                    </button>
                )}
             </div>
             <div className="p-3">
                 {isVisualizing ? (
                     <div className="h-40 bg-slate-100 dark:bg-slate-800 rounded-lg flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-2 animate-pulse">
                         <ImageIcon size={24} />
                         <span className="text-xs font-medium">{t('sketching', language)}</span>
                     </div>
                 ) : visualizationImage ? (
                     <div className="relative group">
                        <img 
                            src={visualizationImage} 
                            alt="AI Mental Model" 
                            className="w-full h-auto rounded-lg shadow-sm border border-white dark:border-slate-600" 
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <a 
                                href={visualizationImage} 
                                download={`queryling-mental-model-${topic}.jpg`}
                                className="text-white text-xs font-bold bg-black/50 px-3 py-1.5 rounded-full hover:bg-black/70 backdrop-blur-sm"
                            >
                                {t('download', language)}
                            </a>
                        </div>
                     </div>
                 ) : (
                     <div className="text-center py-4 px-2">
                         <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                            {/* See how Queryling visualizes your explanation so far. */}
                         </p>
                         <button 
                            onClick={onVisualize}
                            disabled={!data.summary}
                            className={`w-full py-2 bg-white dark:bg-slate-800 border border-${themeColor}-200 dark:border-slate-600 text-${themeColor}-600 dark:text-${themeColor}-400 text-xs font-bold rounded-lg shadow-sm hover:bg-${themeColor}-50 dark:hover:bg-slate-700 hover:border-${themeColor}-300 dark:hover:border-slate-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                         >
                            {t('visualize', language)}
                         </button>
                     </div>
                 )}
             </div>
        </div>

        {/* Summary */}
        <div>
          <div className={`flex items-center gap-2 mb-3 text-${themeColor}-600 dark:text-${themeColor}-400`}>
              <Book size={16} />
              <h3 className="font-semibold text-sm uppercase tracking-wide">{t('learnedSoFar', language)}</h3>
          </div>
          <div className={`p-4 bg-${themeColor}-50/50 dark:bg-${themeColor}-900/10 rounded-lg text-sm text-slate-700 dark:text-slate-300 leading-relaxed border border-${themeColor}-50 dark:border-${themeColor}-900/30 min-h-[80px]`}>
              {data.summary || t('sidebarListening', language)}
          </div>
        </div>

        {/* Key Terms */}
        <div>
          <div className="flex items-center gap-2 mb-3 text-emerald-600 dark:text-emerald-400">
              <Tag size={16} />
              <h3 className="font-semibold text-sm uppercase tracking-wide">{t('keyTerms', language)}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
              {data.keyTerms.length > 0 ? (
                  data.keyTerms.map((term, i) => (
                      <span key={i} className="px-3 py-1 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md text-xs font-medium border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-300">
                          {term}
                      </span>
                  ))
              ) : (
                  <span className="text-xs text-slate-400 dark:text-slate-600 italic pl-1">{t('noTerms', language)}</span>
              )}
          </div>
        </div>

        {/* Related Concepts (Interactive Bubbles) */}
        <div>
          <div className="flex items-center gap-2 mb-3 text-violet-600 dark:text-violet-400">
              <Compass size={16} />
              <h3 className="font-semibold text-sm uppercase tracking-wide">{t('relatedConcepts', language)}</h3>
          </div>
          <div className="grid grid-cols-1 gap-2">
              {data.relatedConcepts.length > 0 ? (
                  data.relatedConcepts.map((concept, i) => (
                      <motion.button 
                          key={i} 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => onConceptClick(concept)}
                          className="flex items-center gap-3 p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-violet-100 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-md transition-all group text-left w-full"
                      >
                          <div className="w-8 h-8 rounded-full bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0 text-violet-500 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                              <Sparkles size={14} />
                          </div>
                          <span className="text-sm text-slate-600 dark:text-slate-300 font-medium group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">
                            {concept}
                          </span>
                      </motion.button>
                  ))
              ) : (
                  <span className="text-xs text-slate-400 dark:text-slate-600 italic pl-1">{t('exploring', language)}</span>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;