// 12 colors spanning the GiftGraph purple/gold palette, for deterministic
// per-user avatar backgrounds (same seed always maps to the same color) so
// initials stay readable without every avatar looking identical.
const AVATAR_COLORS = [
  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
  '#F5A623', '#F59E0B', '#FBBF24', '#F97316',
  '#22D3EE', '#38BDF8', '#34D399', '#4ADE80',
];

export const avatarColorFor = (seed = '') => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};
