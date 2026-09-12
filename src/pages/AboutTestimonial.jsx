import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axiosInstance";
import toast from "react-hot-toast";
import { Save, Loader2, Image as ImageIcon, CheckCircle2, UploadCloud, X, Plus } from "lucide-react";
import { uploadToCloudinary } from "../lib/cloudinaryUpload";
import CardMediaPicker from "../components/CardMediaPicker";
import { getYoutubeId, MAX_VIDEO_BYTES } from "../lib/cardMedia";

// One blank testimonial card, including the card-media fields (image /
// uploaded video / YouTube link) the public carousel renders.
const makeBlankCard = () => ({
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

// --- Textarea Field ---
const TextareaField = ({ label, value, onChange, placeholder, rows = 4 }) => (
  <div>
    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">{label}</label>
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-brand-500 transition-colors bg-gray-50/50 focus:bg-white resize-y"
    />
  </div>
);

// ── Main Component ───────────────────────────────────────────────────────────
const AboutTestimonial = () => {
  const qc = useQueryClient();
  const testimonialFlash = useFlashSuccess();
  const testimonialImgRefs = useRef([]);

  const [testimonialHeading, setTestimonialHeading] = useState("");
  const [testimonialSubheading, setTestimonialSubheading] = useState("");
  const [testimonialCards, setTestimonialCards] = useState([]);

  const { data, isLoading } = useQuery({
    queryKey: ["about-main"],
    queryFn: async () => {
      const res = await api.get("/about/main");
      return res.data.data;
    },
  });

  useEffect(() => {
    if (!data) return;
    setTestimonialHeading(data?.testimonialSection?.heading || "");
    setTestimonialSubheading(data?.testimonialSection?.subheading || "");
    const dbCards = data?.testimonialSection?.cards || [];
    const seededCards = [];
    for(let i = 0; i < Math.max(4, dbCards.length); i++) {
      const c = dbCards[i] || {};
      seededCards.push({
        ...makeBlankCard(),
        quote: c.quote || "",
        name: c.name || "",
        designation: c.designation || "",
        existingImage: c.image || "",
        // Older cards have no cardMediaType — treat them as images.
        cardMediaType: c.cardMediaType || "image",
        existingCardImage: c.cardImage || "",
        existingCardVideo: c.cardVideo || "",
        cardYoutubeUrl: c.cardYoutubeUrl || "",
      });
    }
    setTestimonialCards(seededCards);
  }, [data]);

  // Merge a patch into one card by index.
  const updateCard = useCallback((index, patch) => {
    setTestimonialCards(prev => prev.map((item, idx) =>
      idx === index ? { ...item, ...patch } : item
    ));
  }, []);

  const testimonialMutation = useMutation({
    mutationFn: async () => {
      // New images go straight to Cloudinary from the browser — this avoids
      // routing large or multiple photos through the backend's serverless
      // function, which rejects anything over ~4.5MB. Each card's final
      // image/cardImage URL is resolved up front (new upload or existing
      // URL) before the JSON payload is built, so no index-matching against
      // uploaded files is needed on the backend.

      // Reject malformed YouTube links up front — otherwise the card saves
      // fine and then silently renders nothing on the public site.
      const badYoutube = testimonialCards.findIndex(
        (c) => c.cardMediaType === "youtube" && !getYoutubeId(c.cardYoutubeUrl)
      );
      if (badYoutube !== -1) {
        throw new Error(`Card ${badYoutube + 1}: enter a valid YouTube link.`);
      }

      const resolvedCards = await Promise.all(
        testimonialCards.map(async (c) => {
          let imageUrl = c.existingImage;
          if (c.newImage) {
            const uploaded = await uploadToCloudinary(c.newImage, { folder: "chameri/about" });
            imageUrl = uploaded.url;
          }

          const mediaType = c.cardMediaType || "image";

          // Only upload/send the asset for the selected media type — the
          // backend clears the other two, so uploading them would just
          // orphan files in Cloudinary.
          const cardImage =
            mediaType === "image"
              ? c.newCardImage
                ? (await uploadToCloudinary(c.newCardImage, { folder: "chameri/about" })).url
                : c.existingCardImage || ""
              : "";

          const cardVideo =
            mediaType === "video"
              ? c.newCardVideo
                ? (await uploadToCloudinary(c.newCardVideo, { folder: "chameri/about", resourceType: "video" })).url
                : c.existingCardVideo || ""
              : "";

          return {
            quote: c.quote,
            name: c.name,
            designation: c.designation,
            image: imageUrl,
            cardMediaType: mediaType,
            cardImage,
            cardVideo,
            cardYoutubeUrl: mediaType === "youtube" ? (c.cardYoutubeUrl || "").trim() : "",
          };
        })
      );

      return api.put("/about/main/testimonial-section", {
        testimonialHeading,
        testimonialSubheading,
        testimonials: resolvedCards,
      });
    },
    onSuccess: () => {
      testimonialFlash.flash();
      setTestimonialCards(prev => prev.map(item => ({
        ...item,
        newImage: null, preview: "",
        newCardImage: null, cardImagePreview: "",
        newCardVideo: null, cardVideoPreview: "",
      })));
      qc.invalidateQueries(["about-main"]);
    },
    // err.message carries the client-side validation failures thrown above,
    // which have no response body of their own.
    onError: (err) => toast.error(err.response?.data?.message || err.message || "Failed to save Testimonial Section"),
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
        <h1 className="text-2xl font-bold text-white">About Us — Testimonial Section</h1>
        <p className="text-gray-400 text-sm mt-1">Manage the client testimonials for the About page.</p>
      </div>

      <FormCard
        title="Testimonial Section"
        icon={ImageIcon}
        onSave={() => testimonialMutation.mutate()}
        isSaving={testimonialMutation.isPending}
        saved={testimonialFlash.saved}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <InputField label="Heading" value={testimonialHeading} onChange={e => setTestimonialHeading(e.target.value)} placeholder="e.g. Client Testimonials" />
          <InputField label="Subheading" value={testimonialSubheading} onChange={e => setTestimonialSubheading(e.target.value)} placeholder="e.g. What they say about us" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
          {testimonialCards.map((card, i) => (
            <div key={i} className="space-y-4 p-5 rounded-2xl bg-gray-50/70 border border-gray-100 relative">
              <button
                 type="button"
                 onClick={() => {
                   if (testimonialCards.length > 4) {
                     setTestimonialCards(prev => prev.filter((_, idx) => idx !== i));
                   } else {
                     toast.error("Minimum 4 cards required");
                   }
                 }}
                 className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                 title="Remove Card"
              >
                 <X size={18} />
              </button>
              <p className="text-xs font-black uppercase tracking-widest text-brand-500">Card {i + 1}</p>

              {/* Card Background Media — image, uploaded video, or YouTube */}
              <CardMediaPicker
                label="Card Media (Background)"
                mediaType={card.cardMediaType}
                onMediaTypeChange={(v) => updateCard(i, { cardMediaType: v })}
                imagePreview={card.cardImagePreview}
                existingImage={card.existingCardImage}
                onImageChange={(f) => {
                  if (!f) return;
                  updateCard(i, { newCardImage: f, cardImagePreview: URL.createObjectURL(f) });
                }}
                videoPreview={card.cardVideoPreview}
                existingVideo={card.existingCardVideo}
                onVideoChange={(f) => {
                  if (!f) return;
                  // Cloudinary's free tier caps a single upload at 100MB; catching
                  // it here gives a clear message instead of a failed request
                  // after a long upload.
                  if (f.size > MAX_VIDEO_BYTES) {
                    toast.error("Video is too large. Please keep it under 100MB.");
                    return;
                  }
                  updateCard(i, { newCardVideo: f, cardVideoPreview: URL.createObjectURL(f) });
                }}
                youtubeUrl={card.cardYoutubeUrl}
                onYoutubeUrlChange={(v) => updateCard(i, { cardYoutubeUrl: v })}
              />

              {/* Avatar Image */}
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">Avatar (Person Photo)</label>
                <div
                  onClick={() => testimonialImgRefs.current[i]?.click()}
                  className="relative w-20 h-20 rounded-full border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-brand-300 transition-colors overflow-hidden group mx-auto"
                >
                  {(card.preview || card.existingImage) ? (
                    <>
                      <img
                        src={card.preview || card.existingImage}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <UploadCloud size={16} />
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <UploadCloud size={16} className="mx-auto text-gray-400" />
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={el => testimonialImgRefs.current[i] = el}
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files[0];
                    if (!f) return;
                    updateCard(i, { newImage: f, preview: URL.createObjectURL(f) });
                  }}
                />
              </div>

              <TextareaField
                label="Quote"
                value={card.quote}
                onChange={e => updateCard(i, { quote: e.target.value })}
                placeholder="e.g. They were amazing to work with!"
                rows={3}
              />
              <InputField
                label="Name"
                value={card.name}
                onChange={e => updateCard(i, { name: e.target.value })}
                placeholder="e.g. Jane Doe"
              />
              <InputField
                label="Designation"
                value={card.designation}
                onChange={e => updateCard(i, { designation: e.target.value })}
                placeholder="e.g. Director, XYZ Corp"
              />
            </div>
          ))}
        </div>
        
        <button
           type="button"
           onClick={() => setTestimonialCards(prev => [...prev, makeBlankCard()])}
           className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center gap-2 text-gray-500 font-semibold hover:bg-gray-50 hover:text-brand-600 hover:border-brand-300 transition-all"
        >
           <Plus size={18} /> Add Another Card
        </button>
      </FormCard>
    </div>
  );
};

export default AboutTestimonial;
