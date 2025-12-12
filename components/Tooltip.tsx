import React, { useState, useRef, useEffect, cloneElement, ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  content: string;
  children: ReactElement<any>;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, side = 'top', delay = 0.3 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement>(null);

  // Ensure we have a single valid element to clone
  const child = React.Children.only(children) as ReactElement<any>;

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      let top = 0;
      let left = 0;

      switch (side) {
        case 'top':
          top = rect.top - 8;
          left = rect.left + rect.width / 2;
          break;
        case 'bottom':
          top = rect.bottom + 8;
          left = rect.left + rect.width / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2;
          left = rect.left - 8;
          break;
        case 'right':
          top = rect.top + rect.height / 2;
          left = rect.right + 8;
          break;
      }
      setCoords({ top, left });
    }
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    updatePosition();
    setIsVisible(true);
    child.props.onMouseEnter?.(e);
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    setIsVisible(false);
    child.props.onMouseLeave?.(e);
  };

  const handleFocus = (e: React.FocusEvent) => {
    updatePosition();
    setIsVisible(true);
    child.props.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent) => {
    setIsVisible(false);
    child.props.onBlur?.(e);
  };

  useEffect(() => {
    if (isVisible) {
      const handleScroll = () => updatePosition();
      const handleResize = () => updatePosition();
      
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      }
    }
  }, [isVisible]);

  return (
    <>
      {cloneElement(child, {
        ref: (node: HTMLElement) => {
          triggerRef.current = node;
          // Merge with existing ref if present
          const { ref } = child as any;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        },
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        onFocus: handleFocus,
        onBlur: handleBlur,
      })}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15, delay: delay }}
              style={{ 
                  top: coords.top, 
                  left: coords.left,
                  position: 'fixed',
                  zIndex: 9999,
                  pointerEvents: 'none',
                  transformOrigin: side === 'top' ? 'bottom center' : side === 'bottom' ? 'top center' : 'center',
              }}
              className={`
                 px-2.5 py-1.5 bg-slate-800 text-white text-[11px] font-semibold tracking-wide rounded-lg shadow-xl whitespace-nowrap
                 ${side === 'top' ? '-translate-x-1/2 -translate-y-full' : ''}
                 ${side === 'bottom' ? '-translate-x-1/2' : ''}
                 ${side === 'left' ? '-translate-x-full -translate-y-1/2' : ''}
                 ${side === 'right' ? '-translate-y-1/2' : ''}
              `}
            >
              {content}
              <div className={`absolute w-2 h-2 bg-slate-800 rotate-45 
                  ${side === 'top' ? 'bottom-[-3px] left-1/2 -translate-x-1/2' : ''}
                  ${side === 'bottom' ? 'top-[-3px] left-1/2 -translate-x-1/2' : ''}
                  ${side === 'left' ? 'right-[-3px] top-1/2 -translate-y-1/2' : ''}
                  ${side === 'right' ? 'left-[-3px] top-1/2 -translate-y-1/2' : ''}
              `} />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default Tooltip;