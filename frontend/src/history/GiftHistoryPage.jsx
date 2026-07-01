import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Stack,
  Chip, Button, Divider,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import { getGiftHistory, deleteGiftHistory, finalizeGiftBundle } from '../api/recommendations';
import { formatCurrency, formatDate } from '../utils/formatters';
import Spinner from '../general_components/Spinner';
import EmptyState from '../general_components/EmptyState';
import CustomSnackbar from '../general_components/CustomSnackbar';
import PageTitle from '../general_components/PageTitle';

const GiftHistoryPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', action: null });
  const { data, isLoading } = useQuery({
    queryKey: ['gift-history'],
    queryFn: getGiftHistory,
  });
  const history = data?.history ?? [];

  const notify = (message, action = null) => setSnackbar({ open: true, message, action });
  const closeSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteGiftHistory(id),
  });

  const restoreMutation = useMutation({
    mutationFn: (payload) => finalizeGiftBundle(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gift-history'] });
      notify('Bundle restored.');
    },
    onError: () => notify('Could not restore the bundle.'),
  });

  const handleUndo = (entry) => {
    restoreMutation.mutate({
      recipient_id: entry.recipient?.id,
      budget: entry.budget,
      event_type: entry.event_type,
      strategy: entry.strategy,
      items: entry.items.map((item) => ({
        product_id: item.id,
        score: item.score ?? 0,
        explanation: item.explanation ?? '',
      })),
    });
  };

  const handleDelete = (entry) => {
    deleteMutation.mutate(entry.id, {
      onSuccess: () => {
        queryClient.setQueryData(['gift-history'], (prev) =>
          prev ? { ...prev, history: prev.history.filter((h) => h.id !== entry.id) } : prev,
        );
        notify(
          'Bundle removed from history.',
          <Button color="inherit" size="small" onClick={() => handleUndo(entry)}>
            Undo
          </Button>,
        );
      },
      onError: () => notify('Could not remove the bundle.'),
    });
  };

  const handleEdit = (entry) => {
    sessionStorage.setItem(
      'editBundle',
      JSON.stringify({ products: entry.items, strategy: entry.strategy }),
    );
    const params = new URLSearchParams();
    if (entry.recipient?.id) params.set('recipientId', entry.recipient.id);
    params.set('budget', entry.budget);
    if (entry.event_type) params.set('eventType', entry.event_type);
    if (entry.strategy) params.set('strategy', entry.strategy);
    params.set('editBundle', '1');
    navigate(`/gift-builder?${params.toString()}`);
  };

  if (isLoading) return <Spinner />;

  return (
    <Box sx={{ py: 4 }}>
      <PageTitle>Gift History</PageTitle>

      {history.length === 0 ? (
        <EmptyState
          title="No saved gifts yet"
          description="Finalize a bundle in the gift builder and it will appear here."
        />
      ) : (
        <Stack spacing={3}>
          {history.map((entry) => {
            const canEdit = !!entry.recipient?.id;
            const meta = [
              entry.event_type,
              entry.strategy && `${entry.strategy} strategy`,
              formatDate(entry.created_at),
            ].filter(Boolean).join(' • ');

            return (
              <Card key={entry.id} sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                  {/* Header row */}
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    spacing={2}
                    sx={{ mb: 2.5 }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <CardGiftcardIcon color="primary" sx={{ fontSize: 28 }} />
                      <Box>
                        <Typography variant="h5" fontWeight={700} lineHeight={1.2}>
                          For {entry.recipient_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {meta}
                        </Typography>
                      </Box>
                    </Box>

                    <Stack direction="row" spacing={2} alignItems="center" flexShrink={0}>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {formatCurrency(entry.total_price)}
                        <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.75 }}>
                          · {entry.items.length} item{entry.items.length !== 1 ? 's' : ''}
                        </Typography>
                      </Typography>
                      {canEdit && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => handleEdit(entry)}
                          sx={{ borderRadius: '12px', textTransform: 'none', whiteSpace: 'nowrap' }}
                        >
                          Edit Bundle
                        </Button>
                      )}
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteOutlineIcon />}
                        onClick={() => handleDelete(entry)}
                        sx={{ borderRadius: '12px', textTransform: 'none', whiteSpace: 'nowrap' }}
                      >
                        Remove
                      </Button>
                    </Stack>
                  </Stack>

                  <Divider sx={{ mb: 2.5 }} />

                  {/* Product chips */}
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {entry.items.slice(0, 6).map((item) => (
                      <Chip key={item.id} label={item.name} size="small" />
                    ))}
                    {entry.items.length > 6 && (
                      <Chip
                        label={`+${entry.items.length - 6} more`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}

      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        action={snackbar.action}
        onClose={closeSnackbar}
      />
    </Box>
  );
};

export default GiftHistoryPage;
