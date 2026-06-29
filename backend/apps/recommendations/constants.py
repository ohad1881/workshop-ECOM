WISHLIST_WEIGHT = 0.35
CATEGORY_WEIGHT = 0.20
TAG_OVERLAP_WEIGHT = 0.20
COMMUNITY_WEIGHT = 0.10
EVENT_WEIGHT = 0.05
GIVER_PREFERENCE_WEIGHT = 0.10

MAX_PRIORITY = 5

MIN_RELEVANCE_THRESHOLD = 0.25       # max_score / balanced: premium items only
QUANTITY_STRATEGY_THRESHOLD = 0.10  # max_items: allow more items at lower quality floor

# Bundle optimization strategies.
STRATEGY_MAX_SCORE = 'max_score'
STRATEGY_MAX_ITEMS = 'max_items'
STRATEGY_BALANCED = 'balanced'
STRATEGIES = (STRATEGY_MAX_SCORE, STRATEGY_MAX_ITEMS, STRATEGY_BALANCED)
DEFAULT_STRATEGY = STRATEGY_BALANCED

# Maps event type → category names that get a score boost for that event.
EVENT_CATEGORY_MAP = {
    'birthday': ['toys & games', 'fashion', 'electronics', 'beauty'],
    'wedding': ['home & kitchen', 'art & crafts', 'food & drink'],
    'graduation': ['books', 'electronics', 'travel'],
    'holiday': ['food & drink', 'fashion', 'home & kitchen'],
    'anniversary': ['fashion', 'beauty', 'travel', 'food & drink'],
}
