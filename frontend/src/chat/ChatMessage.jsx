import { Box, Paper, Typography, Stack, Divider } from '@mui/material';
import BundleItemRow from './BundleItemRow';
import BundleCard from './BundleCard';
import TemporaryProfileCard from './TemporaryProfileCard';

// Normalizes an optimize_gift_bundle tool result into a list of single bundles.
// The tool returns one strategy bundle ({items,...}) or a {strategy: bundle} dict.
const bundlesFromResult = (result) => {
  if (!result || Array.isArray(result) || result.message) return [];
  if (result.items) return [result];
  const strat = result.balanced || result.max_score || result.max_items;
  return strat ? [strat] : [];
};

// Pulls renderable artifacts (a temporary profile, a bundle, or a recommendation
// list) out of the assistant message's persisted tool calls.
const artifactsFor = (toolCalls = []) => {
  const reversed = [...toolCalls].reverse();
  const temporaryProfile = reversed.find((c) => c.name === 'present_temporary_profile')?.result || null;

  const BUNDLE_TOOLS = ['optimize_gift_bundle', 'edit_gift_bundle'];
  const lastBundle = reversed.find((c) => BUNDLE_TOOLS.includes(c.name));
  const bundles = lastBundle ? bundlesFromResult(lastBundle.result) : [];
  if (bundles.length) return { temporaryProfile, bundles, recommendations: [] };

  const lastRecs = reversed.find((c) => c.name === 'get_recommendations');
  const recommendations = Array.isArray(lastRecs?.result) ? lastRecs.result : [];
  return { temporaryProfile, bundles: [], recommendations };
};

const ChatMessage = ({ message }) => {
  const isUser = message.role === 'user';
  const { temporaryProfile, bundles, recommendations } = isUser
    ? { temporaryProfile: null, bundles: [], recommendations: [] }
    : artifactsFor(message.metadata?.tool_calls);

  return (
    <Box sx={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', mb: 1.5 }}>
      <Box sx={{ maxWidth: '90%' }}>
        <Paper
          elevation={0}
          sx={{
            px: 1.5, py: 1,
            bgcolor: isUser ? 'primary.main' : 'background.paper',
            color: isUser ? 'primary.contrastText' : 'text.primary',
            borderRadius: 2,
          }}
        >
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {message.content}
          </Typography>
        </Paper>

        {temporaryProfile && <TemporaryProfileCard profile={temporaryProfile} />}

        {bundles.map((bundle, i) => <BundleCard key={i} bundle={bundle} />)}

        {recommendations.length > 0 && (
          <Paper variant="outlined" sx={{ mt: 1, px: 1.5, bgcolor: 'background.default' }}>
            <Stack divider={<Divider flexItem />}>
              {recommendations.map((item) => (
                <BundleItemRow key={item.product.id} item={item} />
              ))}
            </Stack>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default ChatMessage;
