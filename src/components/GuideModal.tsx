import React from 'react';
import { X, Sparkles, HelpCircle, Maximize2, Zap, Sliders, FileType, Archive, Cpu } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[85vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="h-14 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <HelpCircle className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Panduan Real-ESRGAN ONNX Upscaler</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-300">
          {/* How it works */}
          <div className="bg-indigo-950/40 border border-indigo-800/50 rounded-xl p-4 space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              Cara Kerja: Real-ESRGAN ONNX
            </h4>
            <p className="text-slate-300 leading-relaxed">
              Tool ini menggunakan <strong className="text-indigo-300">model neural network Real-ESRGAN yang sesungguhnya</strong> (RRDB architecture) yang berjalan 100% di browser melalui ONNX Runtime Web WASM. Tidak ada gambar yang dikirim ke server — semua inferensi terjadi di perangkat Anda.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { title: 'Download Sekali', desc: 'Model ~17–65 MB, tersimpan di cache browser' },
                { title: 'Local Inference', desc: 'WASM backend berjalan langsung di browser' },
                { title: '100% Lokal', desc: 'Privasi terjaga, tidak perlu internet saat proses' },
              ].map((item) => (
                <div key={item.title} className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-indigo-300 font-bold text-[11px] mb-1">{item.title}</div>
                  <div className="text-slate-400 text-[10px]">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Model guide */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Panduan Memilih Model
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { color: 'text-pink-300', title: 'Anime / Vector / Ilustrasi', desc: 'Garis bersih, warna solid, kontur tajam. Anime, manga, karakter 2D, flat design.' },
                { color: 'text-violet-300', title: '3D Render / CGI / Game', desc: 'Aset 3D, render Blender/Cinema4D, screenshot game, isometric art.' },
                { color: 'text-emerald-300', title: 'Photo Realistis', desc: 'Foto kamera, portrait, landscape. Merekonstruksi pori, bulu, daun, tekstur alami.' },
                { color: 'text-cyan-300', title: 'Serbaguna / Umum', desc: 'Screenshot, web graphics, dokumen. Pilihan default jika tidak yakin.' },
              ].map((m) => (
                <div key={m.title} className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <div className={`font-bold text-[11px] mb-1 ${m.color}`}>{m.title}</div>
                  <div className="text-slate-400 text-[10px] leading-snug">{m.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Scale */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Maximize2 className="w-4 h-4 text-indigo-400" />
              Skala Pembesaran
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
              <li><strong className="text-slate-200">2x:</strong> Model ONNX inferensi 4× lalu didownscale. Hasilnya tajam dengan detail neural network penuh.</li>
              <li><strong className="text-slate-200">3x:</strong> Sama, 4× → downscale ke 3×. Waktu proses identik dengan 4×.</li>
              <li><strong className="text-slate-200">4x:</strong> Output penuh dari model. Untuk cetak A3/A2, layar 4K, microstock.</li>
            </ul>
          </div>

          {/* Tips performa */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Tips Performa
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
              <li>Gunakan Chrome/Edge terbaru untuk dukungan WASM terbaik.</li>
              <li>Gambar besar (&gt;2000px) dibagi menjadi tile 64×64 secara otomatis.</li>
              <li>Model foto (65 MB) lebih lambat dari model anime (65 MB) — wajar.</li>
              <li>Batch queue diproses berurutan untuk menjaga penggunaan memori.</li>
            </ul>
          </div>

          {/* Batch */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Archive className="w-4 h-4 text-emerald-400" />
              Batch Processing & ZIP
            </h4>
            <p className="text-slate-400">
              Upload banyak gambar sekaligus. Klik <strong className="text-white">"Proses Semua"</strong> untuk antrean berurutan. Setelah selesai, unduh semua hasil sekaligus dalam format ZIP lengkap dengan manifest.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors">
            Mengerti, Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
};
