import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Stepper, Step, StepLabel,
  Tabs, Tab, Alert, Button, Grid,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getRecommendations, getBundles } from '../api/recommendations';
import { getUserProfile } from '../api/users';
import { useMetadata } from '../general_hooks/useMetadata';
import UserSearchPanel from './UserSearchPanel';
import GiftConfigPanel from './GiftConfigPanel';
import RecommendationCard from './RecommendationCard';
import BundleView from './BundleView';
import Spinner from '../general_components/Spinner';

const STEPS = ['Select Recipient', 'Configure Gift', 'Results'];

const GiftFinderPage = () => {
  const [searchParams] = useSearchParams();
  const { giftStrategies } = useMetadata();

  const [activeStep, setActiveStep] = useState(0);
  const [recipient, setRecipient] = useState(null);
  const [config, setConfig] = useState(null);
  const [resultsTab, setResultsTab] = useState(0);

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
    setActiveStep(1);
  };

  const handleFind = (params) => {
    setConfig(params);
    setActiveStep(2);
    setResultsTab(0);
  };

  const handleReset = () => {
    setActiveStep(0);
    setRecipient(null);
    setConfig(null);
  };

  const recommendations = Array.isArray(recsQuery.data) ? recsQuery.data : [];
  const noPublicData = recsQuery.data?.message;

  const selectedStrategyBundle = config ? bundleQueries[config.strategy] : null;

  return (
    <Box>
      <Typography variant="h3" sx={{ mb: 3 }}>Find a Gift</Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {STEPS.map((label, i) => (
          <Step key={label} completed={i < activeStep}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {activeStep === 0 && (
        <UserSearchPanel onSelect={handleSelectRecipient} />
      )}

      {activeStep === 1 && recipient && (
        <GiftConfigPanel
          recipient={recipient}
          onFind={handleFind}
          loading={recsQuery.isFetching}
        />
      )}

      {activeStep === 2 && recipient && config && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">
              Gifts for <strong>{recipient.username}</strong>
            </Typography>
            <Button variant="outlined" size="small" onClick={handleReset}>
              Start Over
            </Button>
          </Box>

          {noPublicData && (
            <Alert severity="info" sx={{ mb: 2 }}>{noPublicData}</Alert>
          )}

          <Tabs value={resultsTab} onChange={(_, v) => setResultsTab(v)} sx={{ mb: 3 }}>
            <Tab label="Top Picks" />
            <Tab label="Best Bundle" />
            <Tab label="All Strategies" />
          </Tabs>

          {resultsTab === 0 && (
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

          {resultsTab === 1 && (
            <BundleView
              bundle={Array.isArray(selectedStrategyBundle?.data) ? null : selectedStrategyBundle?.data}
              strategy={giftStrategies.find((s) => s.value === config.strategy)}
              isLoading={selectedStrategyBundle?.isLoading}
            />
          )}

          {resultsTab === 2 && (
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
                    />
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      )}
    </Box>
  );
};

export default GiftFinderPage;
