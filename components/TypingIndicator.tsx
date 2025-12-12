import React from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface TypingIndicatorProps {
  text: string;
  themeColor: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ text, themeColor }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex w-full justify-start mb-6"
    >
      <div className="flex max-w-[85%] md:max-w-[75%] gap-4">
        {/* Avatar */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm border bg-white dark:bg-slate-800 text-${themeColor}-600 dark:text-${themeColor}-400 border-${themeColor}-100 dark:border-slate-700 transition-colors duration-300`}>
          <Sparkles size={18} />
        </div>

        {/* Bubble */}
        <div className="flex flex-col items-start pt-1">
          <div className="px-5 py-3 rounded-2xl rounded-tl-none bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-3 transition-colors duration-300">
             {/* Persistent Dots Animation */}
             <div className="flex space-x-1 h-3 items-center">
                <motion.div 
                  className={`w-2 h-2 bg-${themeColor}-400 dark:bg-${themeColor}-500 rounded-full`}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ 
                    duration: 0.6, 
                    repeat: Infinity, 
                    ease: "easeInOut", 
                    delay: 0 
                  }}
                />
                <motion.div 
                  className={`w-2 h-2 bg-${themeColor}-400 dark:bg-${themeColor}-500 rounded-full`}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ 
                    duration: 0.6, 
                    repeat: Infinity, 
                    ease: "easeInOut", 
                    delay: 0.2 
                  }}
                />
                <motion.div 
                  className={`w-2 h-2 bg-${themeColor}-400 dark:bg-${themeColor}-500 rounded-full`}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ 
                    duration: 0.6, 
                    repeat: Infinity, 
                    ease: "easeInOut", 
                    delay: 0.4 
                  }}
                />
            </div>
            
            {/* Subtle Text Pulse */}
            <motion.span 
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="text-sm text-slate-500 dark:text-slate-400 font-medium"
            >
                {text}
            </motion.span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TypingIndicator;