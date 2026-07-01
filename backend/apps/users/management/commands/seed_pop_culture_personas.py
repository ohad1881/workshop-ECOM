import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.text import slugify

from apps.users.models import User, Category
from apps.products.models import Product, Tag
from apps.wishlists.models import WishlistItem


class Command(BaseCommand):
    help = (
        'Seed demo persona users with profiles and wishlists from a JSON file '
        '(see README for schema). Idempotent — matches existing users by username '
        'and wishlist rows by (user, product).'
    )

    def add_arguments(self, parser):
        parser.add_argument('data_file', type=str, help='Path to the users/profiles/wishlist JSON file')

    def handle(self, *args, **options):
        path = Path(options['data_file'])
        try:
            data = json.loads(path.read_text(encoding='utf-8'))
        except FileNotFoundError:
            raise CommandError(f"Data file not found: {path}")
        except json.JSONDecodeError as e:
            raise CommandError(f"Invalid JSON in {path}: {e}")

        created = updated = 0
        with transaction.atomic():
            for row in data.get('users', []):
                was_created = self._seed_user(row)
                created += was_created
                updated += not was_created

        self.stdout.write(self.style.SUCCESS(f"Personas — {created} created, {updated} updated."))

    def _seed_user(self, row):
        username = row['username']
        user, was_created = User.objects.get_or_create(
            username=username,
            defaults={'email': row['email'], 'bio': row.get('bio', '')},
        )
        user.email = row['email']
        user.bio = row.get('bio', '')
        user.set_password(row['password'])
        user.save()

        profile = user.profile
        profile.interests.set(self._resolve_tags(row.get('interests', [])))
        profile.preferred_categories.set(self._resolve_categories(row.get('preferred_categories', [])))
        profile.excluded_categories.set(self._resolve_categories(row.get('excluded_categories', [])))

        for item in row.get('wishlist', []):
            self._seed_wishlist_item(user, item)

        return was_created

    def _resolve_tags(self, names):
        tags = []
        for name in names:
            tag, _ = Tag.objects.get_or_create(slug=slugify(name), defaults={'name': name})
            tags.append(tag)
        return tags

    def _resolve_categories(self, slugs):
        return list(Category.objects.filter(slug__in=slugs))

    def _seed_wishlist_item(self, user, item):
        product = Product.objects.filter(name=item['product_name']).first()
        if not product:
            self.stdout.write(self.style.WARNING(
                f"  {user.username}: wishlist product not found — '{item['product_name']}'"
            ))
            return
        WishlistItem.objects.update_or_create(
            user=user,
            product=product,
            defaults={
                'priority': item.get('priority', 5),
                'privacy': item.get('privacy', WishlistItem.PrivacyLevel.PUBLIC),
                'note': item.get('note', ''),
            },
        )
