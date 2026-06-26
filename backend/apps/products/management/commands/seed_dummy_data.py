import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.text import slugify

from apps.users.models import Category
from apps.products.models import Product, Tag

DEFAULT_DATA_FILE = Path(__file__).resolve().parents[4] / 'seed_data' / 'dummy_data.json'


class Command(BaseCommand):
    help = (
        'Seed the DB with dummy categories, tags, and products for local development. '
        'Reads a JSON data file (gitignored). Idempotent — matches existing rows by '
        'slug/name. Does NOT create users.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--file', type=str, default=str(DEFAULT_DATA_FILE),
            help='Path to the JSON data file (default: seed_data/dummy_data.json)',
        )
        parser.add_argument(
            '--clear', action='store_true',
            help='Delete existing products, tags, and categories before seeding.',
        )

    def handle(self, *args, **options):
        path = Path(options['file'])
        try:
            data = json.loads(path.read_text(encoding='utf-8'))
        except FileNotFoundError:
            raise CommandError(f"Data file not found: {path}")
        except json.JSONDecodeError as e:
            raise CommandError(f"Invalid JSON in {path}: {e}")

        with transaction.atomic():
            if options['clear']:
                Product.objects.all().delete()
                Tag.objects.all().delete()
                Category.objects.all().delete()
                self.stdout.write(self.style.WARNING('Cleared products, tags, and categories.'))

            cats = self._seed_categories(data.get('categories', []))
            tags = self._seed_tags(data.get('tags', []))
            self._seed_products(data.get('products', []), cats, tags)

    def _seed_categories(self, rows):
        by_slug = {}
        created = 0
        for row in rows:
            slug = row['slug']
            cat, was_created = Category.objects.get_or_create(
                slug=slug,
                defaults={'name': row['name'], 'icon': row.get('icon', '')},
            )
            by_slug[slug] = cat
            created += was_created
        self.stdout.write(self.style.SUCCESS(f"Categories — {created} created, {len(rows)} total."))
        return by_slug

    def _seed_tags(self, rows):
        by_slug = {}
        created = 0
        for row in rows:
            name = row if isinstance(row, str) else row['name']
            slug = slugify(name)
            tag, was_created = Tag.objects.get_or_create(slug=slug, defaults={'name': name})
            by_slug[slug] = tag
            created += was_created
        self.stdout.write(self.style.SUCCESS(f"Tags — {created} created, {len(rows)} total."))
        return by_slug

    def _seed_products(self, rows, cats, tags):
        created = updated = 0
        for row in rows:
            category = cats.get(row.get('category_slug'))
            product, was_created = Product.objects.get_or_create(
                name=row['name'],
                defaults={
                    'description': row.get('description', ''),
                    'price': row['price'],
                    'category': category,
                    'image_url': row.get('image_url', ''),
                    'purchase_url': row.get('purchase_url', ''),
                    'is_active': row.get('is_active', True),
                },
            )
            if not was_created:
                product.description = row.get('description', '')
                product.price = row['price']
                product.category = category
                product.image_url = row.get('image_url', '')
                product.purchase_url = row.get('purchase_url', '')
                product.save()
                updated += 1
            else:
                created += 1

            tag_objs = [tags[s] for s in (slugify(t) for t in row.get('tags', [])) if s in tags]
            product.tags.set(tag_objs)

        self.stdout.write(self.style.SUCCESS(f"Products — {created} created, {updated} updated."))
