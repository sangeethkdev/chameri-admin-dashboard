import React from "react";
import { UploadCloud, Video, MonitorPlay } from "lucide-react";
import { MEDIA_TYPES, getYoutubeId, youtubeThumb } from "../lib/cardMedia";

/**
 * The card-media control: a type switcher plus whichever input matches the
 * selected type (image upload, video upload, or a YouTube URL).
 *
 * Field names differ per page (Home/Services use cardImage/cardVideo/
 * cardYoutubeUrl, Client Review uses cardImage/video/youtubeUrl), so the
 * caller passes the resolved values and change handlers rather than the card.
 */
export default function CardMediaPicker({
  label = "Card Media",
  mediaType,
  onMediaTypeChange,

  imagePreview,
  existingImage,
  onImageChange,

  videoPreview,
  existingVideo,
  onVideoChange,

  youtubeUrl,
  onYoutubeUrlChange,
}) {
  const activeType = mediaType || "image";
  const youtubeId = getYoutubeId(youtubeUrl);

  return (
    <div className="pt-2">
      <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">
        {label}
      </label>

      {/* Type switcher */}
      <div className="flex gap-1.5 mb-3 p-1 bg-gray-100 rounded-xl">
        {MEDIA_TYPES.map(({ id, label: typeLabel, icon: TypeIcon }) => {
          const active = activeType === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onMediaTypeChange(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
                active
                  ? "bg-white text-brand-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <TypeIcon size={14} />
              {typeLabel}
            </button>
          );
        })}
      </div>

      {/* ── Image ── */}
      {activeType === "image" && (
        <div className="relative w-full h-32 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-brand-300 transition-colors overflow-hidden group/cardimg">
          {imagePreview || existingImage ? (
            <>
              <img
                src={imagePreview || existingImage}
                alt="Card media"
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
            onChange={(e) => onImageChange(e.target.files[0])}
          />
        </div>
      )}

      {/* ── Video ── */}
      {activeType === "video" && (
        <div className="relative w-full h-32 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-brand-300 transition-colors overflow-hidden group/cardvid">
          {videoPreview || existingVideo ? (
            <>
              {/* muted + playsInline so the preview never blares audio in the panel */}
              <video
                src={videoPreview || existingVideo}
                className="w-full h-full object-cover"
                muted
                playsInline
                preload="metadata"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cardvid:opacity-100 transition-opacity flex items-center justify-center text-white">
                <UploadCloud size={20} />
              </div>
            </>
          ) : (
            <div className="text-center px-3">
              <Video size={20} className="mx-auto mb-2 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">Upload Card Video</span>
              <span className="block text-[10px] text-gray-400 mt-0.5">MP4 or WebM, max 100MB</span>
            </div>
          )}
          <input
            type="file"
            accept="video/*"
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            onChange={(e) => onVideoChange(e.target.files[0])}
          />
        </div>
      )}

      {/* ── YouTube ── */}
      {activeType === "youtube" && (
        <div className="space-y-2">
          <input
            type="url"
            value={youtubeUrl || ""}
            onChange={(e) => onYoutubeUrlChange(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all"
          />
          {youtubeUrl && !youtubeId && (
            <p className="text-xs font-medium text-red-500">
              That doesn&apos;t look like a YouTube link.
            </p>
          )}
          {youtubeId && (
            <div className="relative w-full h-32 rounded-xl overflow-hidden bg-black">
              <img
                src={youtubeThumb(youtubeId)}
                alt="YouTube thumbnail"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-11 h-11 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                  <MonitorPlay size={20} className="text-white" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
