'use client';

import React, { useState } from 'react';
import { Mic, MicOff, Video, VideoOff, Phone, Settings, Copy, Check } from 'lucide-react';

interface InterviewRoomProps {
  resumeName: string;
  jobTitle: string;
  onExit: () => void;
}

export default function InterviewRoom({ resumeName, jobTitle, onExit }: InterviewRoomProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [copied, setCopied] = useState(false);
  const meetCode = 'abc-defg-hij';

  const copyMeetCode = () => {
    navigator.clipboard.writeText(meetCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExit = () => {
    if (window.confirm('End the interview?')) {
      onExit();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-white font-semibold">{jobTitle}</h1>
          <p className="text-slate-400 text-sm">{resumeName}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={copyMeetCode}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy code'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 p-4">
          <div className="w-full h-full max-w-4xl flex flex-col items-center justify-center">
            {/* Main Video */}
            <div className="w-full aspect-video bg-slate-800 rounded-xl overflow-hidden shadow-2xl flex items-center justify-center relative">
              {isVideoOff ? (
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold text-white">You</span>
                  </div>
                  <p className="text-slate-400">Camera is off</p>
                </div>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                  <p className="text-slate-300">Camera Feed</p>
                </div>
              )}

              {/* Participant Panel - Bottom Right */}
              <div className="absolute bottom-4 right-4 w-32 h-32 bg-slate-700 rounded-lg overflow-hidden shadow-lg flex items-center justify-center border border-slate-600">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mb-2">
                    <span className="text-sm font-bold text-white">AI</span>
                  </div>
                  <p className="text-xs text-slate-300 text-center">Interview Bot</p>
                </div>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="flex gap-4 mt-8">
              {/* Mute Button */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  isMuted
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }`}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>

              {/* Video Button */}
              <button
                onClick={() => setIsVideoOff(!isVideoOff)}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  isVideoOff
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }`}
              >
                {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
              </button>

              {/* Settings Button */}
              <button className="w-14 h-14 rounded-full flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-slate-200 transition-all">
                <Settings className="w-6 h-6" />
              </button>

              {/* End Call Button */}
              <button
                onClick={handleExit}
                className="w-14 h-14 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-700 text-white transition-all"
              >
                <Phone className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-80 bg-slate-800 border-l border-slate-700 p-6 overflow-y-auto">
          <h2 className="text-white font-semibold mb-6">Interview Details</h2>

          {/* Interview Info */}
          <div className="space-y-4 mb-8">
            <div>
              <p className="text-slate-400 text-sm mb-2">Meeting Code</p>
              <p className="text-white font-mono text-lg">{meetCode}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-2">Duration</p>
              <p className="text-white">45 minutes</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-2">Status</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-green-400">Active</p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-700 my-6"></div>

          {/* Notes Section */}
          <div>
            <p className="text-white font-semibold mb-4">Notes</p>
            <div className="bg-slate-700 rounded-lg p-4 h-40 resize-none focus:outline-none text-slate-200 text-sm">
              <textarea
                placeholder="Add interview notes..."
                className="w-full h-full bg-transparent resize-none focus:outline-none text-slate-200"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
