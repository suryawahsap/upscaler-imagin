import React from 'react';
import { ScaleFactor, ModelPreset, OutputFormat, UpscaleConfig, ModelInfo } from '../types';
import { Sliders, Maximize2, Zap, FileType, Sparkles } from 'lucide-react';

interface SettingsPanelProps {
  config: UpscaleConfig;
  onChange: (newConfig: UpscaleConfig) => void;
  onApplyToAll?: () => void;
  queueCount: number;
}

export const MODEL_OPTIONS: ModelInfo[] = [
  {
    id: 'realesrgan-x4plus-anime',
    name: 'Anime / Vector / Ilustrasi',
    badge: 'Flat Art',
    description: 'Dioptimalkan untuk garis bersih, warna solid, dan kontur tajam. Ideal untuk ilustrasi digital, manga, karakter 2D.',
    bestFor: 'Ilustrasi, Anime, Vector Art, Manga',
    defaultDenoise: 0,
    onnxUrl: '',
    inputSize: 128,
    colorTag: 'pink',
  },
  {
    id: 'realesr-animevideov3',
    name: '3D Render / CGI / Game',
    badge: '3D Art',
    description: 'Sangat efektif untuk aset 3D, render CGI, screenshot game, dan karya seni berbasis komputer dengan detail geometris.',
    bestFor: '3D Render, Game Asset, CGI, Isometric',
    defaultDenoise: 15,
    onnxUrl: '',
    inputSize: 128,
    colorTag: 'violet',
  },
  {
    id: 'realesrgan-x4plus',
    name: 'Photo Realistis',
    badge: 'Foto',
    description: 'Model RRDB penuh untuk foto kamera. Merekonstruksi tekstur mikro: pori kulit, bulu, dedaunan, dan detail alami.',
    bestFor: 'Fotografi, Portrait, Landscape, Product',
    defaultDenoise: 20,
    onnxUrl: '',
    inputSize: 128,
    colorTag: 'emerald',
  },
  {
    id: 'realesr-general-x4v3',
    name: 'Serbaguna / Umum',
    badge: 'General',
    description: 'Cocok untuk semua jenis gambar, tangkapan layar, grafis web, dan dokumen. Pilihan terbaik jika tidak yakin.',
    bestFor: 'Screenshot, Web Graphics, Mixed Content',
    defaultDenoise: 30,
    onnxUrl: '',
    inputSize: 128,
    colorTag: 'cyan',
  },
];

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  pink:   { bg: 'bg-pink-950/70',   border: 'border-pink-500/80',   text: 'text-pink-200',   badge: 'bg-pink-500/20 text-pink-300 border-pink-400/30' },
  violet: { bg: 'bg-violet-950/70', border: 'border-violet-500/80', text: 'text-violet-200', badge: 'bg-violet-500/20 text-violet-300 border-violet-400/30' },
  emerald:{ bg: 'bg-emerald-950/70',border: 'border-emerald-500/80',text: 'text-emerald-200',badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' },
  cyan:   { bg: 'bg-cyan-950/70',   border: 'border-cyan-500/80',   text: 'text-cyan-200',   badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30' },
};

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ config, onChange, onApplyToAll, queueCount }) => {

  const handleModelChange = (model: ModelPreset) => {
    const m = MODEL_OPTIONS.find((x) => x.id === model);
    onChange({ ...config, model, denoise: m?.defaultDenoise ?? config.denoise });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">Konfigurasi Real-ESRGAN</h2>
            <p className="text-xs text-slate-400">ONNX Neural Network · Inferensi Browser</p>
          </div>
        </div>
        {queueCount > 0 && onApplyToAll && (
          <button onClick={onApplyToAll} className="text-xs px-2.5 py-1 rounded-md text-indigo-300 hover:text-white bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-700/40 transition-colors">
            Terapkan ke Semua ({queueCount})
          </button>
        )}
      </div>

      {/* Model Selection */}
      <div>
        <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 mb-2.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          Pilih Model Real-ESRGAN (berdasarkan jenis gambar)
        </label>

        {/* Info banner */}
        <div className="mb-3 flex items-start gap-2 bg-amber-950/30 border border-amber-800/50 rounded-xl p-3 text-[11px] text-amber-300/80">
          <span className="text-amber-400 mt-0.5 flex-shrink-0">⚡</span>
          <span>Model ONNX (~17–65 MB) diunduh sekali lalu disimpan di browser. Inferensi berjalan 100% lokal — gambar tidak dikirim ke server.</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {MODEL_OPTIONS.map((m) => {
            const isSelected = config.model === m.id;
            const colors = COLOR_MAP[m.colorTag];
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleModelChange(m.id)}
                className={`p-3 rounded-xl text-left border transition-all ${
                  isSelected
                    ? `${colors.bg} ${colors.border} ring-1 ring-white/10`
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-bold ${isSelected ? colors.text : 'text-slate-200'}`}>
                    {m.name}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${isSelected ? colors.badge : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                    {m.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">{m.bestFor}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scale */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
            Skala Pembesaran
          </label>
          <span className="text-[11px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
            {config.scale}x ({config.scale * config.scale}× total piksel)
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {([2, 3, 4] as ScaleFactor[]).map((scale) => {
            const isSelected = config.scale === scale;
            return (
              <button key={scale} type="button" onClick={() => onChange({ ...config, scale })}
                className={`flex flex-col items-center justify-center py-2.5 px-3 rounded-xl font-bold text-sm transition-all border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30 ring-1 ring-indigo-300/40'
                    : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                }`}
              >
                <span className="text-base font-extrabold">{scale}x</span>
                <span className="text-[10px] font-normal opacity-80">
                  {scale === 2 ? 'Cepat' : scale === 3 ? 'Seimbang' : 'Maksimal'}
                </span>
              </button>
            );
          })}
        </div>
        {config.scale < 4 && (
          <p className="text-[10px] text-slate-500 mt-1.5">
            Model ONNX selalu berjalan 4× lalu didownscale ke {config.scale}×. Kualitas tetap penuh.
          </p>
        )}
      </div>

      {/* Denoise & Sharpen */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Post-Processing
          </label>
        </div>

        {/* Denoise — Note: ONNX model handles denoise internally */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-300">Denoise Tambahan (post-ONNX)</span>
            <span className="text-xs font-mono font-bold text-cyan-400">{config.denoise}%</span>
          </div>
          <input type="range" min="0" max="60" step="5" value={config.denoise}
            onChange={(e) => onChange({ ...config, denoise: Number(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <p className="text-[10px] text-slate-500">Model Real-ESRGAN sudah menangani noise secara bawaan. Slider ini hanya untuk denoise tambahan jika masih ada artefak.</p>
        </div>

        {/* Sharpen */}
        <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-300">Ketajaman Tepi (Post-Sharpening)</span>
            <span className="text-xs font-mono font-bold text-slate-300">{config.sharpen}%</span>
          </div>
          <input type="range" min="0" max="60" step="5" value={config.sharpen}
            onChange={(e) => onChange({ ...config, sharpen: Number(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
          />
        </div>
      </div>

      {/* Output Format */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <FileType className="w-3.5 h-3.5 text-emerald-400" />
            Format Output
          </label>
          <span className="text-[11px] font-mono text-emerald-400">
            {config.format === 'image/png' ? 'Lossless' : `${Math.round(config.quality * 100)}% Quality`}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { id: 'image/png' as OutputFormat, label: 'PNG', hint: 'Lossless' },
            { id: 'image/jpeg' as OutputFormat, label: 'JPG', hint: 'Ringkas' },
            { id: 'image/webp' as OutputFormat, label: 'WEBP', hint: 'Modern' },
          ].map((fmt) => {
            const isSelected = config.format === fmt.id;
            return (
              <button key={fmt.id} type="button" onClick={() => onChange({ ...config, format: fmt.id })}
                className={`py-2 px-2.5 rounded-xl text-center border transition-all ${
                  isSelected
                    ? 'bg-emerald-950/70 border-emerald-500/80 text-emerald-200 font-bold'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-bold">{fmt.label}</div>
                <div className="text-[9px] opacity-75">{fmt.hint}</div>
              </button>
            );
          })}
        </div>
        {config.format !== 'image/png' && (
          <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
            <div className="flex justify-between text-[11px] text-slate-300 mb-1">
              <span>Kualitas Kompresi</span>
              <span className="font-mono font-bold text-emerald-400">{Math.round(config.quality * 100)}%</span>
            </div>
            <input type="range" min="0.6" max="1.0" step="0.05" value={config.quality}
              onChange={(e) => onChange({ ...config, quality: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>
        )}
      </div>
    </div>
  );
};
