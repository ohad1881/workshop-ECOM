# GiftGraph Clean Pop-Culture Demo Dataset v2

Cleaned version after feedback.

## Fixes

- Product names are max 3 words.
- Removed all generated suffixes like `#111`.
- Taylor Swift and all other personas now point only to clean product names.
- Images are real photo URLs and chosen by intuitive product type.
- 200 products, 10 users, 40 wishlist items.
- Every wishlist item has priority, privacy and note.
- All users share password: `GiftGraphDemo2026!`.

## Import

```bash
cd backend
python manage.py seed_dummy_data seed_data/pop_culture_demo/giftgraph_seed_products_categories_tags.json
python manage.py seed_pop_culture_personas seed_data/pop_culture_demo/giftgraph_seed_users_profiles_wishlist.json
```

## Users

| Name | Username | Password | Theme |
|---|---|---|---|
| Mark Zuckerberg | `mark_zuckerberg` | `GiftGraphDemo2026!` | Tech / Gadgets / Productivity |
| Cristiano Ronaldo | `cristiano_ronaldo` | `GiftGraphDemo2026!` | Fitness / Wellness / Performance |
| Taylor Swift | `taylor_swift` | `GiftGraphDemo2026!` | Writing / Cozy / Storytelling |
| Eyal Shani | `eyal_shani` | `GiftGraphDemo2026!` | Food / Hosting / Kitchen |
| Vincent van Gogh | `vincent_van_gogh` | `GiftGraphDemo2026!` | Art / Creativity / Painting |
| MrBeast | `mrbeast` | `GiftGraphDemo2026!` | Gaming / Tech Toys / Challenges |
| Kim Kardashian | `kim_kardashian` | `GiftGraphDemo2026!` | Fashion / Beauty / Lifestyle |
| Indiana Jones | `indiana_jones` | `GiftGraphDemo2026!` | Travel / Adventure / Exploration |
| John Lennon | `john_lennon` | `GiftGraphDemo2026!` | Music / Retro / Vinyl |
| Sherlock Holmes | `sherlock_holmes` | `GiftGraphDemo2026!` | Puzzles / Mystery / Strategy |

## Files

- `01_categories.csv`
- `02_tags.csv`
- `03_products_import_products.csv`
- `04_users.csv`
- `04_users_full_profiles.csv`
- `05_user_profiles.csv`
- `06_wishlist_items.csv`
- `07_demo_combinations.csv`
- `giftgraph_seed_products_categories_tags.json`
- `giftgraph_seed_users_profiles_wishlist.json`
