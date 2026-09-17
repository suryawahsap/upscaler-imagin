import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, Plus, FolderUp } from 'lucide-react';
import { getSampleImages, SampleImage } from '../data/sampleImages';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  onSampleSelected: (sample: SampleImage) => void;
  disabled?: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFilesSelected,
  onSampleSelected,
  disabled,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const samples = getSampleImages();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = (Array.from(e.dataTransfer.files) as File[]).filter((file) =>
        file.type.startsWith('image/')
      );
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = (Array.from(e.target.files) as File[]).filter((file) =>
        file.type.startsWith('image/')
      );
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Drop Target Box */}
      <div
        id="drop-zone-container"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-indigo-400 bg-indigo-950/40 scale-[1.005] shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-500/30'
            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/bmp"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shadow-inner">
            <UploadCloud className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-base font-bold text-white mb-1">
              Tarik & Letakkan Berkas Gambar Di Sini (Mendukung Batch)
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Pilih satu atau banyak gambar sekaligus (PNG, JPG, WEBP, BMP). Siap diproses serentak dengan Real-ESRGAN.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              id="btn-select-files"
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/25 transition-all"
            >
              <FolderUp className="w-4 h-4" />
              Pilih Berkas dari Komputer
            </button>
          </div>
        </div>
      </div>

      {/* Sample Images row for quick testing */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
          <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>Belum punya gambar untuk diuji? Coba sampel bawaan:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {samples.map((sample) => (
            <button
              key={sample.id}
              id={`btn-sample-${sample.id}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSampleSelected(sample);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 bg-slate-800/90 hover:bg-slate-700/90 hover:text-white border border-slate-700/60 transition-all hover:scale-[1.02]"
              title={sample.description}
            >
              <span className="w-3.5 h-3.5 rounded overflow-hidden flex-shrink-0 border border-slate-600">
                <img src={sample.url} alt="" className="w-full h-full object-cover" />
              </span>
              <span>{sample.category}</span>
              <Plus className="w-3 h-3 text-indigo-400" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
