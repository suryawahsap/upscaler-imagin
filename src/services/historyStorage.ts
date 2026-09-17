import { HistoryItem, QueueItem } from '../types';

const HISTORY_STORAGE_KEY = 'realesrgan_processing_history_v1';
const MAX_HISTORY_ITEMS = 50;

/**
 * Creates a small thumbnail data URL to store compactly in history
 */
async function createCompactThumbnail(srcUrl: string, maxDim = 120): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > h) {
        if (w > maxDim) { h = Math.round((h * maxDim) / w); w = maxDim; }
      } else {
        if (h > maxDim) { w = Math.round((w * maxDim) / h); h = maxDim; }
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/webp', 0.65));
      } else {
        resolve('');
      }
    };
    img.onerror = () => resolve('');
    img.src = srcUrl;
  });
}

/**
 * FIX: Converts a blob URL to a persistent data URL (base64).
 *
 * Blob URLs (blob:http://...) are session-only — they die on page refresh.
 * Storing a blob URL in localStorage means history items appear to exist but
 * the full upscaled image is broken after reload. Converting to data URL
 * ensures the image persists across sessions.
 *
 * Trade-off: data URLs are larger (base64 ~33% overhead). We cap image
 * thumbnail size via createCompactThumbnail, and the full upscaled data URL
 * may hit localStorage quota on large images. The quota handler below trims
 * history to recover space if that happens.
 */
async function blobUrlToDataUrl(blobUrl: string): Promise<string> {
  if (!blobUrl.startsWith('blob:')) return blobUrl; // already a data URL or regular URL

  const res = await fetch(blobUrl);
  const blob = await res.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Gagal mengkonversi blob ke data URL'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Loads all history items from local storage
 */
export function getHistory(): HistoryItem[] {
  try {
    const data = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Gagal membaca riwayat:', error);
    return [];
  }
}

/**
 * Saves a completed QueueItem into history.
 *
 * FIX: upscaledUrl is now converted from blob URL → data URL before saving,
 * so it persists correctly after page refresh.
 */
export async function saveItemToHistory(item: QueueItem): Promise<HistoryItem | null> {
  if (item.status !== 'done' || !item.upscaledUrl) return null;

  try {
    // Both thumbnail and full image must be data URLs to survive page refresh
    const [thumb, persistedUrl] = await Promise.all([
      createCompactThumbnail(item.upscaledUrl),
      blobUrlToDataUrl(item.upscaledUrl),
    ]);

    const historyItem: HistoryItem = {
      id: item.id || 'hist_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: item.name,
      timestamp: item.processedAt || Date.now(),
      thumbnailUrl: thumb,
      upscaledUrl: persistedUrl, // ✅ data URL, bukan blob URL
      originalWidth: item.originalWidth,
      originalHeight: item.originalHeight,
      upscaledWidth: item.upscaledWidth || item.originalWidth * item.config.scale,
      upscaledHeight: item.upscaledHeight || item.originalHeight * item.config.scale,
      originalSize: item.originalSize,
      upscaledSize: item.upscaledSize || 0,
      config: { ...item.config },
    };

    const currentHistory = getHistory();
    const updated = [historyItem, ...currentHistory.filter((h) => h.id !== historyItem.id)].slice(0, MAX_HISTORY_ITEMS);

    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    } catch (quotaErr) {
      // Quota exceeded — trim aggressively (full data URLs are large).
      // Try progressively smaller slices until it fits.
      const sliceSizes = [10, 5, 3, 1];
      let saved = false;
      for (const size of sliceSizes) {
        try {
          const trimmed = updated.slice(0, size);
          localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(trimmed));
          saved = true;
          console.warn(`Riwayat dipangkas ke ${size} item karena kuota localStorage penuh.`);
          break;
        } catch {
          // Continue trying smaller slice
        }
      }
      if (!saved) {
        console.error('Tidak dapat menyimpan riwayat — localStorage penuh. Hapus riwayat lama untuk memberi ruang.');
        return null;
      }
    }

    return historyItem;
  } catch (err) {
    console.error('Gagal menyimpan riwayat:', err);
    return null;
  }
}

/**
 * Deletes a single item from history
 */
export function deleteHistoryItem(id: string): HistoryItem[] {
  try {
    const current = getHistory();
    const updated = current.filter((item) => item.id !== id);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Gagal menghapus riwayat item:', error);
    return [];
  }
}

/**
 * Clears all history
 */
export function clearAllHistory(): void {
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (error) {
    console.error('Gagal membersihkan riwayat:', error);
  }
}
