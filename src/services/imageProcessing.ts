/**
 * imageProcessing.ts — Real-ESRGAN ONNX Inference Engine
 *
 * Uses real Real-ESRGAN neural network models via ONNX Runtime Web.
 * Models are loaded from the app's public folder and cached in IndexedDB.
 *
 * Architecture:
 *  1. Load ONNX model (cached after first download)
 *  2. Tile the input image to fit GPU memory (128×128 tiles with overlap)
 *  3. Run ONNX inference per tile
 *  4. Stitch tiles into full output
 *  5. Optional post-sharpening (Laplacian) at final resolution
 */

import { UpscaleConfig } from '../types';

// ─── ONNX Runtime Web ────────────────────────────────────────────────────────
// Loaded via CDN script tag in index.html — available as window.ort
declare const ort: any;

export interface ProcessProgressCallback {
  (progress: number, stage: string): void;
}

export interface UpscaleResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  size: number;
}

// ─── Model Registry ──────────────────────────────────────────────────────────
// ONNX models bundled in public/models and cached in IndexedDB after first download.
const MODEL_URLS: Record<string, string> = {
  // Vector / Ilustrasi / Anime — lightweight RRDB model
  'realesrgan-x4plus-anime':
    '/models/RealESRGAN_x4plus_anime_6B.onnx',

  // 3D Render / CGI / Game Asset — animevideov3 generalizes well to CG
  'realesr-animevideov3':
    '/models/RealESRGAN_x4plus_anime_6B.onnx',

  // Photo Realistic — full 65 MB RRDB model
  'realesrgan-x4plus':
    '/models/RealESRGAN_x4plus.onnx',

  // General Purpose — lightweight general model
  'realesr-general-x4v3':
    '/models/RealESRGAN_x4plus_anime_6B.onnx',
};

// Fallback URLs for environments where the bundled assets are unavailable.
const MODEL_URLS_FALLBACK: Record<string, string> = {
  'realesrgan-x4plus-anime':
    'https://huggingface.co/imgdesignart/realesrgan-x4-onnx/resolve/main/onnx/model.onnx',
  'realesr-animevideov3':
    'https://huggingface.co/imgdesignart/realesrgan-x4-onnx/resolve/main/onnx/model.onnx',
  'realesrgan-x4plus':
    'https://huggingface.co/Meeperomi/RealESRGAN_x4-onnx/resolve/main/RealESRGAN_x4.onnx',
  'realesr-general-x4v3':
    'https://huggingface.co/imgdesignart/realesrgan-x4-onnx/resolve/main/onnx/model.onnx',
};

// ─── IndexedDB Cache ─────────────────────────────────────────────────────────
const DB_NAME  = 'realesrgan-models';
const DB_VER   = 1;
const DB_STORE = 'onnx-models';

async function openModelDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

