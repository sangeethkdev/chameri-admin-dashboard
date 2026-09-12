import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axiosInstance";
import toast from "react-hot-toast";
import { Save, Loader2, Image as ImageIcon, CheckCircle2, UploadCloud } from "lucide-react";
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

// --- Image Upload Field ---
const ImageUploadField = ({
  label, preview, existingUrl, fileInputRef, onChange,
  // The mobile slot holds a portrait crop, so its frame previews at 9:16
  // rather than the landscape default.
  aspectClass = "aspect-video",
  frameWidthClass = "w-full",
}) => (
  <div>
    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">{label}</label>
    <div
      onClick={() => fileInputRef.current?.click()}
      className={`relative ${frameWidthClass} ${aspectClass} rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-brand-300 transition-colors overflow-hidden group`}
    >
      {(preview || existingUrl) ? (
        <>
          <img src={preview || existingUrl} alt={label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
            <UploadCloud size={24} className="mb-2" />
            <span className="text-sm font-semibold">Change Image</span>
          </div>
        </>
      ) : (
        <div className="text-center p-4">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-gray-400">
            <UploadCloud size={20} />
          </div>
          <span className="text-sm font-medium text-gray-500">Click to upload</span>
        </div>
      )}
    </div>
    <input type="file" ref={fileInputRef} onChange={onChange} accept="image/*" className="hidden" />
  </div>
);

// ── Slide Row ────────────────────────────────────────────────────────────────
const SlideRow = ({
  number, text, setText,
  preview, existingUrl, fileInputRef, onFileChange,
  mobilePreview, mobileExistingUrl, mobileFileInputRef, onMobileFileChange,
}) => (
  <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50/50 space-y-4">
    <p className="text-sm font-bold text-gray-700 mb-1">Slide {number}</p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <ImageUploadField
        label={`Image ${number} (Desktop)`}
        preview={preview}
        existingUrl={existingUrl}
        fileInputRef={fileInputRef}
        onChange={onFileChange}
      />
      <InputField
        label={`Text ${number}`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`e.g. Caption or description for slide ${number}`}
      />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div>
        <ImageUploadField
          label={`Image ${number} (Mobile)`}
          preview={mobilePreview}
          existingUrl={mobileExistingUrl}
          fileInputRef={mobileFileInputRef}
          onChange={onMobileFileChange}
          aspectClass="aspect-[9/16]"
          frameWidthClass="w-40"
        />
        <p className="text-xs text-gray-400 mt-1.5">
          Optional — a portrait crop for phones. Leave empty to reuse the desktop image.
        </p>
      </div>
    </div>
  </div>
);

// ── Main Component ───────────────────────────────────────────────────────────
const GalleryHero = () => {
  const qc = useQueryClient();
  const heroFlash = useFlashSuccess();

  // Refs for file inputs
  const firstRef  = useRef(null);
  const secondRef = useRef(null);
  const thirdRef  = useRef(null);

  // Refs for the optional mobile (portrait) file inputs
  const firstMobRef  = useRef(null);
  const secondMobRef = useRef(null);
  const thirdMobRef  = useRef(null);

  // Text state
  const [firstText,  setFirstText]  = useState("");
  const [secondText, setSecondText] = useState("");
  const [thirdText,  setThirdText]  = useState("");

  // Existing image URLs (from DB)
  const [existingFirst,  setExistingFirst]  = useState("");
  const [existingSecond, setExistingSecond] = useState("");
  const [existingThird,  setExistingThird]  = useState("");

  // New file objects
  const [newFirst,  setNewFirst]  = useState(null);
  const [newSecond, setNewSecond] = useState(null);
  const [newThird,  setNewThird]  = useState(null);

  // Preview URLs
  const [previewFirst,  setPreviewFirst]  = useState("");
  const [previewSecond, setPreviewSecond] = useState("");
  const [previewThird,  setPreviewThird]  = useState("");

  /* Optional mobile (portrait) image per slide — same existing/new/preview
     trio as above. Left empty, the public site falls back to the main image. */
  const [existingFirstMob,  setExistingFirstMob]  = useState("");
  const [existingSecondMob, setExistingSecondMob] = useState("");
  const [existingThirdMob,  setExistingThirdMob]  = useState("");

  const [newFirstMob,  setNewFirstMob]  = useState(null);
  const [newSecondMob, setNewSecondMob] = useState(null);
  const [newThirdMob,  setNewThirdMob]  = useState(null);

  const [previewFirstMob,  setPreviewFirstMob]  = useState("");
  const [previewSecondMob, setPreviewSecondMob] = useState("");
  const [previewThirdMob,  setPreviewThirdMob]  = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["gallery-main"],
    queryFn: async () => {
      const res = await api.get("/gallery/main");
      return res.data.data;
    },
  });

  useEffect(() => {
    if (!data) return;
    setFirstText(data?.heroSection?.first?.text   || "");
    setSecondText(data?.heroSection?.second?.text || "");
    setThirdText(data?.heroSection?.third?.text   || "");
    setExistingFirst(data?.heroSection?.first?.image   || "");
    setExistingSecond(data?.heroSection?.second?.image || "");
    setExistingThird(data?.heroSection?.third?.image   || "");
    setExistingFirstMob(data?.heroSection?.first?.mobileImage   || "");
    setExistingSecondMob(data?.heroSection?.second?.mobileImage || "");
    setExistingThirdMob(data?.heroSection?.third?.mobileImage   || "");
  }, [data]);

  const handleFile = (setNew, setPreview) => (e) => {
    const file = e.target.files[0];
    if (file) {
      setNew(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const heroMutation = useMutation({
    mutationFn: async () => {
      // New images go straight to Cloudinary from the browser — this avoids
      // routing large photos through the backend's serverless function,
      // which rejects anything over ~4.5MB.
      const uploadIfNew = async (file, existingUrl) => {
        if (!file) return existingUrl;
        const { url } = await uploadToCloudinary(file, { folder: "chameri/gallery" });
        return url;
      };

      const [
        firstImage, secondImage, thirdImage,
        firstMobileImage, secondMobileImage, thirdMobileImage,
      ] = await Promise.all([
        uploadIfNew(newFirst, existingFirst),
        uploadIfNew(newSecond, existingSecond),
        uploadIfNew(newThird, existingThird),
        uploadIfNew(newFirstMob, existingFirstMob),
        uploadIfNew(newSecondMob, existingSecondMob),
        uploadIfNew(newThirdMob, existingThirdMob),
      ]);

      return api.put("/gallery/main/hero", {
        firstText,
        secondText,
        thirdText,
        firstImage,
        secondImage,
        thirdImage,
        firstMobileImage,
        secondMobileImage,
        thirdMobileImage,
      });
    },
    onSuccess: () => {
      heroFlash.flash();
      setNewFirst(null);
      setNewSecond(null);
      setNewThird(null);
      setPreviewFirst("");
      setPreviewSecond("");
      setPreviewThird("");
      setNewFirstMob(null);
      setNewSecondMob(null);
      setNewThirdMob(null);
      setPreviewFirstMob("");
      setPreviewSecondMob("");
      setPreviewThirdMob("");
      qc.invalidateQueries(["gallery-main"]);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to save Gallery Hero section"),
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
      {/* Page Header */}
      <div className="bg-dark-800 p-6 rounded-3xl mb-6 shadow-sm border border-surface-border">
        <h1 className="text-2xl font-bold text-white">Gallery — Hero Section</h1>
        <p className="text-gray-400 text-sm mt-1">
          Manage the three hero slides for the Gallery page.
        </p>
      </div>

      <FormCard
        title="Hero Section"
        icon={ImageIcon}
        onSave={() => heroMutation.mutate()}
        isSaving={heroMutation.isPending}
        saved={heroFlash.saved}
      >
        <SlideRow
          number={1}
          text={firstText}
          setText={setFirstText}
          preview={previewFirst}
          existingUrl={existingFirst}
          fileInputRef={firstRef}
          onFileChange={handleFile(setNewFirst, setPreviewFirst)}
          mobilePreview={previewFirstMob}
          mobileExistingUrl={existingFirstMob}
          mobileFileInputRef={firstMobRef}
          onMobileFileChange={handleFile(setNewFirstMob, setPreviewFirstMob)}
        />
        <SlideRow
          number={2}
          text={secondText}
          setText={setSecondText}
          preview={previewSecond}
          existingUrl={existingSecond}
          fileInputRef={secondRef}
          onFileChange={handleFile(setNewSecond, setPreviewSecond)}
          mobilePreview={previewSecondMob}
          mobileExistingUrl={existingSecondMob}
          mobileFileInputRef={secondMobRef}
          onMobileFileChange={handleFile(setNewSecondMob, setPreviewSecondMob)}
        />
        <SlideRow
          number={3}
          text={thirdText}
          setText={setThirdText}
          preview={previewThird}
          existingUrl={existingThird}
          fileInputRef={thirdRef}
          onFileChange={handleFile(setNewThird, setPreviewThird)}
          mobilePreview={previewThirdMob}
          mobileExistingUrl={existingThirdMob}
          mobileFileInputRef={thirdMobRef}
          onMobileFileChange={handleFile(setNewThirdMob, setPreviewThirdMob)}
        />
      </FormCard>
    </div>
  );
};

export default GalleryHero;
