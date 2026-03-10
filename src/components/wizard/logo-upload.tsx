"use client";

import { useRef, useState } from "react";

const MAX_SIZE = 500 * 1024; // 500KB
const ACCEPTED = "image/png, image/jpeg, image/svg+xml";

interface LogoUploadProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}

export function LogoUpload({ value, onChange }: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setError(null);

    if (!["image/png", "image/jpeg", "image/svg+xml"].includes(file.type)) {
      setError("Please upload a PNG, JPEG, or SVG image.");
      return;
    }

    if (file.size > MAX_SIZE) {
      setError("Image must be under 500KB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      onChange(dataUrl);
      try {
        sessionStorage.setItem("peec_client_logo", dataUrl);
      } catch {
        // sessionStorage quota exceeded — ignore
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    onChange(null);
    sessionStorage.removeItem("peec_client_logo");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium mb-2">Client Logo (optional)</label>
      {value ? (
        <div className="flex items-center gap-3">
          <div className="h-12 w-auto rounded border border-[var(--peec-border)] p-1 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Client logo"
              className="h-full w-auto object-contain"
              style={{ maxWidth: 160 }}
            />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="text-sm text-[var(--peec-error)] hover:underline"
          >
            Remove
          </button>
        </div>
      ) : (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            className="block w-full text-sm text-[var(--peec-text-muted)] file:mr-3 file:rounded-lg file:border file:border-[var(--peec-border)] file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[var(--peec-text)] hover:file:bg-gray-50 file:cursor-pointer"
          />
          <p className="mt-1 text-xs text-[var(--peec-text-muted)]">PNG, JPEG, or SVG — max 500KB</p>
        </div>
      )}
      {error && <p className="mt-1 text-xs text-[var(--peec-error)]">{error}</p>}
    </div>
  );
}
