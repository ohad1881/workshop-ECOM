from .models import WishlistItem


class WishlistRepository:
    @staticmethod
    def get_user_items(user_id):
        """All items for the owner — includes private."""
        return (
            WishlistItem.objects
            .select_related('product__category')
            .prefetch_related('product__tags')
            .filter(user_id=user_id)
        )

    @staticmethod
    def get_public_items(user_id):
        """Public items only — used when viewing another user's wishlist."""
        return (
            WishlistItem.objects
            .select_related('product__category')
            .prefetch_related('product__tags')
            .filter(user_id=user_id, privacy='public')
        )

    @staticmethod
    def get_by_id(item_id):
        return WishlistItem.objects.select_related('product', 'user').filter(id=item_id).first()

    @staticmethod
    def get_by_user_and_product(user_id, product_id):
        return WishlistItem.objects.filter(user_id=user_id, product_id=product_id).first()

    @staticmethod
    def create(user_id, product_id, privacy='public', priority=0, note=''):
        return WishlistItem.objects.create(
            user_id=user_id,
            product_id=product_id,
            privacy=privacy,
            priority=priority,
            note=note,
        )

    @staticmethod
    def update(item, **kwargs):
        for key, value in kwargs.items():
            setattr(item, key, value)
        item.save(update_fields=list(kwargs.keys()))
        return item

    @staticmethod
    def delete(item):
        item.delete()
