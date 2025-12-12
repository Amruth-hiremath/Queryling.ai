
import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { ZoomIn, X, Download, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MermaidDiagramProps {
  chart: string;
  themeColor: string;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart, themeColor }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [isZoomed, setIsZoomed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      securityLevel: 'loose',
      themeVariables: {
        primaryColor: '#e2e8f0',
        primaryTextColor: '#0f172a',
        primaryBorderColor: '#94a3b8',
        lineColor: '#64748b',
        secondaryColor: '#f1f5f9',
        tertiaryColor: '#fff',
      }
    });
  }, []);

  useEffect(() => {
    const renderChart = async () => {
      if (!chart) return;
      setError(null);
      try {
        const id = `mermaid-${Date.now()}`;
        // Clean the chart string to remove markdown code blocks if present
        let cleanChart = chart.replace(/```mermaid\n?|```/g, "").trim();
        
        if (!cleanChart || cleanChart.length < 5) {
            setSvgContent('');
            return;
        }

        const { svg } = await mermaid.render(id, cleanChart);
        setSvgContent(svg);
      } catch (error: any) {
        console.error('Mermaid render error:', error);
        setError('Unable to render logic graph structure.');
      }
    };
    renderChart();
  }, [chart]);

  const downloadSvg = () => {
     if (!svgContent) return;
     const blob = new Blob([svgContent], { type: 'image/svg+xml' });
     const url = URL.createObjectURL(blob);
     const link = document.createElement('a');
     link.href = url;
     link.download = 'knowledge-graph.svg';
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  return (
    <>
      <div className="relative group bg-white dark:bg-slate-800 rounded-lg p-2 overflow-hidden border border-slate-200 dark:border-slate-700">
        {!error && svgContent && (
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button 
                    onClick={downloadSvg}
                    className="p-1.5 bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-md shadow-sm transition-colors"
                    title="Download SVG"
                >
                    <Download size={14} />
                </button>
                <button 
                    onClick={() => setIsZoomed(true)}
                    className="p-1.5 bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-md shadow-sm transition-colors"
                    title="Zoom In"
                >
                    <ZoomIn size={14} />
                </button>
            </div>
        )}

        <div className="mermaid-output flex justify-center items-center min-h-[150px] overflow-auto custom-scrollbar">
            {error ? (
                <div className="flex flex-col items-center justify-center text-slate-400 text-xs gap-2 p-4">
                    <AlertTriangle size={16} className="text-amber-500" />
                    <span className="text-center">{error}</span>
                </div>
            ) : (
                <div 
                    ref={containerRef}
                    dangerouslySetInnerHTML={{ __html: svgContent }}
                />
            )}
        </div>
      </div>

      <AnimatePresence>
        {isZoomed && svgContent && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-10"
                onClick={() => setIsZoomed(false)}
            >
                <motion.div 
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.9 }}
                    className="bg-white dark:bg-slate-950 rounded-xl shadow-2xl w-full h-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden relative"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                             Full Logic Graph
                        </h3>
                        <button 
                            onClick={() => setIsZoomed(false)}
                            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
                        >
                            <X size={20} className="text-slate-500" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto p-4 md:p-8 flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')] bg-slate-50 dark:bg-slate-900/50">
                         <div 
                            className="w-full h-full flex items-center justify-center"
                            dangerouslySetInnerHTML={{ __html: svgContent.replace(/height="[^"]*"/, 'height="100%"').replace(/width="[^"]*"/, 'width="100%"') }} 
                         />
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MermaidDiagram;
