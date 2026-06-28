// Builds a Gravatar image URL from the backend-provided `gravatar_hash`.
// d=404 makes Gravatar 404 when the user has no avatar, so the <Avatar> falls
// back to its initial-letter child. Returns undefined for a missing hash.

export const gravatarUrl = (hash, { size = 200 } = {}) =>
  hash ? `https://www.gravatar.com/avatar/${hash}?s=${size}&d=404` : undefined;
