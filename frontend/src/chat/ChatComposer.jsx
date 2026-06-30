import { Box, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useMentions } from './useMentions';
import MentionTextField from './MentionTextField';

// Message input with @user / #product autocomplete. Enter sends, Shift+Enter inserts
// a newline. Disabled while the AI is streaming (prevents a second concurrent send).
const ChatComposer = ({ onSend, disabled }) => {
  const mentions = useMentions();

  const submit = () => {
    const content = mentions.value.trim();
    if (!content || disabled) return;
    onSend({ content, ...mentions.getMentions() });
    mentions.reset();
  };

  const onKeyDown = (e) => {
    // Don't hijack Enter while the mention dropdown is open — let a selection happen.
    if (e.key === 'Enter' && !e.shiftKey && !mentions.open) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, p: 1.5, borderTop: 1, borderColor: 'divider' }}>
      <MentionTextField
        mentions={mentions}
        onKeyDown={onKeyDown}
        placeholder="Ask for a gift… use @ to tag a user, # for a product"
        multiline
        minRows={3}
        maxRows={10}
        fullWidth
        disabled={disabled}
      />
      <IconButton color="primary" onClick={submit} disabled={disabled || !mentions.value.trim()}>
        <SendIcon />
      </IconButton>
    </Box>
  );
};

export default ChatComposer;
