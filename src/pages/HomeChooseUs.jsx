import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axiosInstance";
import toast from "react-hot-toast";
import { Loader2, Star, CheckCircle, UploadCloud } from "lucide-react";
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

// --- Input Field Component ---
const InputField = ({ label, value, onChange, placeholder, isTextarea }) => (
  <div>
    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">
      {label}
    </label>
    {isTextarea ? (
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={3}
        className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 block p-3 transition-colors outline-none resize-none"
      />
    ) : (
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 block p-3 transition-colors outline-none"
      />
    )}
  </div>
);

// ── Main Component ───────────────────────────────────────────────────────────
const HomeChooseUs = () => {
  const qc = useQueryClient();
  const chooseUsFlash = useFlashSuccess();

  // Refs for image uploads
  const card1ImgRef = useRef(null);
  const card2ImgRef = useRef(null);
  const card3ImgRef = useRef(null);

  // State
  const [heading, setHeading] = useState("");
  const [subheading, setSubheading] = useState("");
  
  const [card1Heading, setCard1Heading] = useState("");
  const [card1Subheading, setCard1Subheading] = useState("");
  const [card1ExistingImage, setCard1ExistingImage] = useState("");
  const [card1NewImage, setCard1NewImage] = useState(null);
  const [card1Preview, setCard1Preview] = useState("");

  const [card2Heading, setCard2Heading] = useState("");
  const [card2Subheading, setCard2Subheading] = useState("");
  const [card2ExistingImage, setCard2ExistingImage] = useState("");
  const [card2NewImage, setCard2NewImage] = useState(null);
  const [card2Preview, setCard2Preview] = useState("");

  const [card3Heading, setCard3Heading] = useState("");
  const [card3Subheading, setCard3Subheading] = useState("");
  const [card3ExistingImage, setCard3ExistingImage] = useState("");
  const [card3NewImage, setCard3NewImage] = useState(null);
  const [card3Preview, setCard3Preview] = useState("");

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
    setHeading(data?.chooseUs?.heading || "");
    setSubheading(data?.chooseUs?.subheading || "");
    
    setCard1Heading(data?.chooseUs?.card1?.heading || "");
    setCard1Subheading(data?.chooseUs?.card1?.subheading || "");
    setCard1ExistingImage(data?.chooseUs?.card1?.image || "");
    setCard1NewImage(null);
    setCard1Preview("");

    setCard2Heading(data?.chooseUs?.card2?.heading || "");
    setCard2Subheading(data?.chooseUs?.card2?.subheading || "");
    setCard2ExistingImage(data?.chooseUs?.card2?.image || "");
    setCard2NewImage(null);
    setCard2Preview("");

    setCard3Heading(data?.chooseUs?.card3?.heading || "");
    setCard3Subheading(data?.chooseUs?.card3?.subheading || "");
    setCard3ExistingImage(data?.chooseUs?.card3?.image || "");
    setCard3NewImage(null);
    setCard3Preview("");
  }, [data]);

  // Mutation
  const chooseUsMutation = useMutation({
    mutationFn: async () => {
      // New images go straight to Cloudinary from the browser — this avoids
      // routing large photos through the backend's serverless function,
      // which rejects anything over ~4.5MB.
      const card1Image = card1NewImage
        ? (await uploadToCloudinary(card1NewImage, { folder: "chameri/home" })).url
        : card1ExistingImage;
      const card2Image = card2NewImage
        ? (await uploadToCloudinary(card2NewImage, { folder: "chameri/home" })).url
        : card2ExistingImage;
      const card3Image = card3NewImage
        ? (await uploadToCloudinary(card3NewImage, { folder: "chameri/home" })).url
        : card3ExistingImage;

      return api.put("/home/main/chooseus", {
        heading,
        subheading,
        card1Heading,
        card1Subheading,
        card1Image,
        card2Heading,
        card2Subheading,
        card2Image,
        card3Heading,
        card3Subheading,
        card3Image,
      });
    },
    onSuccess: () => {
      chooseUsFlash.flash();
      setCard1NewImage(null);
      setCard1Preview("");
      setCard2NewImage(null);
      setCard2Preview("");
      setCard3NewImage(null);
      setCard3Preview("");
      qc.invalidateQueries(["home-main"]);
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to save Choose Us section"),
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
      {/* Header */}
      <div className="bg-dark-800 p-6 rounded-3xl mb-6 shadow-sm border border-surface-border">
        <h1 className="text-2xl font-bold text-white">Home — Choose Us Section</h1>
        <p className="text-gray-400 text-sm mt-1">Manage the 'Why Choose Us' section and its 3 feature cards.</p>
      </div>

      {/* ── Choose Us Section ── */}
      <FormCard
        title="Why Choose Us Details"
        icon={Star}
        onSave={() => chooseUsMutation.mutate()}
        isSaving={chooseUsMutation.isPending}
        saved={chooseUsFlash.saved}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <InputField 
            label="Heading" 
            value={heading} 
            onChange={e => setHeading(e.target.value)} 
            placeholder="e.g. Why Choose Us?" 
          />
          <InputField 
            label="Subheading" 
            value={subheading} 
            onChange={e => setSubheading(e.target.value)} 
            placeholder="e.g. We provide the best service in the industry." 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1 */}
          <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-4 relative">
            <p className="text-xs font-black uppercase tracking-widest text-brand-500 absolute top-4 right-4">Card 1</p>
            
            {/* Image Upload */}
            <div className="pt-4">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">Image</label>
              <div
                onClick={() => card1ImgRef.current?.click()}
                className="relative w-full h-32 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-brand-300 transition-colors overflow-hidden group"
              >
                {(card1Preview || card1ExistingImage) ? (
                  <>
                    <img
                      src={card1Preview || card1ExistingImage}
                      alt="Card 1"
                      className="max-w-full max-h-full object-contain p-2"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                      <UploadCloud size={20} className="mb-1" />
                      <span className="text-xs font-semibold">Change Image</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <UploadCloud size={20} className="mx-auto mb-2 text-gray-400" />
                    <span className="text-xs font-medium text-gray-500">Click to upload</span>
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={card1ImgRef}
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const f = e.target.files[0];
                  if (!f) return;
                  setCard1NewImage(f);
                  setCard1Preview(URL.createObjectURL(f));
                }}
              />
            </div>
            
            <InputField label="Card Heading" value={card1Heading} onChange={e => setCard1Heading(e.target.value)} placeholder="e.g. Expert Team" />
            <InputField label="Card Subheading" value={card1Subheading} onChange={e => setCard1Subheading(e.target.value)} placeholder="e.g. Details about expert team..." isTextarea />
          </div>

          {/* Card 2 */}
          <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-4 relative">
            <p className="text-xs font-black uppercase tracking-widest text-brand-500 absolute top-4 right-4">Card 2</p>
            
            {/* Image Upload */}
            <div className="pt-4">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">Image</label>
              <div
                onClick={() => card2ImgRef.current?.click()}
                className="relative w-full h-32 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-brand-300 transition-colors overflow-hidden group"
              >
                {(card2Preview || card2ExistingImage) ? (
                  <>
                    <img
                      src={card2Preview || card2ExistingImage}
                      alt="Card 2"
                      className="max-w-full max-h-full object-contain p-2"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                      <UploadCloud size={20} className="mb-1" />
                      <span className="text-xs font-semibold">Change Image</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <UploadCloud size={20} className="mx-auto mb-2 text-gray-400" />
                    <span className="text-xs font-medium text-gray-500">Click to upload</span>
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={card2ImgRef}
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const f = e.target.files[0];
                  if (!f) return;
                  setCard2NewImage(f);
                  setCard2Preview(URL.createObjectURL(f));
                }}
              />
            </div>
            
            <InputField label="Card Heading" value={card2Heading} onChange={e => setCard2Heading(e.target.value)} placeholder="e.g. Quality Work" />
            <InputField label="Card Subheading" value={card2Subheading} onChange={e => setCard2Subheading(e.target.value)} placeholder="e.g. Details about quality work..." isTextarea />
          </div>

          {/* Card 3 */}
          <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-4 relative">
            <p className="text-xs font-black uppercase tracking-widest text-brand-500 absolute top-4 right-4">Card 3</p>
            
            {/* Image Upload */}
            <div className="pt-4">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">Image</label>
              <div
                onClick={() => card3ImgRef.current?.click()}
                className="relative w-full h-32 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-brand-300 transition-colors overflow-hidden group"
              >
                {(card3Preview || card3ExistingImage) ? (
                  <>
                    <img
                      src={card3Preview || card3ExistingImage}
                      alt="Card 3"
                      className="max-w-full max-h-full object-contain p-2"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                      <UploadCloud size={20} className="mb-1" />
                      <span className="text-xs font-semibold">Change Image</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <UploadCloud size={20} className="mx-auto mb-2 text-gray-400" />
                    <span className="text-xs font-medium text-gray-500">Click to upload</span>
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={card3ImgRef}
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const f = e.target.files[0];
                  if (!f) return;
                  setCard3NewImage(f);
                  setCard3Preview(URL.createObjectURL(f));
                }}
              />
            </div>
            
            <InputField label="Card Heading" value={card3Heading} onChange={e => setCard3Heading(e.target.value)} placeholder="e.g. 24/7 Support" />
            <InputField label="Card Subheading" value={card3Subheading} onChange={e => setCard3Subheading(e.target.value)} placeholder="e.g. Details about support..." isTextarea />
          </div>

        </div>
      </FormCard>
    </div>
  );
};

export default HomeChooseUs;
