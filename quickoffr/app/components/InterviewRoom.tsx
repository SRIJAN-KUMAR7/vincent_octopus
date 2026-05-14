'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, Settings, LogOut, Sparkles } from 'lucide-react';

interface InterviewRoomProps {
  resumeName: string;
  jobTitle: string;
  onExit: () => void;
}

export default function InterviewRoom({ resumeName, jobTitle, onExit }: InterviewRoomProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  // Initialize media devices
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    
    const initMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        setStream(mediaStream);
        activeStream = mediaStream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error accessing media devices.", err);
      }
    };
    
    initMedia();

    return () => {
      if (activeStream) {
         activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Attach stream to video tag whenever videoRef mounts or stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, isVideoOff]); // re-run if isVideoOff changes because the video element mounts/unmounts

  // Handle mute toggle
  useEffect(() => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted, stream]);

  // Handle video toggle
  useEffect(() => {
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoOff;
      });
    }
  }, [isVideoOff, stream]);

  const handleExit = () => {
    if (window.confirm('End the interview?')) {
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
        
        {/* Light sparkles in background */}
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white/40 rounded-full blur-[1px] animate-pulse shadow-[0_0_10px_white]"></div>
        <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-purple-400/40 rounded-full blur-[2px] animate-pulse shadow-[0_0_15px_purple]"></div>
        <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-indigo-400/40 rounded-full blur-[1px] animate-pulse shadow-[0_0_12px_indigo]"></div>

        {/* Top Text Bubble */}
        <div className="pt-12 px-6 sm:px-16 relative z-10 w-full flex justify-center">
          <div className="max-w-4xl bg-white/[0.03] border border-white/10 backdrop-blur-2xl p-6 sm:p-8 rounded-[2rem] shadow-2xl relative transition-all duration-500 hover:bg-white/[0.04]">
            <p className="text-slate-200 text-lg sm:text-xl leading-relaxed font-light">
              Hi there, welcome, I'm the AI Interviewer, and I'll be conducting your interview for the <span className="text-purple-400 font-medium">{jobTitle}</span> role. Thank you for taking the time to speak with me. Let's get started: Can you share a little about yourself and your background based on the <span className="text-indigo-400 font-medium">{resumeName}</span> you provided?
            </p>
            {/* Typing indicator cursor */}
            <div className="inline-block w-2 sm:w-3 h-5 sm:h-6 bg-purple-500/70 ml-2 animate-[pulse_1s_ease-in-out_infinite] align-middle rounded-sm"></div>
          </div>
        </div>

        {/* Center Glowing Hub (AI Avatar) */}
        <div className="flex-1 flex items-center justify-center relative z-10">
          <div className="relative w-64 h-64 flex items-center justify-center group cursor-default">
            {/* Outer revolving orbits */}
            <div className="absolute inset-[-10%] rounded-full border border-purple-500/10 animate-[spin_12s_linear_infinite]" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 80%)' }}></div>
            <div className="absolute inset-0 rounded-full border border-indigo-500/10 animate-[spin_8s_linear_infinite_reverse]" style={{ clipPath: 'polygon(0 20%, 100% 0, 100% 100%, 0 100%)' }}></div>
            
            {/* Glowing core shadow */}
            <div className="w-36 h-36 bg-gradient-to-tr from-purple-600 to-indigo-500 rounded-full blur-2xl opacity-30 absolute animate-pulse"></div>
            
            {/* Main center icon / shape replicating the image's geometry */}
            <div className="w-40 h-40 bg-gradient-to-tr from-[#25253A] to-[#363654] border border-white/10 rounded-full flex items-center justify-center relative z-20 shadow-[0_0_60px_rgba(139,92,246,0.15)] group-hover:scale-105 transition-transform duration-700 overflow-hidden block">
               
               {/* Center solid circle */}
               <div className="w-14 h-14 rounded-full bg-transparent border-[6px] border-indigo-200/90 shadow-[0_0_20px_rgba(199,210,254,0.3)] z-10 outline outline-[4px] outline-transparent"></div>
               
               {/* Surrounding C-shapes / semi-circles */}
               <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-10 border-[6px] border-t-0 border-white/90 rounded-b-full opacity-80 shadow-[0_0_10px_rgba(255,255,255,0.2)]"></div>
               <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-10 h-10 border-[6px] border-b-0 border-white/90 rounded-t-full opacity-80 shadow-[0_0_10px_rgba(255,255,255,0.2)]"></div>
               <div className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 border-[6px] border-l-0 border-white/90 rounded-r-full opacity-80 shadow-[0_0_10px_rgba(255,255,255,0.2)]"></div>
               <div className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 border-[6px] border-r-0 border-white/90 rounded-l-full opacity-80 shadow-[0_0_10px_rgba(255,255,255,0.2)]"></div>
               
               {/* Inner glare/gradient overlay */}
               <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 rounded-full pointer-events-none"></div>
            </div>
            
            {/* Orbiting particles */}
            <div className="absolute w-full h-full animate-[spin_6s_linear_infinite]">
              <div className="absolute top-2 left-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]"></div>
            </div>
            <div className="absolute w-full h-full animate-[spin_10s_linear_infinite_reverse]">
              <div className="absolute bottom-4 right-8 w-2 h-2 bg-purple-300 rounded-full shadow-[0_0_10px_#d8b4fe]"></div>
            </div>
          </div>
        </div>

        {/* Bottom Left Camera PIP */}
        <div className="absolute bottom-[100px] left-6 sm:left-10 w-[200px] sm:w-[260px] aspect-[4/3] bg-[#12121A] rounded-2xl border border-white/10 overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.6)] z-20 group transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.7)] hover:border-white/20">
           {isVideoOff ? (
             <div className="w-full h-full flex flex-col items-center justify-center bg-[#1A1A24]">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <VideoOff className="w-5 h-5 text-slate-500" />
                </div>
                <p className="text-slate-500 text-xs font-medium">Camera Disabled</p>
             </div>
           ) : (
             <div className="w-full h-full relative overflow-hidden bg-black">
                 {/* Real Camera Feed */}
                 <video 
                   ref={videoRef}
                   autoPlay 
                   playsInline 
                   muted 
                   className="w-full h-full object-cover transform scale-x-[-1]"
                 />
                 {/* Subtle noise over real feed */}
                 <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay pointer-events-none"></div>
             </div>
           )}
           
           {isMuted && (
             <div className="absolute top-3 right-3 w-7 h-7 bg-red-500/20 backdrop-blur-md rounded-full flex items-center justify-center border border-red-500/30">
                <MicOff className="w-3.5 h-3.5 text-red-500" />
             </div>
           )}
        </div>

        <div className="relative z-20 w-full h-20 bg-white/[0.01] border-t border-white/5 backdrop-blur-2xl px-6 sm:px-10 flex items-center justify-between">
            
            <div className="flex items-center gap-3">
               <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                  <Sparkles className="w-4 h-4 text-white" />
               </div>
               <div className="flex flex-col">
                  <span className="text-white font-semibold text-sm tracking-wide">AI Interviewer</span>
                  <span className="text-slate-400 text-xs">Interviewing for <span className="text-slate-300 font-medium">{jobTitle}</span></span>
               </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 absolute left-1/2 -translate-x-1/2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border ${
                    isMuted 
                      ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]' 
                      : 'bg-white/5 text-white border-white/10 hover:bg-white/10 hover:border-white/20 hover:scale-105'
                  }`}
                  title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                
                <button
                  onClick={() => setIsVideoOff(!isVideoOff)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border ${
                    isVideoOff 
                      ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]' 
                      : 'bg-white/5 text-white border-white/10 hover:bg-white/10 hover:border-white/20 hover:scale-105'
                  }`}
                  title={isVideoOff ? "Turn on Camera" : "Turn off Camera"}
                >
                  {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
                
                <div className="w-px h-6 bg-white/10 mx-1"></div>
                
                <button 
                  className="w-12 h-12 rounded-full flex items-center justify-center bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all duration-300"
                  title="Settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
            </div>

            {/* Right Action */}
            <button
               onClick={handleExit}
               className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 transition-all duration-300 text-sm font-semibold group hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]"
            >
               <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
               <span className="hidden sm:inline">Leave interview</span>
               <span className="sm:hidden">Leave</span>
            </button>
        </div>

      </div>
    </div>
  );
}
