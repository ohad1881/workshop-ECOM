import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Stepper, Step, StepLabel,
  Tabs, Tab, Alert, Button, Grid,
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { useQuery } from '@tanstack/react-query';
import { getGiftSuggestions } from '../api/recommendations';
import { getUserProfile } from '../api/users';
import { useMetadata } from '../general_hooks/useMetadata';
import { useChatWidget } from '../context/chatWidget/useChatWidget';
import UserSearchPanel from './UserSearchPanel';
import GiftConfigPanel from './GiftConfigPanel';
import RecommendationCard from './RecommendationCard';
import BundleView from './BundleView';
import BundleEditor from './BundleEditor';
import Spinner from '../general_components/Spinner';

const STEPS = ['Select Recipient', 'Configure Gift', 'Results', 'Customize Bundle'];

const GiftBuilderPage = () => {
  const [searchParams] = useSearchParams();
  const { giftStrategies } = useMetadata();
  const { openChat } = useChatWidget();

  const [activeStep, setActiveStep] = useState(0);
  const [recipient, setRecipient] = useState(null);
  const [config, setConfig] = useState(null);
  const [resultsTab, setResultsTab] = useState(0);
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [selectedBundleItems, setSelectedBundleItems] = useState([]);
  const [selectedBundleStrategyLabel, setSelectedBundleStrategyLabel] = useState('');

  const preloadId = searchParams.get('recipientId');
  const preloadBudget = searchParams.get('budget');
  const preloadEventType = searchParams.get('eventType');
  const preloadStrategy = searchParams.get('strategy');
  const isEditBundle = searchParams.get('editBundle') === '1';

  const { data: preloadedProfile } = useQuery({
    queryKey: ['preload-recipient', preloadId],
    queryFn: () => getUserProfile(preloadId),
    enabled: !!preloadId,
  });

  const preloadHandledRef = useRef(false);

  useEffect(() => {
    if (!preloadedProfile || preloadHandledRef.current) return;
    preloadHandledRef.current = true;

    const recipientObj = {
      id: preloadedProfile.id,
      username: preloadedProfile.username,
      gravatar_hash: preloadedProfile.gravatar_hash,
    };
    setRecipient(recipientObj);

    if (!preloadBudget) {
      setActiveStep(1);
      return;
    }

    const cfg = {
      budget: Number(preloadBudget),
      event_type: preloadEventType || '',
      strategy: preloadStrategy || 'balanced',
    };
    setConfig(cfg);

    if (isEditBundle) {
      // Restore saved products from sessionStorage and jump straight to step 4.
      let stored = null;
      try {
        stored = JSON.parse(sessionStorage.getItem('editBundle') ?? 'null');
      } catch (_) { /* fall through to results */ }
      sessionStorage.removeItem('editBundle');

      if (stored?.products?.length) {
        // Gift history snapshots score/explanation per item, so the bundle is
        // restored with its real match data — no re-scoring round trip needed.
        const wrappedItems = stored.products.map(({ score, explanation, ...product }) => ({
          product,
          score: score ?? 0,
          explanation: explanation ?? '',
        }));
        const totalPrice = wrappedItems.reduce((sum, item) => sum + Number(item.product.price || 0), 0);
        const totalScore = wrappedItems.reduce((sum, item) => sum + item.score, 0);
        setSelectedBundle({
          items: wrappedItems,
          total_price: totalPrice,
          total_score: totalScore,
          budget_utilization: cfg.budget > 0 ? `${((totalPrice / cfg.budget) * 100).toFixed(1)}%` : '—',
        });
        setSelectedBundleItems(wrappedItems);
        setSelectedBundleStrategyLabel(stored.strategy ?? 'Edited');
        setActiveStep(3);
        return;
      }
    }

    setActiveStep(2);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preloadedProfile]);

  const suggestionsQuery = useQuery({
    queryKey: ['gift-suggestions', recipient?.id, config?.budget, config?.event_type],
    queryFn: () =>
      getGiftSuggestions(recipient.id, {
        budget: config.budget,
        event_type: config.event_type,
        limit: 20,
      }),
    enabled: !!recipient && !!config,
  });

  const handleSelectRecipient = (user) => {
    setRecipient(user);
    setConfig(null);
    setSelectedBundle(null);
    setSelectedBundleItems([]);
    setSelectedBundleStrategyLabel('');
    setActiveStep(1);
  };

  const handleFind = (params) => {
    setConfig(params);
    setActiveStep(2);
    setResultsTab(0);
  };

  const handleBackToRecipient = () => {
    setActiveStep(0);
  };

  const handleBackToConfig = () => {
    setActiveStep(1);
  };

  const handleSelectBundle = (bundle, strategyLabel) => {
    if (!bundle || !Array.isArray(bundle.items)) {
      return;
    }

    setSelectedBundle(bundle);
    setSelectedBundleItems(bundle.items);
    setSelectedBundleStrategyLabel(strategyLabel || 'Selected');
    setActiveStep(3);
  };

  const handleAddProductToBundle = (item) => {
    if (selectedBundleItems.some((existing) => existing.product.id === item.product.id)) return;
    setSelectedBundleItems((prev) => [...prev, item]);
  };

  const handleRemoveProductFromBundle = (productId) => {
    setSelectedBundleItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleReset = () => {
    setActiveStep(0);
    setRecipient(null);
    setConfig(null);
    setSelectedBundle(null);
    setSelectedBundleItems([]);
    setSelectedBundleStrategyLabel('');
  };

  const suggestions = suggestionsQuery.data ?? {};
  const recommendations = Array.isArray(suggestions.recommendations) ? suggestions.recommendations : [];
  const bundles = suggestions.bundles ?? {};
  const noPublicData = suggestions.message;

  const selectedStrategy = giftStrategies.find((s) => s.value === config?.strategy);
  const otherStrategies = giftStrategies.filter((s) => s.value !== config?.strategy);
  const selectedStrategyBundle = config ? bundles[config.strategy] : null;
  const maxScoreCount = bundles.max_score?.items?.length ?? null;
  const safeActiveStep = activeStep === 3 && (!config || !selectedBundle) ? 0 : activeStep;

  const renderStepContent = () => {
    if (safeActiveStep === 0) {
      return <UserSearchPanel onSelect={handleSelectRecipient} />;
    }

    if (safeActiveStep === 1 && recipient) {
      return (
        <GiftConfigPanel
          recipient={recipient}
          initialConfig={config}
          onFind={handleFind}
          loading={suggestionsQuery.isFetching}
          onBack={handleBackToRecipient}
        />
      );
    }

    if (safeActiveStep === 2 && recipient && config) {
      return (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h5">
              Gifts for <strong>{recipient.username}</strong>
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIosNewIcon />}
                size="small"
                onClick={handleBackToConfig}
                sx={{ borderRadius: '12px', textTransform: 'none' }}
              >
                Back
              </Button>
              <Button variant="outlined" size="small" onClick={handleReset} sx={{ borderRadius: '12px', textTransform: 'none' }}>
                Start Over
              </Button>
            </Box>
          </Box>

          {noPublicData && (
            <Alert severity="info" sx={{ mb: 2 }}>{noPublicData}</Alert>
          )}

          <Tabs value={resultsTab} onChange={(_, v) => setResultsTab(v)} sx={{ mb: 3 }}>
            <Tab label="Selected Bundle" />
            <Tab label="Other Bundles" />
            <Tab label="Best Products" />
          </Tabs>

          {resultsTab === 0 && (
            <Box>
              <Typography variant="h5" sx={{ mb: 2 }}>
                Selected bundle: <strong>{selectedStrategy?.label}</strong>
              </Typography>
              <BundleView
                bundle={selectedStrategyBundle ?? null}
                strategy={selectedStrategy}
                isLoading={suggestionsQuery.isLoading}
                compareCount={config.strategy === 'max_items' ? maxScoreCount : null}
                onSelect={handleSelectBundle}
              />
            </Box>
          )}

          {resultsTab === 1 && (
            <Grid container spacing={3}>
              {otherStrategies.map((strategy) => (
                <Grid size={{ xs: 12 }} key={strategy.value}>
                  <BundleView
                    bundle={bundles[strategy.value] ?? null}
                    strategy={strategy}
                    isLoading={suggestionsQuery.isLoading}
                    compareCount={strategy.value === 'max_items' ? maxScoreCount : null}
                    onSelect={handleSelectBundle}
                  />
                </Grid>
              ))}
            </Grid>
          )}

          {resultsTab === 2 && (
            suggestionsQuery.isLoading ? <Spinner /> :
            recommendations.length === 0 ? (
              noPublicData ? null : (
                <Alert severity="info">
                  No products found. Try increasing the budget.
                </Alert>
              )
            ) : (
              <Grid container spacing={2}>
                {recommendations.map((item) => (
                  <Grid size={{ xs: 6, sm: 4, md: 2.4 }} key={item.product.id}>
                    <RecommendationCard item={item} />
                  </Grid>
                ))}
              </Grid>
            )
          )}
        </Box>
      );
    }

    if (safeActiveStep === 3 && selectedBundle) {
      return (
        <BundleEditor
          bundleItems={selectedBundleItems}
          budget={config?.budget ?? 0}
          bundleStrategy={selectedBundleStrategyLabel}
          strategyKey={config?.strategy}
          eventType={config?.event_type}
          recipient={recipient}
          onBack={() => setActiveStep(2)}
          onRemoveProduct={handleRemoveProductFromBundle}
          onAddProduct={handleAddProductToBundle}
          onProceed={() => openChat({
            recipient,
            budget: config?.budget,
            eventType: config?.event_type,
            bundleItems: selectedBundleItems,
          })}
        />
      );
    }

    return <UserSearchPanel onSelect={handleSelectRecipient} />;
  };

  return (
    <Box>
      <Typography variant="h3" sx={{ mb: 3 }}>Build a Gift</Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {STEPS.map((label, i) => (
          <Step key={label} completed={i < activeStep}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {renderStepContent()}
    </Box>
  );
};

export default GiftBuilderPage;
