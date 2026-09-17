import React, { useState } from 'react';
import { HistoryItem, QueueItem } from '../types';
import { formatBytes } from '../services/imageProcessing';
import { 
  X, 
  History, 
  Trash2, 
  Download, 
  Eye, 
  Search, 
  ArrowRight, 
  Calendar, 
  Sliders, 
  Sparkles 
} from 'lucide-react';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  historyItems: HistoryItem[];
  onDeleteHistoryItem: (id: string) => void;
  onClearHistory: () => void;
  onPreviewHistoryItem: (item: HistoryItem) => void;
  onDownloadHistoryItem: (item: HistoryItem) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  historyItems,
  onDeleteHistoryItem,
  onClearHistory,
  onPreviewHistoryItem,
  onDownloadHistoryItem,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredItems = historyItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.config.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg h-full bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Riwayat Pemrosesan
                <span className="text-xs px-2 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                  {historyItems.length}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Berkas yang berhasil di-upscale sebelumnya</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {historyItems.length > 0 && (
              <button
                id="btn-clear-all-history"
                type="button"
                onClick={onClearHistory}
                className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded hover:bg-rose-950/40 border border-transparent hover:border-rose-900 transition-colors"
                title="Bersihkan Seluruh Riwayat"
              >
                Hapus Semua
              </button>
            )}
            <button
              id="btn-close-history"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Tutup Riwayat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {historyItems.length > 0 && (
          <div className="p-4 border-b border-slate-800/80 bg-slate-900/40">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama berkas atau model..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {historyItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500">
              <History className="w-12 h-12 stroke-1 mb-3 text-slate-600" />
              <p className="text-sm font-semibold text-slate-400">Belum ada riwayat</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Gambar yang Anda proses dengan Real-ESRGAN akan otomatis dicatat di sini untuk diakses kembali.
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              Tidak ada hasil pencarian untuk "{searchQuery}"
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                id={`history-item-${item.id}`}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex flex-col gap-2.5 transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <img
                      src={item.thumbnailUrl || item.upscaledUrl}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover bg-slate-950 border border-slate-800 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate" title={item.name}>
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 mt-0.5">
                        <span>{item.originalWidth}×{item.originalHeight}</span>
                        <ArrowRight className="w-3 h-3 text-indigo-400" />
                        <span className="font-semibold text-emerald-400">
                          {item.upscaledWidth}×{item.upscaledHeight}
                        </span>
                        <span className="px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold text-[9px]">
                          {item.config.scale}x
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.timestamp).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span>&bull;</span>
                        <span>Noise: {item.config.denoise}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onPreviewHistoryItem(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Lihat Pratinjau"
                    >
                      <Eye className="w-4 h-4 text-indigo-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDownloadHistoryItem(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                      title="Unduh Berkas"
                    >
                      <Download className="w-4 h-4 text-emerald-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteHistoryItem(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Hapus dari Riwayat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
