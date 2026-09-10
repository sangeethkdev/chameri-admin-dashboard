import { ImageIcon, Video, MonitorPlay } from "lucide-react";

/**
 * Shared helpers for the testimonial "card media" picker, which lets an editor
 * back a card with an uploaded image, an uploaded video, or a YouTube link.
 *
 * Used by Home → Testimonial, Services → Testimonial Section, and
 * Testimonials → Client Review.
 *
 * Note: lucide-react v1 dropped brand icons, so there is no YouTube glyph —
 * MonitorPlay stands in for it.
 */
export const MEDIA_TYPES = [
  { id: "image", label: "Image", icon: ImageIcon },
  { id: "video", label: "Video", icon: Video },
  { id: "youtube", label: "YouTube", icon: MonitorPlay },
];

// Cloudinary's free tier caps a single upload at 100MB.
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

// Accepts the URL shapes people actually paste — watch links, youtu.be
// shorts, /embed and /shorts — and returns the bare 11-char video id.
export function getYoutubeId(url) {
  if (!url) return "";
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([A-Za-z0-9_-]{11})/,
    /(?:youtu\.be\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return /^[A-Za-z0-9_-]{11}$/.test(url.trim()) ? url.trim() : "";
}

export function youtubeThumb(id) {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}
