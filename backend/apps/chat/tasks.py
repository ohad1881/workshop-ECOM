from celery import shared_task


@shared_task(bind=True, max_retries=3, default_retry_delay=5)
def persist_giver_preference(self, user_id, preference_type, value, context=''):
    """
    Persist a learned giver preference in the background so it doesn't
    block the SSE stream. Called by the AI service after detecting a
    preference expression in the conversation.
    """
    try:
        from apps.users.models import User
        from apps.recommendations.repositories import GiftGiverPreferenceRepository
        user = User.objects.get(id=user_id)
        GiftGiverPreferenceRepository.upsert(
            user=user,
            preference_type=preference_type,
            value=value,
            context=context,
        )
    except Exception as exc:
        raise self.retry(exc=exc)
