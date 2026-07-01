import { Paper, Box, Typography, Chip, Stack } from '@mui/material';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import ThumbDownOffAltIcon from '@mui/icons-material/ThumbDownOffAlt';

const ChipRow = ({ label, items, color }) => {
  if (!items?.length) return null;
  return (
    <Box sx={{ mb: 0.75 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.25 }}>
        {items.map((name) => <Chip key={name} label={name} size="small" color={color} variant="outlined" />)}
      </Box>
    </Box>
  );
};

// Renders the AI's inferred "temporary profile" for a stranger recipient as a
// profile-like card (from a present_temporary_profile tool call). Display-only.
const TemporaryProfileCard = ({ profile }) => {
  const { summary, liked_categories, disliked_categories, liked_tags, disliked_tags } = profile;
  const hasContent = summary || liked_categories?.length || disliked_categories?.length
    || liked_tags?.length || disliked_tags?.length;
  if (!hasContent) return null;

  return (
    <Paper variant="outlined" sx={{ p: 1.5, mt: 1, bgcolor: 'chatSurface' }}>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
        Temporary profile (my best guess)
      </Typography>
      {summary && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{summary}</Typography>
      )}

      <Stack spacing={0.5}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <ThumbUpOffAltIcon fontSize="small" color="success" />
          <Typography variant="body2" fontWeight={600}>Likely likes</Typography>
        </Box>
        <ChipRow label="Categories" items={liked_categories} color="success" />
        <ChipRow label="Tags" items={liked_tags} color="success" />

        {(disliked_categories?.length || disliked_tags?.length) ? (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <ThumbDownOffAltIcon fontSize="small" color="error" />
              <Typography variant="body2" fontWeight={600}>Likely dislikes</Typography>
            </Box>
            <ChipRow label="Categories" items={disliked_categories} color="error" />
            <ChipRow label="Tags" items={disliked_tags} color="error" />
          </>
        ) : null}
      </Stack>
    </Paper>
  );
};

export default TemporaryProfileCard;
