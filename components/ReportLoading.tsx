import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit } from 'lucide-react';
import { Language } from '../types';
import { t } from '../utils/i18n';

interface ReportLoadingProps {
  themeColor: string;
  language: Language;
}

const ReportLoading: React.FC<ReportLoadingProps> = ({ themeColor, language }) => {
  return (
    <div className="fixed inset-0 z-[60] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center transition-colors duration-300">
      <div className="relative">
        <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`absolute inset-0 bg-${themeColor}-200 dark:bg-${themeColor}-900/50 rounded-full blur-xl`}
        />
        <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className={`w-24 h-24 rounded-full border-4 border-${themeColor}-100 dark:border-slate-800 border-t-${themeColor}-600 dark:border-t-${themeColor}-500 flex items-center justify-center relative bg-white dark:bg-slate-900 shadow-xl transition-colors duration-300`}
        >
            <BrainCircuit className={`text-${themeColor}-600 dark:text-${themeColor}-400`} size={40} />
        </motion.div>
      </div>
      
      <motion.h2 
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="mt-8 text-2xl font-bold text-slate-800 dark:text-slate-100 serif"
      >
        {t('reportLoadingTitle', language)}
      </motion.h2>
      <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm">{t('reportLoadingDesc', language)}</p>
    </div>
  );
};

export default ReportLoading;