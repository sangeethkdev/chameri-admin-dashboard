import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axiosInstance";
import toast from "react-hot-toast";
import { Loader2, MessageSquare, CheckCircle, UploadCloud, Plus, X, Star } from "lucide-react";
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

// --- Star Rating Selector ---
const StarRatingField = ({ label, value, onChange }) => (
  <div>
    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">{label}</label>
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="transition-transform hover:scale-110"
          title={`${star} star${star > 1 ? "s" : ""}`}
        >
          <Star
            size={22}
            className={star <= value ? "text-amber-400 fill-amber-400" : "text-gray-300"}
          />
        </button>
      ))}
    </div>
  </div>
);

const MIN_CARDS = 4;

const emptyCard = (idx = 0) => ({
  id: Date.now() + idx,
  quote: "",
  name: "",
  role: "",
  rating: 5,
  existingImage: "",
  newImage: null,
  preview: "",
  existingVideo: "",
  newVideo: null,
  videoPreview: "",
});

// ── Main Component ───────────────────────────────────────────────────────────
const ClientReview = () => {
  const qc = useQueryClient();
  const reviewFlash = useFlashSuccess();

  const [cards, setCards] = useState([]);

  const { data, isLoading } = useQuery({
    queryKey: ["testimonials-main"],
    queryFn: async () => {
      const res = await api.get("/testimonials-main/main");
      return res.data.data;
    },
  });

  useEffect(() => {
    if (!data) return;

    let initialCards = [];
    if (data.reviewsSection?.cards && data.reviewsSection.cards.length > 0) {
      initialCards = data.reviewsSection.cards.map((card, idx) => ({
        id: Date.now() + idx,
        _id: card._id,
        quote: card.quote || "",
        name: card.name || "",
        role: card.role || "",
        rating: card.rating || 5,
        existingImage: card.image || "",
        newImage: null,
        preview: "",
        existingVideo: card.video || "",
        newVideo: null,
        videoPreview: "",
      }));
    }

    while (initialCards.length < MIN_CARDS) {
      initialCards.push(emptyCard(initialCards.length));
    }

    setCards(initialCards);
  }, [data]);

  const addCard = () => setCards((prev) => [...prev, emptyCard(prev.length)]);

  const removeCard = (id) => {
    if (cards.length <= MIN_CARDS) {
      toast.error(`Minimum ${MIN_CARDS} review cards required.`);
      return;
    }
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  const updateCard = (id, field, value) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const handleImageChange = (id, file) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, newImage: file, preview } : c)));
  };

  const handleVideoChange = (id, file) => {
    if (!file) return;
    const videoPreview = URL.createObjectURL(file);
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, newVideo: file, videoPreview } : c)));
  };

  const reviewMutation = useMutation({
    mutationFn: async () => {
      // New photos/videos go straight to Cloudinary from the browser — this
      // avoids routing them through the backend's serverless function, which
      // rejects anything over ~4.5MB. Each card resolves to a final
      // image/video URL (existing URL kept as-is, or the freshly uploaded
      // one) before the save request is sent; `_id` is carried through
      // untouched so the backend can match it back to the stored card and
      // keep its `_id`/`createdAt` stable instead of re-creating it.
      const payloadData = await Promise.all(
        cards.map(async (card) => {
          let imageUrl = card.existingImage || "";
          if (card.newImage) {
            const uploaded = await uploadToCloudinary(card.newImage, {
              folder: "chameri/testimonials",
              resourceType: "auto",
            });
            imageUrl = uploaded.url;
          }

          let videoUrl = card.existingVideo || "";
          if (card.newVideo) {
            const uploaded = await uploadToCloudinary(card.newVideo, {
              folder: "chameri/testimonials",
              resourceType: "auto",
            });
            videoUrl = uploaded.url;
          }

          return {
            _id: card._id,
            quote: card.quote,
            name: card.name,
            role: card.role,
            rating: card.rating,
            image: imageUrl,
            video: videoUrl,
          };
        })
      );

      return api.put("/testimonials-main/main/reviews", { reviewsData: payloadData });
    },
    onSuccess: () => {
      reviewFlash.flash();
      qc.invalidateQueries(["testimonials-main"]);
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to save Client Review section"),
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
      <div className="bg-dark-800 p-6 rounded-3xl mb-6 shadow-sm border border-surface-border">
        <h1 className="text-2xl font-bold text-white">Testimonials — Client Review</h1>
        <p className="text-gray-400 text-sm mt-1">
          Manage the dynamically scaling client review list. Minimum {MIN_CARDS} required.
        </p>
      </div>

      <FormCard
        title="Client Reviews"
        icon={MessageSquare}
        onSave={() => reviewMutation.mutate()}
        isSaving={reviewMutation.isPending}
        saved={reviewFlash.saved}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {cards.map((card, index) => (
            <div key={card.id} className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-4 relative group">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-black uppercase tracking-widest text-brand-500">Review {index + 1}</p>
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

              {/* Photo Upload */}
              <div className="pt-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">Photo</label>
                <div className="relative w-20 h-20 rounded-full border-2 border-dashed border-gray-200 bg-white flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-brand-300 transition-colors overflow-hidden group/img">
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
                    onChange={(e) => handleImageChange(card.id, e.target.files[0])}
                  />
                </div>
              </div>

              {/* Video Upload */}
              <div className="pt-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">Video</label>
                <div className="relative w-full h-32 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-brand-300 transition-colors overflow-hidden group/video">
                  {(card.videoPreview || card.existingVideo) ? (
                    <>
                      <video
                        src={card.videoPreview || card.existingVideo}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        autoPlay
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/video:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <UploadCloud size={20} />
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <UploadCloud size={20} className="mx-auto mb-2 text-gray-400" />
                      <span className="text-xs font-medium text-gray-500">Upload Video (optional)</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="video/*"
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    onChange={(e) => handleVideoChange(card.id, e.target.files[0])}
                  />
                </div>
              </div>

              <InputField
                label="Quote"
                value={card.quote}
                onChange={(e) => updateCard(card.id, "quote", e.target.value)}
                placeholder="e.g. This team is amazing!"
                isTextarea
              />
              <InputField
                label="Name"
                value={card.name}
                onChange={(e) => updateCard(card.id, "name", e.target.value)}
                placeholder="e.g. Jane Doe"
              />
              <InputField
                label="Role"
                value={card.role}
                onChange={(e) => updateCard(card.id, "role", e.target.value)}
                placeholder="e.g. CEO, TechCorp"
              />
              <StarRatingField
                label="Google Review Rating"
                value={card.rating}
                onChange={(val) => updateCard(card.id, "rating", val)}
              />
            </div>
          ))}
        </div>

        <button
          onClick={addCard}
          className="w-full mt-6 py-4 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center gap-2 text-gray-500 font-semibold hover:bg-gray-50 hover:text-brand-600 hover:border-brand-300 transition-all"
        >
          <Plus size={20} /> Add Review Card
        </button>
      </FormCard>
    </div>
  );
};

export default ClientReview;
