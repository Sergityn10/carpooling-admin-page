import { useRef } from "react";

type Props = {
  value?: string | null;
  onChange: (base64: string | null) => void;
  label?: string;
};

export default function ImageInput({ value, onChange, label = "Imagen" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      onChange(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <label className="text-xs font-medium text-gray-600">{label}</label>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="mt-1 flex items-center gap-3"
      >
        {value ? (
          <img
            src={value}
            alt=""
            className="h-20 w-20 rounded-lg border border-panel-200 object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-panel-200 text-xs text-gray-400">
            Sin imagen
          </div>
        )}
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-lg border border-panel-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-panel-50"
          >
            Subir imagen
          </button>
          {value ? (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-xs font-medium text-red-600 hover:text-red-700"
            >
              Quitar
            </button>
          ) : null}
          <span className="text-xs text-gray-400">
            Arrastra o selecciona (JPG, PNG)
          </span>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