async function getCachedModel(key: string): Promise<ArrayBuffer | null> {
  try {
    const db = await openModelDB();
    return new Promise((resolve) => {
      const tx  = db.transaction(DB_STORE, 'readonly');
      const req = tx.objectStore(DB_STORE).get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror   = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function cacheModel(key: string, buffer: ArrayBuffer): Promise<void> {
  try {
    const db = await openModelDB();
    return new Promise((resolve) => {
      const tx  = db.transaction(DB_STORE, 'readwrite');
      tx.objectStore(DB_STORE).put(buffer, key);
      tx.oncomplete = () => resolve();
      tx.onerror    = () => resolve();
    });
  } catch {
    // Non-fatal — model will just be re-downloaded next time
  }
}

// ─── Model Loader (with progress) ───────────────────────────────────────────
const sessionCache: Record<string, any> = {};

async function loadModel(
  modelId: string,
  onProgress?: ProcessProgressCallback
): Promise<any> {
  if (sessionCache[modelId]) return sessionCache[modelId];

  // 1. Check IndexedDB cache
  const cacheKey = `${modelId}-v4`;
  let buffer = await getCachedModel(cacheKey);

  if (!buffer) {
    // 2. Download model
    const primaryUrl  = MODEL_URLS[modelId];
    const fallbackUrl = MODEL_URLS_FALLBACK[modelId];

    onProgress?.(5, 'Mengunduh model AI (sekali saja, ~17–65 MB)...');

    const tryFetch = async (url: string): Promise<ArrayBuffer> => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const contentLength = res.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength) : 0;

      if (total > 0 && res.body) {
        const reader = res.body.getReader();
        const chunks: Uint8Array[] = [];
        let received = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.length;
          const pct = Math.round((received / total) * 25) + 5; // 5–30%
          onProgress?.(pct, `Mengunduh model... ${Math.round(received / 1024 / 1024)} / ${Math.round(total / 1024 / 1024)} MB`);
        }

        const merged = new Uint8Array(received);
        let offset = 0;
        for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.length; }
        return merged.buffer;
      }

      return res.arrayBuffer();
    };

    try {
      buffer = await tryFetch(primaryUrl);
    } catch (e) {
      console.warn('Primary CDN failed, trying fallback...', e);
      try {
        buffer = await tryFetch(fallbackUrl);
      } catch (e2) {
        throw new Error(
          `Gagal mengunduh model ONNX. Pastikan koneksi internet aktif.\nDetail: ${e2}`
        );
      }
    }

    // Cache for next time
    await cacheModel(cacheKey, buffer);
  } else {
    onProgress?.(30, 'Model ditemukan di cache lokal...');
  }

  // 3. Create ONNX session
  onProgress?.(32, 'Menginisialisasi ONNX Runtime (WebGL/WASM)...');

  if (typeof ort === 'undefined') {
    throw new Error(
      'ONNX Runtime tidak tersedia. Pastikan ort.min.js dimuat di index.html.'
    );
  }

  const session = await ort.InferenceSession.create(buffer, {
    executionProviders: ['webgl', 'wasm'],
    graphOptimizationLevel: 'all',
  });

  sessionCache[modelId] = session;
  return session;
}

// ─── Image helpers ───────────────────────────────────────────────────────────
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = (err) => reject(new Error('Gagal memuat gambar: ' + err));
    img.src = src;
  });
}

export async function getImageDimensions(
  fileOrUrl: File | string
): Promise<{ width: number; height: number }> {
  let url = '';
  let shouldRevoke = false;
  if (typeof fileOrUrl === 'string') {
    url = fileOrUrl;
  } else {
    url = URL.createObjectURL(fileOrUrl);
    shouldRevoke = true;
  }
  try {
    const img = await loadImage(url);
    const dims = { width: img.naturalWidth, height: img.naturalHeight };
    if (shouldRevoke) URL.revokeObjectURL(url);
    return dims;
  } catch (error) {
    if (shouldRevoke) URL.revokeObjectURL(url);
    throw error;
  }
}

// ─── ONNX Tile Inference ─────────────────────────────────────────────────────
const TILE_SIZE    = 64;    // input tile size required by the bundled ONNX models
const TILE_OVERLAP = 8;     // overlap to avoid seam artifacts
const SCALE        = 4;     // all models output 4×

/**
 * Run ONNX inference on a single TILE_SIZE×TILE_SIZE tile.
 * Input:  Float32 NCHW tensor, values in [0, 1]
 * Output: Float32 NCHW tensor, 4× larger, values in [0, 1]
 */
async function runTileInference(
  session: any,
  tileImageData: ImageData
): Promise<ImageData> {
  const { width: tw, height: th } = tileImageData;
  const data = tileImageData.data; // Uint8ClampedArray RGBA

  // Build Float32 CHW tensor [1, 3, th, tw]
  const tensorData = new Float32Array(3 * th * tw);
  for (let y = 0; y < th; y++) {
    for (let x = 0; x < tw; x++) {
      const srcIdx  = (y * tw + x) * 4;
      const baseIdx = y * tw + x;
      tensorData[0 * th * tw + baseIdx] = data[srcIdx]     / 255.0; // R
      tensorData[1 * th * tw + baseIdx] = data[srcIdx + 1] / 255.0; // G
      tensorData[2 * th * tw + baseIdx] = data[srcIdx + 2] / 255.0; // B
    }
  }

  const inputTensor = new ort.Tensor('float32', tensorData, [1, 3, th, tw]);
  const feeds: Record<string, any> = {};

  // Detect input name (usually 'input' or 'x')
  const inputName = session.inputNames?.[0] ?? 'input';
  feeds[inputName] = inputTensor;

  const results = await session.run(feeds);
  const outputName = session.outputNames?.[0] ?? 'output';
  const output: any = results[outputName];

  const outH = th * SCALE;
  const outW = tw * SCALE;
  const outData = output.data as Float32Array;

  // Convert CHW float → RGBA Uint8Clamped
  const outImgData = new ImageData(outW, outH);
  const outArr = outImgData.data;

  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      const dstIdx  = (y * outW + x) * 4;
      const baseIdx = y * outW + x;
      outArr[dstIdx]     = Math.round(Math.max(0, Math.min(1, outData[0 * outH * outW + baseIdx])) * 255);
      outArr[dstIdx + 1] = Math.round(Math.max(0, Math.min(1, outData[1 * outH * outW + baseIdx])) * 255);
      outArr[dstIdx + 2] = Math.round(Math.max(0, Math.min(1, outData[2 * outH * outW + baseIdx])) * 255);
      outArr[dstIdx + 3] = 255;
    }
  }

  return outImgData;
}

