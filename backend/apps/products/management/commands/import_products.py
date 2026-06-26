import csv

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.text import slugify

from apps.users.models import Category
from apps.products.models import Product, Tag


class Command(BaseCommand):
    help = 'Import products from a CSV file. Existing products (matched by name) are updated.'

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help='Path to the CSV file')

    def handle(self, *args, **options):
        csv_path = options['csv_file']
        try:
            f = open(csv_path, newline='', encoding='utf-8')
        except FileNotFoundError:
            raise CommandError(f"File not found: {csv_path}")

        created = updated = skipped = 0
        error_lines = []

        with f, transaction.atomic():
            reader = csv.DictReader(f)
            for line_num, row in enumerate(reader, start=2):
                result = self._import_row(line_num, row, error_lines)
                if result == 'created':
                    created += 1
                elif result == 'updated':
                    updated += 1
                else:
                    skipped += 1

        self.stdout.write(self.style.SUCCESS(
            f"Import complete — created: {created}, updated: {updated}, skipped: {skipped}"
        ))
        for msg in error_lines:
            self.stdout.write(self.style.WARNING(f"  {msg}"))

    def _import_row(self, line_num, row, error_lines):
        name = (row.get('name') or '').strip()
        if not name:
            error_lines.append(f"Line {line_num}: 'name' is required — skipped")
            return 'skipped'

        price_raw = (row.get('price') or '').strip()
        try:
            price = float(price_raw)
            if price <= 0:
                raise ValueError()
        except (ValueError, TypeError):
            error_lines.append(f"Line {line_num}: invalid price '{price_raw}' — skipped")
            return 'skipped'

        category_slug = (row.get('category_slug') or '').strip()
        category = None
        if category_slug:
            category = Category.objects.filter(slug=category_slug).first()
            if not category:
                error_lines.append(
                    f"Line {line_num}: unknown category_slug '{category_slug}' — skipped"
                )
                return 'skipped'

        product, was_created = Product.objects.get_or_create(
            name=name,
            defaults={
                'description': (row.get('description') or '').strip(),
                'price': price,
                'category': category,
                'image_url': (row.get('image_url') or '').strip(),
                'purchase_url': (row.get('purchase_url') or '').strip(),
                'is_active': True,
            },
        )

        if not was_created:
            product.description = (row.get('description') or '').strip()
            product.price = price
            product.category = category
            product.image_url = (row.get('image_url') or '').strip()
            product.purchase_url = (row.get('purchase_url') or '').strip()
            product.save()

        tags_raw = (row.get('tags') or '').strip()
        if tags_raw:
            tag_names = [t.strip() for t in tags_raw.split(',') if t.strip()]
            tag_objs = []
            for tag_name in tag_names:
                tag, _ = Tag.objects.get_or_create(
                    name=tag_name,
                    defaults={'slug': slugify(tag_name)},
                )
                tag_objs.append(tag)
            product.tags.set(tag_objs)

        return 'created' if was_created else 'updated'
