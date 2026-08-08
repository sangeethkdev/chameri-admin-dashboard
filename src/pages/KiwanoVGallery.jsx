import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axiosInstance";
import toast from "react-hot-toast";
import { Save, Loader2, Image as ImageIcon, CheckCircle2, UploadCloud, X } from "lucide-react";
import { uploadToCloudinary } from "../lib/cloudinaryUpload";

// --- Custom Hook ---
const useFlashSuccess = () => {
  const [saved, setSaved] = useState(false);
  const timerRef = useRef(null);
  const flash = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSaved(true);
    timerRef.current = setTimeout(() => setSaved(false), 2000);
  }, []);
  useEffect(() => () => clearTimeout(timerRef.current), []);
  return { saved, flash };
};

// --- Save Button ---
const SectionSaveBtn = ({ isLoading, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={isLoading}
    className={`ml-auto flex items-center gap-2 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all duration-300 shadow-glow-sm disabled:cursor-not-allowed
      ${isLoading ? "bg-amber-500 shadow-amber-200/40 scale-95" : "bg-brand-500 hover:bg-brand-400 hover:shadow-glow-md"}`}
  >
    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
    {isLoading ? "Saving..." : "Save"}
  </button>
);

// --- Form Card ---
const FormCard = ({ title, icon: Icon, onSave, isSaving, saved, children }) => (
  <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm mb-6 animate-fade-in">
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-50">
      <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500">
        <Icon size={20} />
      </div>
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      <SectionSaveBtn isLoading={isSaving} onClick={onSave} />
    </div>
    <div className="space-y-5">{children}</div>
    <div
      className={`mt-5 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold transition-all duration-500
        ${saved ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none"}`}
    >
      <CheckCircle2 size={16} className="shrink-0" /> Saved successfully!
    </div>
  </div>
);

// --- Input Field ---
const InputField = ({ label, value, onChange, placeholder }) => (
  <div>
    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">{label}</label>
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-brand-500 transition-colors bg-gray-50/50 focus:bg-white"
    />
  </div>
);

// --- Image Group Uploader ---
const ImageGroupUploader = ({ label, existingImages, newImages, onFilesAdded, onRemoveExisting, onRemoveNew }) => {
  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesAdded(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div className="space-y-4">
      <label className="text-sm font-bold uppercase tracking-widest text-gray-500">{label}</label>

      {/* Upload Area */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="w-full border-2 border-dashed border-gray-300 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 hover:border-brand-400 cursor-pointer transition-colors"
      >
        <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
          <UploadCloud className="text-gray-400" size={28} />
        </div>
        <p className="text-gray-600 font-medium">Click or drag images here to upload</p>
        <p className="text-xs text-gray-400 mt-2">Supports JPG, PNG, WEBP</p>
      </div>
      <input
        type="file"
        multiple
        accept="image/*"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onFilesAdded(Array.from(e.target.files));
          }
        }}
        className="hidden"
      />

      {/* Grid of Images */}
      {(existingImages.length > 0 || newImages.length > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
          {existingImages.map((url, idx) => (
            <div key={`existing-${idx}`} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 bg-white">
              <img src={url} alt={`Existing ${idx}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <button
                type="button"
                onClick={() => onRemoveExisting(url)}
                className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          {newImages.map((file, idx) => (
            <div key={`new-${idx}`} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-brand-200 bg-white">
              <img src={URL.createObjectURL(file)} alt={`New ${idx}`} className="w-full h-full object-cover opacity-80" />
              <div className="absolute top-2 left-2 bg-brand-500 text-white text-[10px] font-bold px-2 py-1 rounded-md">NEW</div>
              <button
                type="button"
                onClick={() => onRemoveNew(idx)}
                className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────
const KiwanoVGallery = () => {
  const qc = useQueryClient();
  const galleryFlash = useFlashSuccess();

  // State
  const [heading, setHeading] = useState("");

  const [existingExterior, setExistingExterior] = useState([]);
  const [newExterior, setNewExterior] = useState([]);

  const [existingInterior, setExistingInterior] = useState([]);
  const [newInterior, setNewInterior] = useState([]);

  const [existingAmenities, setExistingAmenities] = useState([]);
  const [newAmenities, setNewAmenities] = useState([]);

  const { data, isLoading } = useQuery({
    queryKey: ["kiwano-villament-main"],
    queryFn: async () => {
      const res = await api.get("/kiwano-villament/main");
      return res.data.data;
    },
  });

  useEffect(() => {
    if (!data) return;
    setHeading(data?.gallerySection?.heading || "");
    setExistingExterior(data?.gallerySection?.exteriorImages || []);
    setExistingInterior(data?.gallerySection?.interiorImages || []);
    setExistingAmenities(data?.gallerySection?.amenitiesImages || []);
  }, [data]);

  const galleryMutation = useMutation({
    mutationFn: async () => {
      // New images go straight to Cloudinary from the browser — this avoids
      // routing large or multiple photos through the backend's serverless
      // function, which rejects anything over ~4.5MB.
      const uploadCategory = async (files) => {
        const uploaded = await Promise.all(
          files.map((file) => uploadToCloudinary(file, { folder: "chameri/kiwano-villament" }))
        );
        return uploaded.map((r) => r.url);
      };

      const [exteriorUrls, interiorUrls, amenitiesUrls] = await Promise.all([
        uploadCategory(newExterior),
        uploadCategory(newInterior),
        uploadCategory(newAmenities),
      ]);

      return api.put("/kiwano-villament/main/gallery-section", {
        heading,
        exteriorImages: [...existingExterior, ...exteriorUrls],
        interiorImages: [...existingInterior, ...interiorUrls],
        amenitiesImages: [...existingAmenities, ...amenitiesUrls],
      });
    },
    onSuccess: () => {
      galleryFlash.flash();
      setNewExterior([]);
      setNewInterior([]);
      setNewAmenities([]);
      qc.invalidateQueries(["kiwano-villament-main"]);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to save Gallery section"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl pb-10">
      {/* Page Header */}
      <div className="bg-dark-800 p-6 rounded-3xl mb-6 shadow-sm border border-surface-border">
        <h1 className="text-2xl font-bold text-white">Kiwano Villament — Gallery Section</h1>
        <p className="text-gray-400 text-sm mt-1">
          Manage the Kiwano Villament image galleries for exterior, interior, and amenities.
        </p>
      </div>

      <FormCard
        title="Gallery Settings"
        icon={ImageIcon}
        onSave={() => galleryMutation.mutate()}
        isSaving={galleryMutation.isPending}
        saved={galleryFlash.saved}
      >
        <div className="mb-6">
          <InputField
            label="Heading"
            value={heading}
            onChange={e => setHeading(e.target.value)}
            placeholder="e.g. Gallery & Amenities"
          />
        </div>

        <div className="space-y-10">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <ImageGroupUploader
              label="Exterior Images"
              existingImages={existingExterior}
              newImages={newExterior}
              onFilesAdded={files => setNewExterior(prev => [...prev, ...files])}
              onRemoveExisting={url => setExistingExterior(prev => prev.filter(u => u !== url))}
              onRemoveNew={idx => setNewExterior(prev => prev.filter((_, i) => i !== idx))}
            />
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <ImageGroupUploader
              label="Interior Images"
              existingImages={existingInterior}
              newImages={newInterior}
              onFilesAdded={files => setNewInterior(prev => [...prev, ...files])}
              onRemoveExisting={url => setExistingInterior(prev => prev.filter(u => u !== url))}
              onRemoveNew={idx => setNewInterior(prev => prev.filter((_, i) => i !== idx))}
            />
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <ImageGroupUploader
              label="Amenities Images"
              existingImages={existingAmenities}
              newImages={newAmenities}
              onFilesAdded={files => setNewAmenities(prev => [...prev, ...files])}
              onRemoveExisting={url => setExistingAmenities(prev => prev.filter(u => u !== url))}
              onRemoveNew={idx => setNewAmenities(prev => prev.filter((_, i) => i !== idx))}
            />
          </div>
        </div>
      </FormCard>
    </div>
  );
};

export default KiwanoVGallery;
