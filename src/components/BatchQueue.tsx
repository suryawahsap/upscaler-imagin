import React from 'react';
import { QueueItem } from '../types';
import { formatBytes } from '../services/imageProcessing';
import { 
  Play, 
  Archive, 
  Trash2, 
  Eye, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  Layers,
  Sparkles,
  SlidersHorizontal,
  StopCircle
} from 'lucide-react';

interface BatchQueueProps {
  items: QueueItem[];
  isProcessing: boolean;
  onProcessAll: () => void;
  onStopProcessing: () => void;
  onProcessSingle: (id: string) => void;
  onDownloadZip: () => void;
  onDownloadSingle: (item: QueueItem) => void;
  onPreview: (item: QueueItem) => void;
  onRemoveItem: (id: string) => void;
  onClearQueue: () => void;
  isZipping?: boolean;
  zipProgress?: { percent: number; message: string };
}

export const BatchQueue: React.FC<BatchQueueProps> = ({
  items,
  isProcessing,
  onProcessAll,
  onStopProcessing,
  onProcessSingle,
  onDownloadZip,
  onDownloadSingle,
  onPreview,
  onRemoveItem,
  onClearQueue,
  isZipping = false,
  zipProgress,
}) => {
  const totalCount = items.length;
  const completedCount = items.filter((i) => i.status === 'done').length;
  const pendingCount = items.filter((i) => i.status === 'idle').length;
  const hasCompleted = completedCount > 0;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Antrean Berkas Batch
              <span className="text-xs px-2 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                {items.length} Berkas
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {completedCount} dari {totalCount} selesai diproses
            </p>
          </div>
        </div>

        {/* Batch Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Process All Button */}
          {isProcessing ? (
            <button
              id="btn-stop-batch"
              type="button"
              onClick={onStopProcessing}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-200 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 transition-colors shadow-sm"
            >
              <StopCircle className="w-4 h-4 text-rose-400" />
              <span>Hentikan Proses</span>
            </button>
          ) : (
            <button
              id="btn-process-all"
              type="button"
              disabled={items.length === 0 || pendingCount === 0}
              onClick={onProcessAll}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-md shadow-indigo-600/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.01]"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Proses Semua ({pendingCount || totalCount})</span>
            </button>
          )}

          {/* Bulk Download as ZIP Button */}
          <button
            id="btn-download-zip"
            type="button"
            disabled={!hasCompleted || isZipping}
            onClick={onDownloadZip}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-200 bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-700/60 shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.01]"
            title="Unduh seluruh gambar yang selesai dalam satu arsip ZIP"
          >
            {isZipping ? (
              <>
                <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                <span>Membuat ZIP ({zipProgress?.percent || 0}%)...</span>
              </>
            ) : (
              <>
                <Archive className="w-4 h-4 text-emerald-400" />
                <span>Unduh Sekaligus (.ZIP)</span>
                {completedCount > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                    {completedCount}
                  </span>
                )}
              </>
            )}
          </button>

          {/* Clear Queue */}
          {items.length > 0 && (
            <button
              id="btn-clear-queue"
              type="button"
              disabled={isProcessing}
              onClick={onClearQueue}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 border border-slate-800 transition-colors disabled:opacity-40"
              title="Bersihkan Semua Antrean"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Zip Progress Indicator Bar if active */}
      {isZipping && zipProgress && (
        <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-xl p-3 flex flex-col gap-1.5 animate-pulse">
          <div className="flex justify-between text-xs text-emerald-300 font-medium">
            <span>{zipProgress.message}</span>
            <span className="font-mono font-bold">{zipProgress.percent}%</span>
          </div>
          <div className="w-full h-1.5 bg-emerald-950 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-200"
              style={{ width: `${zipProgress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="flex flex-col gap-2.5 max-h-[520px] overflow-y-auto pr-1">
        {items.map((item, index) => {
          const isDone = item.status === 'done';
          const isErr = item.status === 'error';
          const isProc = item.status === 'processing' || item.status === 'loading_model';
          const targetW = item.upscaledWidth || item.originalWidth * item.config.scale;
          const targetH = item.upscaledHeight || item.originalHeight * item.config.scale;

          return (
            <div
              key={item.id}
              id={`queue-item-${item.id}`}
              className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                isProc
                  ? 'bg-indigo-950/30 border-indigo-500/50 ring-1 ring-indigo-500/20 shadow-md shadow-indigo-500/5'
                  : isDone
                  ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  : isErr
                  ? 'bg-rose-950/20 border-rose-900/60'
                  : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Left Info & Thumbnail */}
              <div className="flex items-center gap-3 w-full sm:w-auto overflow-hidden">
                {/* Thumbnail */}
                <div
                  className="w-14 h-14 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex-shrink-0 cursor-pointer relative group"
                  onClick={() => onPreview(item)}
                  title="Klik untuk pratinjau detail"
                >
                  <img
                    src={item.upscaledUrl || item.originalUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Eye className="w-4 h-4 text-white" />
                  </div>
                  {isDone && (
                    <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
                  )}
                </div>

                {/* Text Metadata */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="text-xs font-bold text-white truncate max-w-[220px]" title={item.name}>
                      {item.name}
                    </h4>
                    {/* Scale Badge */}
                    <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {item.config.scale}x
                    </span>
                  </div>

                  {/* Resolution transformation */}
                  <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                    <span>{item.originalWidth}×{item.originalHeight}</span>
                    <ArrowRight className="w-3 h-3 text-slate-600" />
                    <span className={`font-semibold ${isDone ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {targetW}×{targetH}
                    </span>
                    <span className="text-slate-600">&bull;</span>
                    <span>{formatBytes(item.originalSize)}</span>
                    {item.upscaledSize && (
                      <span className="text-slate-400 font-semibold">
                        &rarr; {formatBytes(item.upscaledSize)}
                      </span>
                    )}
                  </div>

                  {/* Parameters tag */}
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                    <span className="text-slate-400">{item.config.model.replace('realesr', '')}</span>
                    <span>&bull;</span>
                    <span>Noise: {item.config.denoise}%</span>
                    <span>&bull;</span>
                    <span className="uppercase text-slate-400 font-medium">
                      {item.config.format.split('/')[1]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Center Status / Progress */}
              <div className="w-full sm:w-48 flex flex-col justify-center">
                {isProc && (
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-indigo-300 font-medium truncate max-w-[130px]">{item.stage}</span>
                      <span className="font-mono text-indigo-400 font-bold">{item.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 transition-all duration-150"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {isDone && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>Upscale Selesai</span>
                  </div>
                )}

                {item.status === 'idle' && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock className="w-4 h-4 flex-shrink-0 text-slate-500" />
                    <span>Menunggu Proses</span>
                  </div>
                )}

                {isErr && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium truncate">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                    <span className="truncate">{item.error || 'Gagal'}</span>
                  </div>
                )}
              </div>

              {/* Right Action Buttons */}
              <div className="flex items-center gap-1.5 self-end sm:self-center">
                {/* Preview Button (Pratinjau Sebelum Mengunduh) */}
                <button
                  id={`btn-preview-${item.id}`}
                  type="button"
                  onClick={() => onPreview(item)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 transition-colors"
                  title="Pratinjau Interaktif (Bandingkan Sebelum/Sesudah)"
                >
                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Pratinjau</span>
                </button>

                {/* Download Single Image */}
                {isDone ? (
                  <button
                    id={`btn-download-single-${item.id}`}
                    type="button"
                    onClick={() => onDownloadSingle(item)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-200 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/80 transition-colors"
                    title="Unduh Berkas Ini"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Unduh</span>
                  </button>
                ) : (
                  <button
                    id={`btn-process-single-${item.id}`}
                    type="button"
                    disabled={isProcessing}
                    onClick={() => onProcessSingle(item.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-indigo-200 bg-indigo-950/70 hover:bg-indigo-900/80 border border-indigo-800/80 transition-colors disabled:opacity-40"
                    title="Proses berkas ini sekarang"
                  >
                    <Play className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
                    <span className="hidden sm:inline">Proses</span>
                  </button>
                )}

                {/* Remove from queue */}
                <button
                  id={`btn-remove-${item.id}`}
                  type="button"
                  disabled={isProcessing && isProc}
                  onClick={() => onRemoveItem(item.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors disabled:opacity-30"
                  title="Hapus dari antrean"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
