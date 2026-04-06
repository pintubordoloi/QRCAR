export function LogoUploader({ logoSrc, onUpload, onClear }) {
  const handleFile = (file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      onUpload(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (event) => {
    const [file] = event.target.files ?? [];
    handleFile(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const presetUrl = event.dataTransfer.getData('text/preset-asset-url') || event.dataTransfer.getData('text/plain');
    const [file] = event.dataTransfer.files ?? [];

    if (presetUrl) {
      onUpload(presetUrl);
      return;
    }

    handleFile(file);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="label">Logo</p>
          <h3 className="mt-2 font-display text-lg font-bold text-white">Center mark upload</h3>
        </div>
        {logoSrc ? (
          <button
            type="button"
            onClick={onClear}
            className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-300 transition hover:border-rose-300/40 hover:text-rose-200"
          >
            Remove
          </button>
        ) : null}
      </div>
      <label
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        className="flex cursor-pointer items-center justify-center rounded-3xl border border-dashed border-white/15 bg-slate-950/50 px-4 py-8 text-center transition hover:border-cyan-300/40 hover:bg-white/5"
      >
        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <div className="space-y-2">
          <p className="font-semibold text-white">{logoSrc ? 'Replace logo image' : 'Upload or drop preset image'}</p>
          <p className="text-sm text-slate-400">You can also drag images from the preset asset list into this area.</p>
        </div>
      </label>
    </div>
  );
}
