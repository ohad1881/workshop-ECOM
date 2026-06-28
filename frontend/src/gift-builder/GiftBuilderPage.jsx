import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Stepper, Step, StepLabel,
  Tabs, Tab, Alert, Button, Grid,
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { useQuery } from '@tanstack/react-query';
import { getRecommendations, getBundles } from '../api/recommendations';
import { getUserProfile } from '../api/users';
import { useMetadata } from '../general_hooks/useMetadata';
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

  const [activeStep, setActiveStep] = useState(0);
  const [recipient, setRecipient] = useState(null);
  const [config, setConfig] = useState(null);
  const [resultsTab, setResultsTab] = useState(0);
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [selectedBundleProducts, setSelectedBundleProducts] = useState([]);
  const [selectedBundleStrategyLabel, setSelectedBundleStrategyLabel] = useState('');

  const preloadId = searchParams.get('recipientId');

  useEffect(() => {
    if (!preloadId) return;
    getUserProfile(preloadId)
      .then((profile) => {
        setRecipient({ id: profile.id, username: profile.username, gravatar_hash: profile.gravatar_hash });
        setActiveStep(1);
      })
      .catch(() => {});
  }, [preloadId]);

  const recsQuery = useQuery({
    queryKey: ['recommendations', recipient?.id, config?.budget, config?.event_type],
    queryFn: () =>
      getRecommendations(recipient.id, {
        budget: config.budget,
        event_type: config.event_type,
        limit: 20,
      }),
    enabled: !!recipient && !!config,
  });

  const bundleQueries = {
    max_score: useQuery({
      queryKey: ['bundle', recipient?.id, config?.budget, config?.event_type, 'max_score'],
      queryFn: () => getBundles(recipient.id, { budget: config.budget, event_type: config.event_type, strategy: 'max_score' }),
      enabled: !!recipient && !!config,
    }),
    max_items: useQuery({
      queryKey: ['bundle', recipient?.id, config?.budget, config?.event_type, 'max_items'],
      queryFn: () => getBundles(recipient.id, { budget: config.budget, event_type: config.event_type, strategy: 'max_items' }),
      enabled: !!recipient && !!config,
    }),
    balanced: useQuery({
      queryKey: ['bundle', recipient?.id, config?.budget, config?.event_type, 'balanced'],
      queryFn: () => getBundles(recipient.id, { budget: config.budget, event_type: config.event_type, strategy: 'balanced' }),
      enabled: !!recipient && !!config,
    }),
  };

  const handleSelectRecipient = (user) => {
    setRecipient(user);
    setConfig(null);
    setSelectedBundle(null);
    setSelectedBundleProducts([]);
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
    setSelectedBundleProducts(bundle.items.map((item) => item.product));
    setSelectedBundleStrategyLabel(strategyLabel || 'Selected');
    setActiveStep(3);
  };

  const handleAddProductToBundle = (product) => {
    if (selectedBundleProducts.some((item) => item.id === product.id)) return;
    setSelectedBundleProducts((prev) => [...prev, product]);
  };

  const handleRemoveProductFromBundle = (productId) => {
    setSelectedBundleProducts((prev) => prev.filter((product) => product.id !== productId));
  };

  const handleReset = () => {
    setActiveStep(0);
    setRecipient(null);
    setConfig(null);
    setSelectedBundle(null);
    setSelectedBundleProducts([]);
    setSelectedBundleStrategyLabel('');
  };

  const recommendations = Array.isArray(recsQuery.data) ? recsQuery.data : [];
  const noPublicData = recsQuery.data?.message;

  const selectedStrategyBundle = config ? bundleQueries[config.strategy] : null;

  useEffect(() => {
    if (activeStep === 3 && (!config || !selectedBundle)) {
      setActiveStep(0);
    }
  }, [activeStep, config, selectedBundle]);

  const renderStepContent = () => {
    if (activeStep === 0) {
      return <UserSearchPanel onSelect={handleSelectRecipient} />;
    }

    if (activeStep === 1 && recipient) {
      return (
        <GiftConfigPanel
          recipient={recipient}
          initialConfig={config}
          onFind={handleFind}
          loading={recsQuery.isFetching}
          onBack={handleBackToRecipient}
        />
      );
    }

    if (activeStep === 2 && recipient && config) {
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
            <Tab label="Best Bundle" />
            <Tab label="All Strategies" />
            <Tab label="Top Picks" />
          </Tabs>

          {resultsTab === 0 && (
            <BundleView
              bundle={Array.isArray(selectedStrategyBundle?.data) ? null : selectedStrategyBundle?.data}
              strategy={giftStrategies.find((s) => s.value === config.strategy)}
              isLoading={selectedStrategyBundle?.isLoading}
              onSelect={handleSelectBundle}
            />
          )}

          {resultsTab === 1 && (
            <Grid container spacing={3}>
              {giftStrategies.map((strategy) => {
                const q = bundleQueries[strategy.value];
                const maxScoreCount = bundleQueries.max_score?.data?.items?.length ?? null;
                return (
                  <Grid item xs={12} md={4} key={strategy.value}>
                    <BundleView
                      bundle={Array.isArray(q?.data) ? null : q?.data}
                      strategy={strategy}
                      isLoading={q?.isLoading}
                      compareCount={strategy.value === 'max_items' ? maxScoreCount : null}
                      onSelect={handleSelectBundle}
                    />
                  </Grid>
                );
              })}
            </Grid>
          )}

          {resultsTab === 2 && (
            recsQuery.isLoading ? <Spinner /> :
            recommendations.length === 0 ? (
              <Alert severity="info">
                {noPublicData || 'No recommendations found. Try increasing the budget.'}
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {recommendations.map((item) => (
                  <Grid item xs={12} sm={6} md={4} key={item.product.id}>
                    <RecommendationCard item={item} />
                  </Grid>
                ))}
              </Grid>
            )
          )}
        </Box>
      );
    }

    if (activeStep === 3 && selectedBundle) {
      return (
        <BundleEditor
          bundleProducts={selectedBundleProducts}
          budget={config?.budget ?? 0}
          bundleStrategy={selectedBundleStrategyLabel}
          recipient={recipient}
          onBack={() => setActiveStep(2)}
          onRemoveProduct={handleRemoveProductFromBundle}
          onAddProduct={handleAddProductToBundle}
          onProceed={() => window.location.assign('/chat')}
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
