// The kinds of file the media picker (Media.tsx) chooses between.
export type MediaKind = 'image' | 'video' | 'audio';

// The element each kind belongs to, so a selection can ask for its own picker.
export const KIND_FOR_TAG: Record<string, MediaKind> = {
  img: 'image',
  video: 'video',
  audio: 'audio',
};