function cropImageData(
  imageData: ImageData,
  width: number,
  height: number
): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  canvas.getContext('2d')!.putImageData(imageData, 0, 0);
  return canvas.getContext('2d')!.getImageData(0, 0, width, height);
}

// ─── Tiled upscale pipeline ──────────────────────────────────────────────────
async function upscaleWithONNX(
  session: any,
  srcCanvas: HTMLCanvasElement,
  onProgress?: ProcessProgressCallback
): Promise<HTMLCanvasElement> {
  const srcW = srcCanvas.width;
  const srcH = srcCanvas.height;
  const srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true })!;

  const outW = srcW * SCALE;
  const outH = srcH * SCALE;
  const outCanvas = document.createElement('canvas');
  outCanvas.width  = outW;
  outCanvas.height = outH;
  const outCtx = outCanvas.getContext('2d', { willReadFrequently: true })!;

  const step = TILE_SIZE - TILE_OVERLAP * 2;
  const tilesX = Math.ceil(srcW / step);
  const tilesY = Math.ceil(srcH / step);
  const totalTiles = tilesX * tilesY;
  let processed = 0;

  for (let ty = 0; ty < tilesY; ty++) {
    for (let tx = 0; tx < tilesX; tx++) {
      // Source tile coordinates (with overlap)
      const srcX = Math.max(0, tx * step - TILE_OVERLAP);
      const srcY = Math.max(0, ty * step - TILE_OVERLAP);
      const srcTileW = Math.min(TILE_SIZE, srcW - srcX);
      const srcTileH = Math.min(TILE_SIZE, srcH - srcY);

      // Pad edge tiles to the fixed model input shape, then crop their output.
      const paddedTile = document.createElement('canvas');
      paddedTile.width = TILE_SIZE;
      paddedTile.height = TILE_SIZE;
      paddedTile.getContext('2d')!.drawImage(
        srcCanvas,
        srcX,
        srcY,
        srcTileW,
        srcTileH,
        0,
        0,
        srcTileW,
        srcTileH
      );
      const tileImageData = paddedTile.getContext('2d')!.getImageData(
        0,
        0,
        TILE_SIZE,
        TILE_SIZE
      );

      // Run ONNX
      const resultImageData = cropImageData(
        await runTileInference(session, tileImageData),
        srcTileW * SCALE,
        srcTileH * SCALE
      );

      // Calculate destination (strip overlap from output)
      const overlapOutL = (tx === 0 ? 0 : TILE_OVERLAP) * SCALE;
      const overlapOutT = (ty === 0 ? 0 : TILE_OVERLAP) * SCALE;
      const dstX = srcX * SCALE + overlapOutL;
      const dstY = srcY * SCALE + overlapOutT;

      // Paint result tile onto output canvas
      const tmpCanvas = document.createElement('canvas');
      tmpCanvas.width  = resultImageData.width;
      tmpCanvas.height = resultImageData.height;
      tmpCanvas.getContext('2d')!.putImageData(resultImageData, 0, 0);
      outCtx.drawImage(tmpCanvas, overlapOutL, overlapOutT, resultImageData.width - overlapOutL, resultImageData.height - overlapOutT, dstX, dstY, resultImageData.width - overlapOutL, resultImageData.height - overlapOutT);

      processed++;
      const pct = Math.round(40 + (processed / totalTiles) * 45); // 40–85%
      onProgress?.(pct, `Upscaling tile ${processed}/${totalTiles} (ONNX inference)...`);

      // Yield to keep UI responsive
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  return outCanvas;
}

// ─── Post-processing: optional Laplacian sharpening ─────────────────────────
function applySharpening(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  amount: number
) {
  if (amount <= 0) return;
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  const copy = new Uint8ClampedArray(data);
  const a = (amount / 100) * 0.6; // max 0.6 to avoid ringing

  const kernel = [0, -1, 0, -1, 4, -1, 0, -1, 0];

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      let lR = 0, lG = 0, lB = 0, k = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const w2 = kernel[k++];
          if (w2 === 0) continue;
          const kIdx = ((y + ky) * w + (x + kx)) * 4;
          lR += copy[kIdx] * w2;
          lG += copy[kIdx + 1] * w2;
          lB += copy[kIdx + 2] * w2;
        }
      }
      const clamp = (v: number) => Math.max(-30, Math.min(30, v * a));
      data[idx]     = Math.max(0, Math.min(255, copy[idx]     + clamp(lR)));
      data[idx + 1] = Math.max(0, Math.min(255, copy[idx + 1] + clamp(lG)));
      data[idx + 2] = Math.max(0, Math.min(255, copy[idx + 2] + clamp(lB)));
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

