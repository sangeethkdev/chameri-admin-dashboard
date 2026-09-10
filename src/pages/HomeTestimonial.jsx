import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axiosInstance";
import toast from "react-hot-toast";
import { Loader2, MessageSquare, CheckCircle, UploadCloud, Plus, X } from "lucide-react";
import { uploadToCloudinary } from "../lib/cloudinaryUpload";
import CardMediaPicker from "../components/CardMediaPicker";
import { getYoutubeId, MAX_VIDEO_BYTES } from "../lib/cardMedia";

const makeBlankCard = (id) => ({
  id,
  quote: "",
  name: "",
  designation: "",
  existingImage: "",
  newImage: null,
  preview: "",
  cardMediaType: "image",
  existingCardImage: "",
  newCardImage: null,
  cardImagePreview: "",
  existingCardVideo: "",
  newCardVideo: null,
  cardVideoPreview: "",
  cardYoutubeUrl: "",
});

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
const HomeTestimonial = () => {
  const qc = useQueryClient();
  const testimonialFlash = useFlashSuccess();

  const MIN_CARDS = 4;

  // State
  const [heading, setHeading] = useState("");
  const [subheading, setSubheading] = useState("");
  const [cards, setCards] = useState([]);

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
    
    setHeading(data.testimonial?.heading || "");
    setSubheading(data.testimonial?.subheading || "");
    
    let initialCards = [];
    if (data.testimonial?.cards && data.testimonial.cards.length > 0) {
      initialCards = data.testimonial.cards.map((card, idx) => ({
        ...makeBlankCard(Date.now() + idx),
        quote: card.quote || "",
        name: card.name || "",
        designation: card.designation || "",
        existingImage: card.image || "",
        // Older cards have no cardMediaType — treat them as images.
        cardMediaType: card.cardMediaType || "image",
        existingCardImage: card.cardImage || "",
        existingCardVideo: card.cardVideo || "",
        cardYoutubeUrl: card.cardYoutubeUrl || "",
      }));
    }

    // Ensure we have at least MIN_CARDS
    while (initialCards.length < MIN_CARDS) {
      initialCards.push(makeBlankCard(Date.now() + initialCards.length));
    }

    setCards(initialCards);
  }, [data]);

  // Handlers
  const addCard = () => {
    setCards([...cards, makeBlankCard(Date.now())]);
  };

  const removeCard = (id) => {
    if (cards.length <= MIN_CARDS) {
      toast.error(`Minimum ${MIN_CARDS} testimonial cards required.`);
      return;
    }
    setCards(cards.filter(c => c.id !== id));
  };

  const updateCard = (id, field, value) => {
    setCards(cards.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleImageChange = (id, file) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setCards(cards.map(c => c.id === id ? { ...c, newImage: file, preview } : c));
  };

  const handleCardImageChange = (id, file) => {
    if (!file) return;
    const cardImagePreview = URL.createObjectURL(file);
    setCards(cards.map(c => c.id === id ? { ...c, newCardImage: file, cardImagePreview } : c));
  };

  const handleCardVideoChange = (id, file) => {
    if (!file) return;
    // Cloudinary's free tier caps a single upload at 100MB; catching it here
    // gives a clear message instead of a failed request after a long upload.
    if (file.size > MAX_VIDEO_BYTES) {
      toast.error("Video is too large. Please keep it under 100MB.");
      return;
    }
    const cardVideoPreview = URL.createObjectURL(file);
    setCards(cards.map(c => c.id === id ? { ...c, newCardVideo: file, cardVideoPreview } : c));
  };

  // Mutation
  const testimonialMutation = useMutation({
    mutationFn: async () => {
      // Reject malformed YouTube links up front — otherwise the card saves
      // fine and then silently renders nothing on the public site.
      const badYoutube = cards.findIndex(
        (c) => c.cardMediaType === "youtube" && !getYoutubeId(c.cardYoutubeUrl)
      );
      if (badYoutube !== -1) {
        throw new Error(`Testimonial ${badYoutube + 1}: enter a valid YouTube link.`);
      }

      // New images go straight to Cloudinary from the browser — this avoids
      // routing photos through the backend's serverless function, which
      // rejects anything over ~4.5MB. Each card's `image`/`cardImage` URLs
      // are resolved here (existing URL kept, or newly uploaded) and the
      // fully-resolved list is sent as plain JSON.
      const testimonialsData = await Promise.all(
        cards.map(async (card) => {
          const mediaType = card.cardMediaType || "image";

          // Only upload/send the asset for the selected media type — the
          // backend clears the other two, so uploading them would just
          // orphan files in Cloudinary.
          const cardImage =
            mediaType === "image"
              ? card.newCardImage
                ? (await uploadToCloudinary(card.newCardImage, { folder: "chameri/home" })).url
                : card.existingCardImage || ""
              : "";

          const cardVideo =
            mediaType === "video"
              ? card.newCardVideo
                ? (await uploadToCloudinary(card.newCardVideo, { folder: "chameri/home", resourceType: "video" })).url
                : card.existingCardVideo || ""
              : "";

          return {
            quote: card.quote,
            name: card.name,
            designation: card.designation,
            image: card.newImage
              ? (await uploadToCloudinary(card.newImage, { folder: "chameri/home" })).url
              : card.existingImage || "",
            cardMediaType: mediaType,
            cardImage,
            cardVideo,
            cardYoutubeUrl: mediaType === "youtube" ? (card.cardYoutubeUrl || "").trim() : "",
          };
        })
      );

      return api.put("/home/main/testimonial", {
        heading,
        subheading,
        testimonialsData,
      });
    },
    onSuccess: () => {
      testimonialFlash.flash();
      qc.invalidateQueries(["home-main"]);
    },
    // err.message carries the client-side validation failures thrown above,
    // which have no response body of their own.
    onError: (err) => toast.error(err.response?.data?.message || err.message || "Failed to save Testimonial section"),
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
        <h1 className="text-2xl font-bold text-white">Home — Testimonial Section</h1>
        <p className="text-gray-400 text-sm mt-1">Manage the dynamically scaling client testimonials list. Minimum {MIN_CARDS} required.</p>
      </div>

      {/* ── Testimonials Section ── */}
      <FormCard
        title="Testimonial Details"
        icon={MessageSquare}
        onSave={() => testimonialMutation.mutate()}
        isSaving={testimonialMutation.isPending}
        saved={testimonialFlash.saved}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <InputField 
            label="Heading" 
            value={heading} 
            onChange={e => setHeading(e.target.value)} 
            placeholder="e.g. What Our Clients Say" 
          />
          <InputField 
            label="Subheading" 
            value={subheading} 
            onChange={e => setSubheading(e.target.value)} 
            placeholder="e.g. Discover why people love our work." 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {cards.map((card, index) => (
            <div key={card.id} className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-4 relative group">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-black uppercase tracking-widest text-brand-500">Testimonial {index + 1}</p>
                {cards.length > MIN_CARDS && (
                  <button
                    onClick={() => removeCard(card.id)}
                    className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                    title="Remove Card"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              
              {/* Image Upload */}
              <div className="pt-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">Client Photo</label>
                <div
                  className="relative w-20 h-20 rounded-full border-2 border-dashed border-gray-200 bg-white flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-brand-300 transition-colors overflow-hidden group/img"
                >
                  {(card.preview || card.existingImage) ? (
                    <>
                      <img
                        src={card.preview || card.existingImage}
                        alt={`Client ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <UploadCloud size={16} />
                      </div>
                    </>
                  ) : (
                    <UploadCloud size={20} className="text-gray-400" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    onChange={e => handleImageChange(card.id, e.target.files[0])}
                  />
                </div>
              </div>
              
              <CardMediaPicker
                mediaType={card.cardMediaType}
                onMediaTypeChange={(v) => updateCard(card.id, "cardMediaType", v)}
                imagePreview={card.cardImagePreview}
                existingImage={card.existingCardImage}
                onImageChange={(file) => handleCardImageChange(card.id, file)}
                videoPreview={card.cardVideoPreview}
                existingVideo={card.existingCardVideo}
                onVideoChange={(file) => handleCardVideoChange(card.id, file)}
                youtubeUrl={card.cardYoutubeUrl}
                onYoutubeUrlChange={(v) => updateCard(card.id, "cardYoutubeUrl", v)}
              />

              <InputField label="Quote" value={card.quote} onChange={e => updateCard(card.id, "quote", e.target.value)} placeholder="e.g. This team is amazing!" isTextarea />
              <InputField label="Name" value={card.name} onChange={e => updateCard(card.id, "name", e.target.value)} placeholder="e.g. Jane Doe" />
              <InputField label="Designation" value={card.designation} onChange={e => updateCard(card.id, "designation", e.target.value)} placeholder="e.g. CEO, TechCorp" />
            </div>
          ))}
        </div>

        <button
          onClick={addCard}
          className="w-full mt-6 py-4 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center gap-2 text-gray-500 font-semibold hover:bg-gray-50 hover:text-brand-600 hover:border-brand-300 transition-all"
        >
          <Plus size={20} /> Add Testimonial Card
        </button>
      </FormCard>
    </div>
  );
};

export default HomeTestimonial;
