export type ScaleFactor = 2 | 3 | 4;

export type ModelPreset =
  | 'realesrgan-x4plus-anime'      // Vector / Ilustrasi / Anime
  | 'realesr-animevideov3'         // 3D Render / CGI / Game Asset
  | 'realesrgan-x4plus'            // Photo Realistic
  | 'realesr-general-x4v3';        // General Purpose

export type OutputFormat = 'image/png' | 'image/jpeg' | 'image/webp';

export interface ModelInfo {
  id: ModelPreset;
  name: string;
  badge: string;
  description: string;
  bestFor: string;
  defaultDenoise: number;
  onnxUrl: string;        // URL model ONNX dari CDN
  inputSize: number;      // tile size untuk inference
  colorTag: string;       // untuk UI color coding
}

export interface UpscaleConfig {
  scale: ScaleFactor;
  model: ModelPreset;
  denoise: number;   // 0–100
  sharpen: number;   // 0–100
  format: OutputFormat;
  quality: number;   // 0.7–1.0
}

export type ProcessingStatus = 'idle' | 'loading_model' | 'processing' | 'done' | 'error';

export interface QueueItem {
  id: string;
  file?: File;
  name: string;
  originalUrl: string;
  originalWidth: number;
  originalHeight: number;
  originalSize: number;
  status: ProcessingStatus;
  progress: number;
  stage: string;
  upscaledUrl?: string;
  upscaledBlob?: Blob;
  upscaledWidth?: number;
  upscaledHeight?: number;
  upscaledSize?: number;
  error?: string;
  config: UpscaleConfig;
  processedAt?: number;
}

export interface HistoryItem {
  id: string;
  name: string;
  timestamp: number;
  thumbnailUrl: string;
  upscaledUrl: string;
  originalWidth: number;
  originalHeight: number;
  upscaledWidth: number;
  upscaledHeight: number;
  originalSize: number;
  upscaledSize: number;
  config: UpscaleConfig;
}