// ─── Scale via canvas (fallback for 2x / 3x) ─────────────────────────────────
function scaleCanvas(src: HTMLCanvasElement, targetW: number, targetH: number): HTMLCanvasElement {
  const dst = document.createElement('canvas');
  dst.width  = targetW;
  dst.height = targetH;
  const ctx = dst.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, targetW, targetH);
  return dst;
}

// ─── Main export ─────────────────────────────────────────────────────────────
export async function upscaleImage(
  imageSource: string,
  config: UpscaleConfig,
  onProgress?: ProcessProgressCallback
): Promise<UpscaleResult> {
  // Step 1: Load image
  onProgress?.(2, 'Memuat gambar sumber...');
  const img = await loadImage(imageSource);
  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;

  // Step 2: Draw to canvas
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width  = srcW;
  srcCanvas.height = srcH;
  srcCanvas.getContext('2d')!.drawImage(img, 0, 0);

  // Step 3: Load ONNX model
  onProgress?.(3, 'Menyiapkan model Real-ESRGAN...');
  const session = await loadModel(config.model, onProgress);

  // Step 4: Run 4x ONNX inference (always 4x from model)
  onProgress?.(35, `Inferensi Real-ESRGAN ONNX: ${config.model}...`);
  const upscaled4x = await upscaleWithONNX(session, srcCanvas, onProgress);

  // Step 5: Rescale to requested output size (if 2x or 3x)
  onProgress?.(86, 'Menyesuaikan skala output...');
  let finalCanvas: HTMLCanvasElement;
  if (config.scale === 4) {
    finalCanvas = upscaled4x;
  } else {
    const targetW = Math.round(srcW * config.scale);
    const targetH = Math.round(srcH * config.scale);
    finalCanvas = scaleCanvas(upscaled4x, targetW, targetH);
  }

  // Step 6: Post-sharpening
  if (config.sharpen > 0) {
    onProgress?.(90, 'Penyempurnaan ketajaman tepi...');
    const finalCtx = finalCanvas.getContext('2d', { willReadFrequently: true })!;
    applySharpening(finalCtx, finalCanvas.width, finalCanvas.height, config.sharpen);
  }

  // Step 7: Export
  onProgress?.(95, `Enkode ke ${config.format.split('/')[1].toUpperCase()}...`);
  const quality = config.format === 'image/png' ? undefined : config.quality;
  const blob = await new Promise<Blob>((resolve, reject) => {
    finalCanvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Gagal mengekspor blob'))),
      config.format,
      quality
    );
  });

  const dataUrl = URL.createObjectURL(blob);
  onProgress?.(100, 'Selesai!');

  return {
    blob,
    dataUrl,
    width:  finalCanvas.width,
    height: finalCanvas.height,
    size:   blob.size,
  };
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/** Clears cached ONNX sessions (e.g. to free VRAM) */
export function clearModelCache(): void {
  for (const key of Object.keys(sessionCache)) {
    delete sessionCache[key];
  }
}
