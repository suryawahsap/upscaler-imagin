import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { QueueItem, UpscaleConfig, HistoryItem } from './types';
import { upscaleImage, getImageDimensions } from './services/imageProcessing';
import { downloadBatchZip, downloadSingleImage, getDownloadFileName } from './services/zipService';
import { 
  getHistory, 
  saveItemToHistory, 
  deleteHistoryItem, 
  clearAllHistory 
} from './services/historyStorage';
import { SampleImage } from './data/sampleImages';

import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { SettingsPanel } from './components/SettingsPanel';
import { BatchQueue } from './components/BatchQueue';
import { InteractivePreviewModal } from './components/InteractivePreviewModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { GuideModal } from './components/GuideModal';
import { Image as ImageIcon } from 'lucide-react';

export default function App() {
  // Global settings state
  // FIX: sharpen default diturunkan dari 55 → 30.
  // Nilai 55 terlalu agresif untuk Laplacian kernel — menghasilkan halo/ringing
  // yang jelas terutama pada gambar 4x. Nilai 30 memberikan ketajaman yang terlihat
  // tanpa artefak halo pada mayoritas input.
  const [config, setConfig] = useState<UpscaleConfig>({
    scale: 4,
    model: 'realesrgan-x4plus-anime',
    denoise: 30,
    sharpen: 30,
    format: 'image/png',
    quality: 0.95,
  });

  // Batch queue state
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const stopRequestedRef = useRef(false);

  // Modals & Drawers state
  const [activePreviewItem, setActivePreviewItem] = useState<QueueItem | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);

  // ZIP packaging state
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState<{ percent: number; message: string }>({
    percent: 0,
    message: '',
  });

  // Load history on mount
  useEffect(() => {
    setHistoryItems(getHistory());
  }, []);

  // FIX: Memory leak — cleanup object URLs on unmount.
  //
  // Bug sebelumnya: useEffect(() => { return () => { queue.forEach(...) } }, [])
  // Empty deps [] membuat closure menangkap nilai awal queue (=[]).
  // Saat unmount, queue di dalam closure tetap [], tidak ada URL yang di-revoke.
  //
  // Fix: gunakan useRef sebagai "live reference" ke queue terkini.
  // queueRef selalu up-to-date, tapi cleanup closure tidak perlu update
  // (hanya dijalankan saat unmount, bukan setiap render).
  const queueRef = useRef<QueueItem[]>([]);
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    return () => {
      // Pada unmount, queueRef.current berisi queue terakhir yang valid
      queueRef.current.forEach((item) => {
        if (item.originalUrl?.startsWith('blob:')) URL.revokeObjectURL(item.originalUrl);
        if (item.upscaledUrl?.startsWith('blob:')) URL.revokeObjectURL(item.upscaledUrl);
      });
    };
  }, []); // ✅ empty deps tetap benar karena pakai ref, bukan closure langsung

  // Add files to queue
  const handleFilesSelected = async (files: File[]) => {
    const newItems: QueueItem[] = [];

    for (const file of files) {
      const url = URL.createObjectURL(file);
      try {
        const { width, height } = await getImageDimensions(url);
        const nativeFormat =
          file.type === 'image/jpeg' || file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg')
            ? 'image/jpeg'
            : file.type === 'image/webp' || file.name.toLowerCase().endsWith('.webp')
            ? 'image/webp'
            : file.type === 'image/png' || file.name.toLowerCase().endsWith('.png')
            ? 'image/png'
            : config.format;

        newItems.push({
          id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
          file,
          name: file.name,
          originalUrl: url,
          originalWidth: width,
          originalHeight: height,
          originalSize: file.size,
          status: 'idle',
          progress: 0,
          stage: 'Menunggu proses...',
          config: { 
            ...config,
            format: nativeFormat,
          },
        });
      } catch (err) {
        console.error('Gagal membaca gambar:', file.name, err);
      }
    }

    setQueue((prev) => [...prev, ...newItems]);
  };

  // Add sample image to queue
  const handleSampleSelected = async (sample: SampleImage) => {
    try {
      const res = await fetch(sample.url);
      const blob = await res.blob();
      const file = new File([blob], sample.name, { type: 'image/png' });
      const url = sample.url;

      const newItem: QueueItem = {
        id: 'sample_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
        file,
        name: sample.name,
        originalUrl: url,
        originalWidth: sample.width,
        originalHeight: sample.height,
        originalSize: blob.size,
        status: 'idle',
        progress: 0,
        stage: 'Menunggu proses...',
        config: { ...config },
      };

      setQueue((prev) => [...prev, newItem]);
    } catch (e) {
      console.error('Gagal memuat sampel:', e);
    }
  };

  // Apply current settings to all existing items in queue
  const handleApplySettingsToAll = () => {
    setQueue((prev) =>
      prev.map((item) => ({
        ...item,
        config: { ...config },
        status: (item.status === 'processing' || item.status === 'loading_model') ? item.status : 'idle',
      }))
    );
  };

  // Process a single item
  const processItem = async (targetId: string, currentQueueState = queue): Promise<boolean> => {
    const item = currentQueueState.find((i) => i.id === targetId);
    if (!item) return false;

    setQueue((prev) =>
      prev.map((i) =>
        i.id === targetId
          ? { ...i, status: 'processing', progress: 5, stage: 'Memulai pipeline upscale...' }
          : i
      )
    );

    try {
      const result = await upscaleImage(
        item.originalUrl,
        item.config,
        (progress, stage) => {
          setQueue((prev) =>
            prev.map((i) =>
              i.id === targetId ? { ...i, progress, stage } : i
            )
          );
        }
      );

      const processedItem: QueueItem = {
        ...item,
        status: 'done',
        progress: 100,
        stage: 'Selesai!',
        upscaledUrl: result.dataUrl,
        upscaledBlob: result.blob,
        upscaledWidth: result.width,
        upscaledHeight: result.height,
        upscaledSize: result.size,
        processedAt: Date.now(),
      };

      setQueue((prev) =>
        prev.map((i) => (i.id === targetId ? processedItem : i))
      );

      const savedHist = await saveItemToHistory(processedItem);
      if (savedHist) {
        setHistoryItems(getHistory());
      }

      return true;
    } catch (error: any) {
      console.error('Upscale error:', error);
      setQueue((prev) =>
        prev.map((i) =>
          i.id === targetId
            ? { ...i, status: 'error', progress: 0, error: error?.message || 'Gagal memproses gambar' }
            : i
        )
      );
      return false;
    }
  };

  // Process all items in batch queue sequentially
  const handleProcessAll = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    stopRequestedRef.current = false;

    const currentQueue = [...queue];
    const itemsToProcess = currentQueue.filter((i) => i.status === 'idle' || i.status === 'error');

    let completedAny = false;

    for (const item of itemsToProcess) {
      if (stopRequestedRef.current) break;
      const success = await processItem(item.id, currentQueue);
      if (success) completedAny = true;
    }

    setIsProcessing(false);

    if (completedAny && !stopRequestedRef.current) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#6366f1', '#06b6d4', '#10b981'],
        });
      } catch {
        // Safe fallback
      }
    }
  };

  // Stop / pause batch queue
  const handleStopProcessing = () => {
    stopRequestedRef.current = true;
    setIsProcessing(false);
    setQueue((prev) =>
      prev.map((i) => (i.status === 'processing' ? { ...i, status: 'idle', stage: 'Dihentikan' } : i))
    );
  };

  // Process single item trigger
  const handleProcessSingle = async (id: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    stopRequestedRef.current = false;
    await processItem(id);
    setIsProcessing(false);
  };

  // Remove single item from queue
  const handleRemoveItem = (id: string) => {
    setQueue((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target?.originalUrl?.startsWith('blob:')) URL.revokeObjectURL(target.originalUrl);
      if (target?.upscaledUrl?.startsWith('blob:')) URL.revokeObjectURL(target.upscaledUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  // Clear entire queue
  const handleClearQueue = () => {
    queue.forEach((item) => {
      if (item.originalUrl?.startsWith('blob:')) URL.revokeObjectURL(item.originalUrl);
      if (item.upscaledUrl?.startsWith('blob:')) URL.revokeObjectURL(item.upscaledUrl);
    });
    setQueue([]);
  };

  // Download all completed as ZIP
  const handleDownloadZip = async () => {
    const completed = queue.filter((i) => i.status === 'done' && i.upscaledBlob);
    if (completed.length === 0) return;

    setIsZipping(true);
    setZipProgress({ percent: 0, message: 'Menyiapkan berkas ZIP...' });

    try {
      await downloadBatchZip(
        queue,
        `realesrgan_${config.scale}x_batch_${new Date().toISOString().slice(0, 10)}.zip`,
        (percent, message) => {
          setZipProgress({ percent, message });
        }
      );
    } catch (err: any) {
      console.error('Gagal membuat ZIP:', err);
      alert('Gagal mengemas berkas ZIP: ' + (err?.message || err));
    } finally {
      setIsZipping(false);
    }
  };

  // Download single image
  const handleDownloadSingle = (item: QueueItem) => {
    downloadSingleImage(item);
  };

  // Open interactive preview modal
  const handlePreview = (item: QueueItem) => {
    setActivePreviewItem(item);
  };

  // History handlers
  const handleDeleteHistoryItem = (id: string) => {
    const updated = deleteHistoryItem(id);
    setHistoryItems(updated);
  };

  const handleClearHistory = () => {
    if (window.confirm('Hapus seluruh riwayat pemrosesan?')) {
      clearAllHistory();
      setHistoryItems([]);
    }
  };

  const handlePreviewHistoryItem = (hist: HistoryItem) => {
    const pseudoItem: QueueItem = {
      id: hist.id,
      name: hist.name,
      originalUrl: hist.thumbnailUrl || hist.upscaledUrl,
      originalWidth: hist.originalWidth,
      originalHeight: hist.originalHeight,
      originalSize: hist.originalSize,
      status: 'done',
      progress: 100,
      stage: 'Selesai',
      upscaledUrl: hist.upscaledUrl,
      upscaledWidth: hist.upscaledWidth,
      upscaledHeight: hist.upscaledHeight,
      upscaledSize: hist.upscaledSize,
      config: hist.config,
    };
    setActivePreviewItem(pseudoItem);
  };

  const handleDownloadHistoryItem = (hist: HistoryItem) => {
    const fileName = getDownloadFileName(hist.name, hist.config.format);
    const a = document.createElement('a');
    a.href = hist.upscaledUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const completedCount = queue.filter((i) => i.status === 'done').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navigation Bar */}
      <Header
        queueCount={queue.length}
        completedCount={completedCount}
        historyCount={historyItems.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        isProcessing={isProcessing}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Upload Zone & Batch Queue (7 cols on lg) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <UploadZone
              onFilesSelected={handleFilesSelected}
              onSampleSelected={handleSampleSelected}
              disabled={isProcessing}
            />

            {queue.length > 0 ? (
              <BatchQueue
                items={queue}
                isProcessing={isProcessing}
                onProcessAll={handleProcessAll}
                onStopProcessing={handleStopProcessing}
                onProcessSingle={handleProcessSingle}
                onDownloadZip={handleDownloadZip}
                onDownloadSingle={handleDownloadSingle}
                onPreview={handlePreview}
                onRemoveItem={handleRemoveItem}
                onClearQueue={handleClearQueue}
                isZipping={isZipping}
                zipProgress={zipProgress}
              />
            ) : (
              <div className="border border-slate-800/80 bg-slate-900/40 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3 text-slate-400">
                <div className="w-12 h-12 rounded-xl bg-slate-800/60 flex items-center justify-center text-slate-500">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-300">Belum ada gambar dalam antrean</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Unggah beberapa berkas gambar atau pilih salah satu sampel demo di atas untuk mulai melakukan upscale batch.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Settings & Parameters (5 cols on lg) */}
          <div className="lg:col-span-5 sticky top-20">
            <SettingsPanel
              config={config}
              onChange={setConfig}
              onApplyToAll={queue.length > 0 ? handleApplySettingsToAll : undefined}
              queueCount={queue.length}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Real-ESRGAN Super-Resolution Engine &bull; Skala 2x, 3x, 4x &bull; Denoise Presisi</span>
          <span>Dukungan Batch ZIP & Pratinjau Interaktif Split-Slider</span>
        </div>
      </footer>

      {/* Interactive Split-Slider Before & After Preview Modal */}
      <InteractivePreviewModal
        item={activePreviewItem}
        onClose={() => setActivePreviewItem(null)}
        onDownloadSingle={handleDownloadSingle}
      />

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        historyItems={historyItems}
        onDeleteHistoryItem={handleDeleteHistoryItem}
        onClearHistory={handleClearHistory}
        onPreviewHistoryItem={handlePreviewHistoryItem}
        onDownloadHistoryItem={handleDownloadHistoryItem}
      />

      {/* Guide Modal */}
      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
