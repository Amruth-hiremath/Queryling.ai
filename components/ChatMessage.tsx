import React, { memo } from 'react';
import { Message, ChatStyle } from '../types';
import { User, Bot, Sparkles, Terminal, Hexagon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';

interface ChatMessageProps {
  message: Message;
  themeColor: string;
  chatStyle: ChatStyle;
}

const ChatMessage: React.FC<ChatMessageProps> = memo(({ message, themeColor, chatStyle }) => {
  const isUser = message.role === 'user';

  // --- Style Configurations ---

  // 1. Container Styles (Layout & Spacing)
  const getContainerStyles = () => {
    switch(chatStyle) {
        case 'minimal': return `flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6 group`;
        default: return `flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-8 group`;
    }
  };

  // 2. Avatar Styles
  const getAvatarStyles = () => {
    const base = "flex-shrink-0 w-10 h-10 flex items-center justify-center transition-colors duration-300";
    if (chatStyle === 'minimal') return "hidden"; // No avatar for minimal
    
    if (isUser) {
        switch(chatStyle) {
            case 'cyberpunk': return `${base} bg-slate-900 border-2 border-${themeColor}-500 text-${themeColor}-500 shadow-[0_0_10px_rgba(var(--color-${themeColor}-500),0.5)] rounded-none clip-path-polygon-[0_0,100%_0,100%_80%,80%_100%,0_100%]`;
            case 'scifi': return `${base} bg-slate-900 border border-${themeColor}-500/50 text-${themeColor}-400 rounded-lg`;
            case 'bubble': return `${base} bg-slate-900 text-white rounded-full shadow-md`;
            default: return `${base} rounded-full bg-slate-900 dark:bg-${themeColor}-600 text-white border-slate-800 dark:border-${themeColor}-500`;
        }
    } else {
        switch(chatStyle) {
            case 'cyberpunk': return `${base} bg-slate-900 border-2 border-slate-700 text-white rounded-none`;
            case 'scifi': return `${base} bg-slate-900 border border-slate-700 text-slate-300 rounded-lg`;
            case 'bubble': return `${base} bg-white text-${themeColor}-600 rounded-full border-2 border-${themeColor}-100`;
            default: return `${base} rounded-full bg-white dark:bg-slate-800 text-${themeColor}-600 dark:text-${themeColor}-400 border-${themeColor}-100 dark:border-slate-700 shadow-sm border`;
        }
    }
  };

  // 3. Bubble Styles
  const getBubbleStyles = () => {
    const common = "relative px-6 py-4 text-[15px] leading-7 transition-colors duration-300 max-w-full";
    
    if (isUser) {
        switch(chatStyle) {
            case 'cyberpunk': 
                return `${common} bg-slate-900 border border-${themeColor}-500 text-${themeColor}-50 font-mono rounded-none border-r-4`;
            case 'scifi':
                return `${common} bg-slate-900/80 backdrop-blur border border-${themeColor}-500/30 text-slate-100 rounded-lg rounded-tr-none`;
            case 'bubble':
                return `${common} bg-${themeColor}-600 text-white rounded-[2rem] rounded-tr-none shadow-md`;
            case 'minimal':
                return `${common} bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg`;
            default: 
                return `${common} bg-slate-900 dark:bg-${themeColor}-600 text-slate-50 dark:text-${themeColor}-50 rounded-2xl rounded-tr-none shadow-sm`;
        }
    } else {
        switch(chatStyle) {
            case 'cyberpunk':
                return `${common} bg-slate-950 border border-slate-800 text-slate-300 font-mono rounded-none border-l-4 border-l-slate-700`;
            case 'scifi':
                return `${common} bg-slate-950/50 backdrop-blur border border-slate-800 text-slate-300 rounded-lg rounded-tl-none`;
            case 'bubble':
                return `${common} bg-white text-slate-700 border-2 border-slate-100 rounded-[2rem] rounded-tl-none`;
            case 'minimal':
                return `${common} pl-0 py-0 bg-transparent text-slate-700 dark:text-slate-300`;
            default: 
                return `${common} bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl rounded-tl-none shadow-sm`;
        }
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={getContainerStyles()}
    >
      <div className={`flex max-w-[90%] md:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-4`}>
        
        {/* Avatar */}
        <div className={getAvatarStyles()}>
            {chatStyle === 'cyberpunk' ? <Terminal size={18} /> : 
             chatStyle === 'scifi' ? <Hexagon size={18} /> :
             isUser ? <User size={18} /> : <Sparkles size={18} />}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} flex-1 min-w-0`}>
            
            {/* Header (Name & Tags) */}
            <div className={`
                flex items-center gap-2 mb-1.5 px-1
                ${isUser ? 'flex-row-reverse' : 'flex-row'}
            `}>
                <span className={`text-xs font-semibold uppercase tracking-wider ${chatStyle === 'cyberpunk' ? `text-${themeColor}-500` : 'text-slate-400 dark:text-slate-500'}`}>
                    {isUser ? 'You' : 'Queryling'}
                </span>
                
                {!isUser && message.type && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border transition-colors duration-300 ${
                        message.type === 'challenge' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30' :
                        message.type === 'feedback' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30' :
                        'hidden'
                    }`}>
                        {message.type === 'challenge' ? 'Confused' : 'Understanding'}
                    </span>
                )}
            </div>

          {/* Bubble */}
          <div className={getBubbleStyles()}>
             {message.image && (
                <div className="mb-4 rounded-lg overflow-hidden border border-white/10 shadow-sm">
                    <img src={message.image} alt="User upload" className="max-w-full h-auto max-h-64 object-cover" />
                </div>
             )}
             <div className={`markdown-content ${chatStyle === 'cyberpunk' ? 'font-mono text-sm' : ''}`}>
                 <ReactMarkdown 
                    components={{
                        p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} />,
                        strong: ({node, ...props}) => <span className={`font-semibold ${chatStyle === 'cyberpunk' ? `text-${themeColor}-400` : ''}`} {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-3" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-3" {...props} />,
                        li: ({node, ...props}) => <li className="mb-1" {...props} />,
                        a: ({node, ...props}) => <a className={`text-${themeColor}-500 dark:text-${themeColor}-400 hover:underline`} {...props} />,
                        code: ({node, ...props}) => <code className={`bg-slate-100 dark:bg-slate-900/50 px-1 py-0.5 rounded text-sm font-mono text-${themeColor}-600 dark:text-${themeColor}-300`} {...props} />
                    }}
                 >
                     {message.text}
                 </ReactMarkdown>
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default ChatMessage;