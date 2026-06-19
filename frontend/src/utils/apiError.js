// Routes the backend's normalized field errors onto react-hook-form inputs.
// Backend error shape (see API.md → Validation & errors):
//   { "message": "...", "errors": { "field": ["msg", ...], "non_field_errors": [...] } }
// The top-level `message` is always present, so callers read it directly for the
// banner — only the per-field `errors` map needs this helper.
//
// Returns true if at least one of the given fields had a server error (so the
// caller can skip the banner when the problem is already shown inline).
export const applyFieldErrors = (error, setError, fields = []) => {
  const errors = error?.response?.data?.errors;
  if (!errors || typeof errors !== 'object') return false;

  let applied = false;
  for (const field of fields) {
    const msg = errors[field];
    if (msg) {
      setError(field, { type: 'server', message: Array.isArray(msg) ? msg[0] : String(msg) });
      applied = true;
    }
  }
  return applied;
};
