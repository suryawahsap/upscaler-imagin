import React from 'react';
import { Sparkles, History, HelpCircle, Layers, CheckCircle2, RefreshCw } from 'lucide-react';

interface HeaderProps {
  queueCount: number;
  completedCount: number;
  historyCount: number;
  onOpenHistory: () => void;
  onOpenGuide: () => void;
  isProcessing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  queueCount,
  completedCount,
  historyCount,
  onOpenHistory,
  onOpenGuide,
  isProcessing,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/10">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Real-ESRGAN
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  AI Upscaler
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Real-ESRGAN ONNX Engine · WASM · 100% Lokal
            </p>
          </div>
        </div>

        {/* Live Stats & Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Status Badge */}
          {queueCount > 0 && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
              {isProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                  <span>Memproses... ({completedCount}/{queueCount})</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{completedCount} dari {queueCount} selesai</span>
                </>
              )}
            </div>
          )}

          {/* Guide Button */}
          <button
            id="btn-guide-toggle"
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-colors"
            title="Panduan & Tips Parameter"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Panduan</span>
          </button>

          {/* History Button */}
          <button
            id="btn-history-toggle"
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-all"
            title="Buka Riwayat Pemrosesan"
          >
            <History className="w-4 h-4" />
            <span>Riwayat</span>
            {historyCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/20 text-[11px] font-bold">
                {historyCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
