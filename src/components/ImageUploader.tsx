import { useRef, useState } from 'react';
import { uploadImage, deleteImage, UploadResult } from '../lib/firebaseServices';
import { useAuth } from '../lib/AuthContext';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
}

const DEFAULT_PLACEHOLDER =
  'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=400';

export function ImageUploader({
  value,
  onChange,
  label = 'Product image',
  className = '',
}: ImageUploaderProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>('');

  const handleFile = async (file: File) => {
    setError('');
    setUploading(true);
    setProgress(0);

    // Safety timeout: if upload takes more than 30s, force reset and show error
    const timeoutId = setTimeout(() => {
      setUploading(false);
      setProgress(0);
      setError('Upload timed out. The image will be stored locally instead.');
    }, 30000);

    try {
      const result: UploadResult = await uploadImage(
        file,
        user?.uid,
        (p) => setProgress(p)
      );
      clearTimeout(timeoutId);
      onChange(result.url);
      setCurrentPath(result.path);
      if (result.isLocal) {
        // Show a soft notice that it was stored locally (still works fine)
        console.info('Image stored locally (data URL) — Firebase Storage may not be enabled.');
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      setError(err?.message || 'Upload failed');
    } finally {
      clearTimeout(timeoutId);
      setUploading(false);
      setProgress(0);
    }
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = ''; // allow re-selecting same file
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleClear = async () => {
    if (currentPath && value) {
      await deleteImage(currentPath, value);
    }
    onChange('');
    setCurrentPath('');
    setError('');
  };

  const displayUrl = value || DEFAULT_PLACEHOLDER;
  const isCustom = !!value;

  return (
    <div className={className}>
      <label className="text-xs font-medium text-slate-600 dark:text-slate-300">{label}</label>

      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`group relative mt-1 flex aspect-video w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 transition ${
          dragging
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
            : 'border-dashed border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/30 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-500 dark:hover:bg-indigo-500/10'
        }`}
      >
        <img
          src={displayUrl}
          alt="Preview"
          className={`h-full w-full object-cover transition ${!isCustom ? 'opacity-50' : ''}`}
          onError={(e) => {
            (e.target as HTMLImageElement).src = DEFAULT_PLACEHOLDER;
          }}
        />

        {!uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-slate-900/0 transition group-hover:bg-slate-900/40">
            <div className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 opacity-0 transition group-hover:opacity-100">
              📷 {isCustom ? 'Change image' : 'Click or drop image'}
            </div>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900/70 text-white">
            <div className="text-sm font-semibold">Uploading… {progress}%</div>
            <div className="h-1.5 w-3/4 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-indigo-400 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {isCustom && !uploading && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="absolute right-2 top-2 rounded-full bg-rose-500 px-2.5 py-1 text-xs font-semibold text-white shadow transition hover:bg-rose-600"
          >
            ✕ Remove
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleSelect}
        className="hidden"
      />

      {error && (
        <div className="mt-2 text-xs text-rose-600 dark:text-rose-400">{error}</div>
      )}

      <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <span>📁 Drag & drop or click to upload</span>
        <span>•</span>
        <span>JPG, PNG, WEBP up to 5MB</span>
      </div>
    </div>
  );
}
