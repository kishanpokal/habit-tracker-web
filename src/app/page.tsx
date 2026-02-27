"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AuthGatePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // State for the progress bar animation
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate smooth progress loading over 2 seconds
    const duration = 2000;
    const intervalTime = 20;
    const steps = duration / intervalTime;
    let currentStep = 0;

    const progressInterval = setInterval(() => {
      currentStep++;
      setProgress(Math.min((currentStep / steps) * 100, 100));
    }, intervalTime);

    // Routing logic after minimum delay
    const timer = setTimeout(() => {
      if (loading) return;
      
      if (!user || !user.emailVerified) {
        router.replace("/login");
        return;
      }
      
      router.replace("/dashboard");
    }, duration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timer);
    };
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center overflow-hidden relative selection:bg-indigo-500/30">
      
      {/* ==================== AMBIENT BACKGROUND ==================== */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-indigo-600/20 blur-[120px] mix-blend-screen animate-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-purple-600/20 blur-[120px] mix-blend-screen animate-blob animation-delay-2000" />
        <div className="absolute top-[20%] left-[60%] w-[30vw] h-[30vw] rounded-full bg-pink-600/20 blur-[100px] mix-blend-screen animate-blob animation-delay-4000" />
        
        {/* Subtle grid overlay for texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      </div>

      {/* ==================== MAIN GLASS CARD ==================== */}
      <div className="relative z-10 w-full max-w-md px-6 animate-reveal">
        <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.05] rounded-[2.5rem] p-10 sm:p-12 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
          
          {/* Card subtle inner glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* ==================== ANIMATED ICON ==================== */}
          <div className="relative mb-8">
            {/* Outer pulsing rings */}
            <div className="absolute inset-0 rounded-3xl bg-indigo-500/20 animate-ping-slow" />
            <div className="absolute inset-0 rounded-3xl bg-purple-500/20 animate-ping-slower" />
            
            {/* Core Icon Box */}
            <div className="relative w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-float">
              <svg 
                className="w-10 h-10 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2.5} 
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
                  className="animate-spin-slow origin-center"
                />
              </svg>
            </div>
          </div>

          {/* ==================== TYPOGRAPHY ==================== */}
          <h1 className="text-3xl font-black tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 animate-fade-in">
            Habit Tracker
          </h1>
          <p className="text-gray-400 font-medium mb-10 text-sm sm:text-base animate-fade-in-delay">
            Preparing your workspace...
          </p>

          {/* ==================== PROGRESS BAR ==================== */}
          <div className="w-full space-y-3 animate-fade-in-delay-2">
            <div className="h-1.5 w-full bg-gray-800/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full relative"
                style={{ 
                  width: `${progress}%`,
                  transition: 'width 50ms linear'
                }}
              >
                {/* Shine effect on progress bar */}
                <div className="absolute top-0 right-0 bottom-0 w-10 bg-gradient-to-r from-transparent to-white/30 blur-[2px]" />
              </div>
            </div>
            
            {/* Status indicators */}
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-semibold text-gray-500 tracking-wider uppercase">
                {progress < 100 ? 'Authenticating' : 'Redirecting'}
              </span>
              <span className="text-xs font-bold text-gray-400">
                {Math.round(progress)}%
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* ==================== CUSTOM ANIMATIONS ==================== */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }

        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0; }
        }

        @keyframes ping-slower {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.8); opacity: 0; }
        }

        @keyframes reveal {
          0% { opacity: 0; transform: translateY(30px) scale(0.95); filter: blur(10px); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0px); }
        }

        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .animate-blob {
          animation: blob 10s infinite ease-in-out;
        }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }

        .animate-float {
          animation: float 4s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }

        .animate-ping-slow {
          animation: ping-slow 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        .animate-ping-slower {
          animation: ping-slower 3.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          animation-delay: 0.5s;
        }

        .animate-reveal {
          animation: reveal 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out 0.2s forwards;
          opacity: 0;
        }

        .animate-fade-in-delay {
          animation: fade-in 0.8s ease-out 0.4s forwards;
          opacity: 0;
        }

        .animate-fade-in-delay-2 {
          animation: fade-in 0.8s ease-out 0.6s forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}