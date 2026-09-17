import JSZip from 'jszip';
import { QueueItem } from '../types';

export interface ZipProgressCallback {
  (percent: number, currentFileName: string): void;
}

/**
 * Returns the clean file name matching the original file name as requested,
 * without adding any tags, upscale prefixes, suffixes, or scale numbers.
 */
export function getDownloadFileName(originalName: string, targetMime?: string): string {
  if (!originalName) return 'image';

  const lastDot = originalName.lastIndexOf('.');
  if (lastDot === -1) {
    const ext = targetMime === 'image/png' ? 'png' : targetMime === 'image/webp' ? 'webp' : 'jpg';
    return `${originalName}.${ext}`;
  }

  const baseName = originalName.substring(0, lastDot);
  const origExt = originalName.substring(lastDot + 1).toLowerCase();

  if (!targetMime) return originalName;

  const targetExt = targetMime === 'image/png' ? 'png' : targetMime === 'image/webp' ? 'webp' : 'jpg';

  const isSameType =
    (origExt === 'png' && targetExt === 'png') ||
    ((origExt === 'jpg' || origExt === 'jpeg') && targetExt === 'jpg') ||
    (origExt === 'webp' && targetExt === 'webp');

  if (isSameType) {
    // Keep exact original file name with original casing
    return originalName;
  }

  // If format was converted, keep original base name without anything added
  return `${baseName}.${targetExt}`;
}

/**
 * Creates and triggers download of a ZIP file containing all finished upscaled images
 */
export async function downloadBatchZip(
  items: QueueItem[],
  zipFilename = 'realesrgan_upscaled_batch.zip',
  onProgress?: ZipProgressCallback
): Promise<void> {
  const completedItems = items.filter((item) => item.status === 'done' && item.upscaledBlob);

  if (completedItems.length === 0) {
    throw new Error('Tidak ada gambar yang selesai diproses untuk diunduh.');
  }

  const zip = new JSZip();
  const folder = zip;

  let manifestText = `=================================================\n`;
  manifestText += `REAL-ESRGAN BATCH UPSCALE MANIFEST\n`;
  manifestText += `Dibuat pada: ${new Date().toLocaleString('id-ID')}\n`;
  manifestText += `Total File: ${completedItems.length}\n`;
  manifestText += `=================================================\n\n`;

  // Track filenames to avoid overwriting if user uploads multiple files with the exact same original name
  const nameCounts = new Map<string, number>();

  for (let i = 0; i < completedItems.length; i++) {
    const item = completedItems[i];
    if (!item.upscaledBlob) continue;

    const rawName = getDownloadFileName(item.name, item.config.format);
    let cleanFileName = rawName;

    if (nameCounts.has(rawName)) {
      const count = nameCounts.get(rawName)! + 1;
      nameCounts.set(rawName, count);
      const dotIdx = rawName.lastIndexOf('.');
      if (dotIdx !== -1) {
        cleanFileName = `${rawName.substring(0, dotIdx)} (${count})${rawName.substring(dotIdx)}`;
      } else {
        cleanFileName = `${rawName} (${count})`;
      }
    } else {
      nameCounts.set(rawName, 0);
    }

    // Add to ZIP with original name
    folder.file(cleanFileName, item.upscaledBlob);

    // Add to manifest
    manifestText += `[${i + 1}] ${cleanFileName}\n`;
    manifestText += `    - Berkas Asal: ${item.name} (${item.originalWidth}x${item.originalHeight})\n`;
    manifestText += `    - Hasil: ${item.upscaledWidth}x${item.upscaledHeight} (${item.config.scale}x)\n`;
    manifestText += `    - Model: ${item.config.model}\n`;
    manifestText += `    - Parameter Noise (Denoise): ${item.config.denoise}%\n`;
    manifestText += `    - Parameter Ketajaman (Sharpen): ${item.config.sharpen}%\n`;
    manifestText += `    - Format: ${item.config.format.replace('image/', '').toUpperCase()}\n\n`;

    const progressPercent = Math.round(((i + 1) / completedItems.length) * 50);
    onProgress?.(progressPercent, cleanFileName);
  }

  folder.file('manifest.txt', manifestText);

  // Generate ZIP
  const content = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      const overallPercent = 50 + Math.round((metadata.percent / 100) * 50);
      onProgress?.(overallPercent, 'Mengompresi arsip ZIP...');
    }
  );

  // Trigger browser download
  const downloadUrl = URL.createObjectURL(content);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = zipFilename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(downloadUrl);
}

/**
 * Download a single upscaled image with its original file name preserved
 */
export function downloadSingleImage(item: QueueItem): void {
  if (!item.upscaledUrl) return;

  const fileName = getDownloadFileName(item.name, item.config.format);

  const anchor = document.createElement('a');
  anchor.href = item.upscaledUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}
