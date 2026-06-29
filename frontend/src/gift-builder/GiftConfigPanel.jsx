import { useState, useEffect } from 'react';
import {
  Box, TextField, FormControl, InputLabel, Select, MenuItem,
  ToggleButtonGroup, ToggleButton, Button, Typography, FormHelperText,
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { useMetadata } from '../general_hooks/useMetadata';

const GiftConfigPanel = ({ recipient, initialConfig = {}, onFind, loading, onBack }) => {
  const { eventTypes, giftStrategies } = useMetadata();
  const [budget, setBudget] = useState(initialConfig?.budget ?? '');
  const [eventType, setEventType] = useState(initialConfig?.event_type ?? '');
  const [strategy, setStrategy] = useState(initialConfig?.strategy ?? 'balanced');

  useEffect(() => {
    setBudget(initialConfig?.budget ?? '');
    setEventType(initialConfig?.event_type ?? '');
    setStrategy(initialConfig?.strategy ?? 'balanced');
  }, [initialConfig]);

  const budgetNum = parseFloat(budget);
  const isValid = !isNaN(budgetNum) && budgetNum > 0;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 1 }}>Configure Gift</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Finding a gift for <strong>{recipient.username}</strong>
      </Typography>

      <TextField
        fullWidth
        required
        type="number"
        label="Budget ($)"
        value={budget}
        onChange={(e) => setBudget(e.target.value)}
        error={!isValid}
        helperText={!isValid ? 'Budget is required' : ' '}
        inputProps={{ min: 1, step: 1 }}
        sx={{ mb: 3 }}
      />

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Event Type (optional)</InputLabel>
        <Select
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          label="Event Type (optional)"
        >
          <MenuItem value="">None</MenuItem>
          {eventTypes.map((et) => (
            <MenuItem key={et.value} value={et.value}>{et.label}</MenuItem>
          ))}
        </Select>
        {eventType && (
          <FormHelperText>
            {eventTypes.find((e) => e.value === eventType)?.description}
          </FormHelperText>
        )}
      </FormControl>

      <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>Strategy</Typography>
      <ToggleButtonGroup
        value={strategy}
        exclusive
        onChange={(_, v) => v && setStrategy(v)}
        fullWidth
        sx={{ mb: 3 }}
      >
        {giftStrategies.map((s) => (
          <ToggleButton key={s.value} value={s.value}>
            <Box sx={{ textAlign: 'center', py: 0.5 }}>
              <Typography variant="body2" fontWeight={600}>{s.label}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {s.description}
              </Typography>
            </Box>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        {onBack && (
          <Button
            variant="outlined"
            startIcon={<ArrowBackIosNewIcon />}
            onClick={onBack}
            sx={{ borderRadius: '12px', textTransform: 'none' }}
          >
            Back
          </Button>
        )}
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={() => onFind({ budget: budgetNum, event_type: eventType || undefined, strategy })}
          disabled={!isValid || loading}
          sx={{ borderRadius: '12px', textTransform: 'none' }}
        >
          {loading ? 'Finding Gifts…' : 'Find Gifts'}
        </Button>
      </Box>
    </Box>
  );
};

export default GiftConfigPanel;
