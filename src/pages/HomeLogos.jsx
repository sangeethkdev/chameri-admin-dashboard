import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axiosInstance";
import toast from "react-hot-toast";
import { Loader2, Image as ImageIcon, CheckCircle, UploadCloud, X } from "lucide-react";
import { uploadToCloudinary } from "../lib/cloudinaryUpload";

// --- Custom Hook for flash success ---
const useFlashSuccess = (duration = 2000) => {
  const [saved, setSaved] = useState(false);
  const flash = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), duration);
  };
  return { saved, flash };
};

// --- Reusable Form Card Component ---
const FormCard = ({ title, icon: Icon, children, onSave, isSaving, saved }) => {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/50 mb-6 relative overflow-hidden transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-brand-600 shadow-sm border border-gray-100">
          <Icon size={20} strokeWidth={2.5} />
        </div>
        <h2 className="text-lg font-bold text-gray-800 tracking-tight">{title}</h2>
      </div>

      <div className="space-y-5">{children}</div>

      <div className="mt-6 flex justify-end items-center gap-3 border-t border-gray-50 pt-5">
        {/* Success Banner */}
        <div
          className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl bg-green-50 text-green-600 border border-green-100 transition-all duration-300 ease-in-out ${
            saved ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 pointer-events-none absolute right-40"
          }`}
        >
          <CheckCircle size={16} /> Saved!
        </div>

        <button
          onClick={onSave}
          disabled={isSaving}
          className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center min-w-[120px] ${
            isSaving
              ? "bg-amber-100 text-amber-700 shadow-inner scale-95 cursor-not-allowed"
              : "bg-brand-600 text-white shadow-md hover:bg-brand-700 hover:shadow-lg active:scale-95"
          }`}
        >
          {isSaving ? (
            <span className="flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Saving...
            </span>
          ) : (
            "Save Section"
          )}
        </button>
      </div>
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────
const HomeLogos = () => {
  const qc = useQueryClient();
  const logosFlash = useFlashSuccess();

  // State
  const [existingLogos, setExistingLogos] = useState([]);
  const [newLogos, setNewLogos] = useState([]);

  // Fetch Data
  const { data, isLoading } = useQuery({
    queryKey: ["home-main"],
    queryFn: async () => {
      const res = await api.get("/home/main");
      return res.data.data;
    },
  });

  // Seed data
  useEffect(() => {
    if (!data) return;
    setExistingLogos(data?.logos || []);
  }, [data]);

  // Handlers
  const handleLogosChange = (e) => {
    const files = Array.from(e.target.files);
    const newPreviews = files.map(file => ({ file, preview: URL.createObjectURL(file) }));
    setNewLogos(prev => [...prev, ...newPreviews]);
  };

  const removeExistingLogo = (url) => setExistingLogos(prev => prev.filter(u => u !== url));
  const removeNewLogo = (index) => setNewLogos(prev => prev.filter((_, i) => i !== index));

  // Mutation
  const logosMutation = useMutation({
    mutationFn: async () => {
      // New logos go straight to Cloudinary from the browser — this avoids
      // routing photos through the backend's serverless function, which
      // rejects anything over ~4.5MB.
      const uploaded = await Promise.all(
        newLogos.map(({ file }) => uploadToCloudinary(file, { folder: "chameri/home" }))
      );
      const homeLogos = [...existingLogos, ...uploaded.map((r) => r.url)];

      return api.put("/home/main/logos", { homeLogos });
    },
    onSuccess: () => {
      logosFlash.flash();
      setNewLogos([]); // Clear previews after successful upload
      qc.invalidateQueries(["home-main"]);
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to save Logos section"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl pb-10">
      {/* Header */}
      <div className="bg-dark-800 p-6 rounded-3xl mb-6 shadow-sm border border-surface-border">
        <h1 className="text-2xl font-bold text-white">Home — Logos Section</h1>
        <p className="text-gray-400 text-sm mt-1">Manage the partner/client logos displayed on the Home page.</p>
      </div>

      {/* ── Logos Section ── */}
      <FormCard
        title="Partner / Client Logos"
        icon={ImageIcon}
        onSave={() => logosMutation.mutate()}
        isSaving={logosMutation.isPending}
        saved={logosFlash.saved}
      >
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 block">Upload Logos</label>
          <div className="relative w-full h-32 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-brand-300 transition-colors group">
            <UploadCloud size={24} className="text-gray-400 mb-2 group-hover:text-brand-400 transition-colors" />
            <span className="text-sm font-semibold text-gray-600">Click to select files</span>
            <span className="text-xs text-gray-400 mt-1">Supports PNG, JPG, WEBP</span>
            <input
              type="file"
              multiple
              accept="image/*"
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              onChange={handleLogosChange}
            />
          </div>
        </div>

        {/* Previews for Existing Logos */}
        {existingLogos.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Current Logos</h3>
            <div className="flex flex-wrap gap-4">
              {existingLogos.map((url, i) => (
                <div key={i} className="relative w-24 h-24 rounded-xl border border-gray-200 bg-white flex items-center justify-center group overflow-hidden shadow-sm">
                  <img src={url} alt={`logo-${i}`} className="max-w-full max-h-full object-contain p-2" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => removeExistingLogo(url)}
                      className="p-1.5 bg-red-500 rounded-lg text-white hover:bg-red-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Previews for New Logos */}
        {newLogos.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">New Logos (Pending Save)</h3>
            <div className="flex flex-wrap gap-4">
              {newLogos.map(({ preview }, i) => (
                <div key={i} className="relative w-24 h-24 rounded-xl border border-brand-200 bg-brand-50 flex items-center justify-center group overflow-hidden shadow-sm">
                  <img src={preview} alt={`new-logo-${i}`} className="max-w-full max-h-full object-contain p-2" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => removeNewLogo(i)}
                      className="p-1.5 bg-red-500 rounded-lg text-white hover:bg-red-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </FormCard>
    </div>
  );
};

export default HomeLogos;
