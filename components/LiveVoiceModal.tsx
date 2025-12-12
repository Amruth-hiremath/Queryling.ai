
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, Video, VideoOff, PhoneOff, Camera, Radio } from 'lucide-react';
import { LiveSessionManager } from '../services/geminiService';
import { Persona, Language, Message } from '../types';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: (transcripts: Message[]) => void;
  topic: string;
  persona: Persona;
  language: Language;
  customInstruction?: string;
  themeColor: string;
}

const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({ 
  isOpen, 
  onClose, 
  topic, 
  persona, 
  language, 
  customInstruction, 
  themeColor 
}) => {
  const [sessionManager] = useState(() => new LiveSessionManager());
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [volume, setVolume] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  useEffect(() => {
    if (isOpen) {
        setStatus('connecting');
        if (isCameraOn) startCamera();

        sessionManager.connect(topic, persona, language, customInstruction, videoRef.current)
            .then(() => setStatus('connected'))
            .catch(() => setStatus('error'));

        sessionManager.onVolumeUpdate = (vol) => setVolume(prev => prev * 0.8 + vol * 0.2);
    } else {
        stopCamera();
    }
  }, [isOpen]);

  const startCamera = async () => {
      try {
          const s = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
          setStream(s);
          if (videoRef.current) videoRef.current.srcObject = s;
      } catch (e) {
          console.error("Camera failed", e);
          setIsCameraOn(false);
      }
  };

  const stopCamera = () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      setStream(null);
      if (videoRef.current) videoRef.current.srcObject = null;
  };

  const handleDisconnect = () => {
      const history = sessionManager.disconnect();
      stopCamera();
      onClose(history);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 animate-fade-in backdrop-blur-xl">
        <div className="relative z-10 w-full max-w-lg flex flex-col items-center justify-between h-[85vh] p-8">
            <div className="w-full flex justify-between items-center text-white/50">
                <div className="flex items-center gap-2 text-sm uppercase tracking-widest font-bold">
                    <Radio className={`text-${themeColor}-400 ${status === 'connected' ? 'animate-pulse' : ''}`} size={16} />
                    <span>Live Mode</span>
                </div>
                <div className="px-3 py-1 rounded-full bg-white/10 text-xs font-medium border border-white/10">
                    {status === 'connecting' ? 'Connecting...' : status === 'connected' ? 'Listening' : 'Error'}
                </div>
            </div>

            <div className="relative flex items-center justify-center">
                 <motion.div animate={{ scale: 1 + volume * 5, opacity: 0.8 + volume }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className={`w-48 h-48 rounded-full bg-gradient-to-br from-${themeColor}-400 to-${themeColor}-600 blur-2xl opacity-60 absolute`} />
                 <motion.div animate={{ scale: 1 + volume * 2 }} className={`relative w-40 h-40 rounded-full bg-gradient-to-br from-${themeColor}-500 to-${themeColor}-700 shadow-2xl flex items-center justify-center border border-white/20`}>
                    {isCameraOn ? (
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-black/20">
                             <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <Mic size={48} className="text-white/80" />
                    )}
                 </motion.div>
            </div>

            <div className="w-full h-24 flex items-center justify-center text-center">
                <p className="text-lg text-white/90 font-medium leading-relaxed max-w-md animate-pulse">
                    {status === 'connected' ? "I'm listening..." : "Connecting to Queryling..."}
                </p>
            </div>

            <div className="flex items-center gap-6">
                 <button onClick={() => setIsCameraOn(!isCameraOn)} className={`p-5 rounded-full backdrop-blur-md transition-all ${isCameraOn ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}><Video size={24} /></button>
                 <button onClick={handleDisconnect} className="p-8 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-xl hover:scale-105 transition-transform"><PhoneOff size={32} fill="currentColor" /></button>
                 <button onClick={() => setIsMuted(!isMuted)} className={`p-5 rounded-full backdrop-blur-md transition-all ${isMuted ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}>{isMuted ? <MicOff size={24} /> : <Mic size={24} />}</button>
            </div>
            
            <p className="text-white/30 text-xs mt-4">Microphone & Camera active for Queryling</p>
        </div>
    </div>
  );
};

export default LiveVoiceModal;
