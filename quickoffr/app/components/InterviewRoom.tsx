'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Video, VideoOff, Settings, LogOut, Sparkles, MessageSquare, Loader2 } from 'lucide-react';
import { useConversation } from '@elevenlabs/react';
import { INTERVIEWER_SYSTEM_PROMPT } from '@/lib/prompts/interviewer';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InterviewRoomProps {
  resumeText: string;
  jdText: string;
  jobTitle: string;
  persona: string;
  mode: string;
  onExit: () => void;
}

export default function InterviewRoom({ 
  resumeText, 
  jdText, 
  jobTitle, 
  persona, 
  mode, 
  onExit 
}: InterviewRoomProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [transcript, setTranscript] = useState<{role: string, text: string}[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ElevenLabs Hook
  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to ElevenLabs');
      setIsInitializing(false);
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs');
    },
    onMessage: (message: any) => {
      console.log('Message:', message);
      if (message.message) {
        setTranscript(prev => [...prev, { 
          role: message.role === 'user' ? 'candidate' : 'interviewer', 
          text: message.message 
        }]);
      }
    },
    onError: (error: string) => {
      console.error('ElevenLabs Error:', error);
      setIsInitializing(false);
    },
  });

  // Auto-scroll transcript
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  // Initializing ElevenLabs Session
  const startSession = useCallback(async () => {
    try {
      const response = await fetch('/api/elevenlabs/signed-url');
      const { signed_url } = await response.json();

      await conversation.startSession({
        signedUrl: signed_url,
        overrides: {
          agent: {
            prompt: {
              prompt: `${INTERVIEWER_SYSTEM_PROMPT}\n\nCONTEXT:\n- Role: ${jobTitle}\n- Persona: ${persona}\n- Mode: ${mode}\n- Resume: ${resumeText.substring(0, 2000)}\n- JD: ${jdText.substring(0, 1000)}`,
            },
            firstMessage: `Hello! I'm Lumi, your recruiter today. Before we begin, I need to verify some details. Could you tell me your name, the role and company you are targeting, and your total years of experience?`,
          },
        },
      });
    } catch (error) {
      console.error('Failed to start session:', error);
      setIsInitializing(false);
    }
  }, [conversation, jobTitle, persona, mode, resumeText, jdText]);

  // Initialize media devices and ElevenLabs
  useEffect(() => {
    const init = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        await startSession();
      } catch (err) {
        console.error("Error accessing media devices.", err);
        setIsInitializing(false);
      }
    };
    
    init();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      conversation.endSession();
    };
  }, []);

  // Handle media toggles
  useEffect(() => {
    if (stream) {
      stream.getAudioTracks().forEach(track => track.enabled = !isMuted);
    }
  }, [isMuted, stream]);

  useEffect(() => {
    if (stream) {
      stream.getVideoTracks().forEach(track => track.enabled = !isVideoOff);
    }
  }, [isVideoOff, stream]);

  const handleExit = () => {
    if (window.confirm('End the interview?')) {
      conversation.endSession();
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      onExit();
    }
  };

  return (
    <div className="min-h-screen bg-[#06060A] flex items-center justify-center p-4 sm:p-8 font-sans">
      {/* Main App Container */}
      <div className="relative w-full max-w-6xl h-[85vh] min-h-[600px] bg-[#0E0E14] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col">
        
        {/* Background ambient blobs */}
        <div className="absolute top-[-10%] left-[20%] w-[60%] h-[60%] rounded-full bg-purple-900/10 blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[130px] pointer-events-none" />
        
        {/* Top Text/Transcript Bubble */}
        <div className="pt-12 px-6 sm:px-16 relative z-10 w-full flex justify-center h-[200px]">
          <div 
            ref={scrollRef}
            className="w-full max-w-4xl bg-white/[0.03] border border-white/10 backdrop-blur-2xl p-6 rounded-[2rem] shadow-2xl relative overflow-y-auto no-scrollbar"
          >
            {transcript.length === 0 ? (
              <p className="text-slate-400 italic text-center py-4 animate-pulse">
                {isInitializing ? "Initializing secure connection..." : "Waiting for interview to begin..."}
              </p>
            ) : (
              <div className="space-y-4">
                {transcript.map((msg, i) => (
                  <div key={i} className={cn(
                    "flex flex-col",
                    msg.role === 'interviewer' ? "items-start" : "items-end"
                  )}>
                    <span className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">
                      {msg.role}
                    </span>
                    <p className={cn(
                      "max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed",
                      msg.role === 'interviewer' 
                        ? "bg-purple-500/10 text-purple-100 border border-purple-500/20" 
                        : "bg-white/5 text-slate-200 border border-white/10"
                    )}>
                      {msg.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center Glowing Hub (AI Avatar) */}
        <div className="flex-1 flex flex-col items-center justify-center relative z-10">
          <div className="relative w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center group cursor-default">
            {/* Outer revolving orbits */}
            <div className="absolute inset-[-10%] rounded-full border border-purple-500/10 animate-[spin_12s_linear_infinite]" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 80%)' }}></div>
            <div className="absolute inset-0 rounded-full border border-indigo-500/10 animate-[spin_8s_linear_infinite_reverse]" style={{ clipPath: 'polygon(0 20%, 100% 0, 100% 100%, 0 100%)' }}></div>
            
            {/* Glowing core shadow - pulses when AI speaks */}
            <div className={cn(
              "w-36 h-36 bg-gradient-to-tr from-purple-600 to-indigo-500 rounded-full blur-2xl opacity-30 absolute transition-all duration-500",
              conversation.status === 'connected' && iS_AI_SPEAKING(conversation) ? "scale-150 opacity-50" : "scale-100"
            )}></div>
            
            {/* Main center icon */}
            <div className="w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-tr from-[#25253A] to-[#363654] border border-white/10 rounded-full flex items-center justify-center relative z-20 shadow-[0_0_60px_rgba(139,92,246,0.15)] overflow-hidden">
               {isInitializing ? (
                 <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
               ) : (
                 <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-12 h-12 rounded-full border-[4px] transition-all duration-300",
                      conversation.status === 'connected' ? "border-indigo-400 shadow-[0_0_20px_rgba(129,140,248,0.5)]" : "border-slate-500"
                    )}></div>
                    <span className="text-[8px] uppercase tracking-tighter text-slate-500 mt-2">
                      {conversation.status}
                    </span>
                 </div>
               )}
            </div>
          </div>

          {/* Real-time Status Indicator */}
          <div className="mt-8 flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.02] border border-white/5">
             <div className={cn(
               "w-2 h-2 rounded-full",
               conversation.status === 'connected' ? "bg-emerald-500 animate-pulse" : "bg-red-500"
             )}></div>
             <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
               {conversation.status === 'connected' ? "Live Connection" : "Offline"}
             </span>
          </div>
        </div>

        {/* Bottom Left Camera PIP */}
        <div className="absolute bottom-[100px] left-6 sm:left-10 w-[160px] sm:w-[220px] aspect-[4/3] bg-[#12121A] rounded-2xl border border-white/10 overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.6)] z-20 group transition-all duration-300 hover:border-white/20">
           {isVideoOff ? (
             <div className="w-full h-full flex flex-col items-center justify-center bg-[#1A1A24]">
                <VideoOff className="w-5 h-5 text-slate-600 mb-2" />
                <p className="text-slate-600 text-[10px] font-medium uppercase tracking-widest">Off</p>
             </div>
           ) : (
             <div className="w-full h-full relative overflow-hidden bg-black">
                 <video 
                   ref={videoRef}
                   autoPlay 
                   playsInline 
                   muted 
                   className="w-full h-full object-cover transform scale-x-[-1]"
                 />
                 <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay pointer-events-none"></div>
             </div>
           )}
        </div>

        {/* Control Bar */}
        <div className="relative z-20 w-full h-20 bg-white/[0.01] border-t border-white/5 backdrop-blur-3xl px-6 sm:px-10 flex items-center justify-between">
            
            <div className="flex items-center gap-3">
               <div className="flex flex-col">
                  <span className="text-white font-semibold text-sm tracking-wide capitalize">{persona.replace('_', ' ')}</span>
                  <span className="text-slate-400 text-xs">Interviewing for <span className="text-indigo-400">{jobTitle}</span></span>
               </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 absolute left-1/2 -translate-x-1/2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border",
                    isMuted 
                      ? "bg-red-500/10 text-red-500 border-red-500/20" 
                      : "bg-white/5 text-white border-white/10 hover:bg-white/10"
                  )}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                
                <button
                  onClick={() => setIsVideoOff(!isVideoOff)}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border",
                    isVideoOff 
                      ? "bg-red-500/10 text-red-500 border-red-500/20" 
                      : "bg-white/5 text-white border-white/10 hover:bg-white/10"
                  )}
                >
                  {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
                
                <div className="hidden sm:block w-px h-6 bg-white/10 mx-1"></div>
                
                <button 
                  className="hidden sm:flex w-12 h-12 rounded-full items-center justify-center bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white transition-all duration-300"
                >
                  <Settings className="w-5 h-5" />
                </button>
            </div>

            <button
               onClick={handleExit}
               className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 transition-all duration-300 text-sm font-semibold"
            >
               <LogOut className="w-4 h-4" />
               <span className="hidden sm:inline">End Session</span>
            </button>
        </div>
      </div>
    </div>
  );
}

// Helper to check if AI is speaking based on status
function iS_AI_SPEAKING(conversation: any) {
  // In a real implementation with ElevenLabs React SDK, 
  // you might use its built-in feedback or a ref to the volume.
  // For now we'll use a placeholder logic that would be backed by actual SDK state.
  return conversation.isSpeaking || false; 
}
