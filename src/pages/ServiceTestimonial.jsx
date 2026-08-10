import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axiosInstance";
import toast from "react-hot-toast";
import { Loader2, MessageSquare, CheckCircle, UploadCloud, Plus, X } from "lucide-react";
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
const ServiceTestimonial = () => {
  const qc = useQueryClient();
  const testimonialFlash = useFlashSuccess();

  const MIN_CARDS = 4;

  // State
  const [heading, setHeading] = useState("");
  const [subheading, setSubheading] = useState("");
  const [cards, setCards] = useState([]);

  // Fetch Data
  const { data, isLoading } = useQuery({
    queryKey: ["service-main"],
    queryFn: async () => {
      const res = await api.get("/services/main");
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
        id: Date.now() + idx,
        quote: card.quote || "",
        name: card.name || "",
        designation: card.designation || "",
        existingImage: card.image || "",
        newImage: null,
        preview: "",
        existingCardImage: card.cardImage || "",
        newCardImage: null,
        cardImagePreview: "",
      }));
    }

    // Ensure we have at least MIN_CARDS
    while (initialCards.length < MIN_CARDS) {
      initialCards.push({
        id: Date.now() + initialCards.length,
        quote: "",
        name: "",
        designation: "",
        existingImage: "",
        newImage: null,
        preview: "",
        existingCardImage: "",
        newCardImage: null,
        cardImagePreview: "",
      });
    }

    setCards(initialCards);
  }, [data]);

  // Handlers
  const addCard = () => {
    setCards([
      ...cards,
      {
        id: Date.now(),
        quote: "",
        name: "",
        designation: "",
        existingImage: "",
        newImage: null,
        preview: "",
        existingCardImage: "",
        newCardImage: null,
        cardImagePreview: "",
      },
    ]);
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

  // Mutation
  const testimonialMutation = useMutation({
    mutationFn: async () => {
      // New testimonial images go straight to Cloudinary from the browser —
      // this avoids routing large or multiple photos through the backend's
      // serverless function, which rejects anything over ~4.5MB.
      const testimonialsData = await Promise.all(
        cards.map(async (card) => {
          let image = card.existingImage;
          if (card.newImage) {
            const uploaded = await uploadToCloudinary(card.newImage, { folder: "chameri/services" });
            image = uploaded.url;
          }

          let cardImage = card.existingCardImage;
          if (card.newCardImage) {
            const uploaded = await uploadToCloudinary(card.newCardImage, { folder: "chameri/services" });
            cardImage = uploaded.url;
          }

          return {
            quote: card.quote,
            name: card.name,
            designation: card.designation,
            image,
            cardImage,
          };
        })
      );

      return api.put("/services/main/testimonial", { heading, subheading, testimonialsData });
    },
    onSuccess: () => {
      testimonialFlash.flash();
      qc.invalidateQueries(["service-main"]);
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to save Testimonial section"),
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
        <h1 className="text-2xl font-bold text-white">Services — Testimonial Section</h1>
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

              {/* Card Background Image Upload */}
              <div className="pt-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">Card Image</label>
                <div
                  className="relative w-full h-32 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-brand-300 transition-colors overflow-hidden group/cardimg"
                >
                  {(card.cardImagePreview || card.existingCardImage) ? (
                    <>
                      <img
                        src={card.cardImagePreview || card.existingCardImage}
                        alt={`Card BG ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cardimg:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <UploadCloud size={20} />
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <UploadCloud size={20} className="mx-auto mb-2 text-gray-400" />
                      <span className="text-xs font-medium text-gray-500">Upload Card Image</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    onChange={e => handleCardImageChange(card.id, e.target.files[0])}
                  />
                </div>
              </div>

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

export default ServiceTestimonial;
