import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';

// Flashy CTA at the top of a profile. Routes to the gift-builder with the
// recipient preselected, skipping the builder's "Select Recipient" step.
const CreateGiftButton = ({ isOwner, recipientId, recipientName }) => {
  const navigate = useNavigate();
  const label = isOwner ? 'Create a gift for myself' : `Create a gift for ${recipientName}`;

  const handleClick = () =>
    navigate(`/gift-builder?recipientId=${recipientId}`);

  return (
    <Button
      onClick={handleClick}
      variant="contained"
      size="large"
      startIcon={<CardGiftcardIcon />}
      sx={{
        py: 1.5,
        px: 4,
        borderRadius: 2,
        fontSize: '1.05rem',
        color: 'primary.contrastText',
        background: (t) =>
          `linear-gradient(135deg, ${t.palette.primary.light} 0%, ${t.palette.primary.dark} 100%)`,
        boxShadow: 3,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        '&:hover': { boxShadow: 6, transform: 'translateY(-2px)' },
      }}
    >
      {label}
    </Button>
  );
};

export default CreateGiftButton;
