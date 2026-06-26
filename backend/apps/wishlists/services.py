from apps.products.repositories import ProductRepository
from .repositories import WishlistRepository


class WishlistConflictError(Exception):
    pass


class WishlistService:
    @staticmethod
    def get_own_wishlist(user_id):
        return WishlistRepository.get_user_items(user_id)

    @staticmethod
    def get_public_wishlist(user_id):
        return WishlistRepository.get_public_items(user_id)

    @staticmethod
    def add_item(user_id, product_id, privacy='public', priority=0, note=''):
        product = ProductRepository.get_by_id(product_id)
        if not product:
            raise ValueError("Product not found.")

        if WishlistRepository.get_by_user_and_product(user_id, product_id):
            raise WishlistConflictError("Product already in wishlist.")

        return WishlistRepository.create(
            user_id=user_id,
            product_id=product_id,
            privacy=privacy,
            priority=priority,
            note=note,
        )

    @staticmethod
    def update_item(item_id, user_id, **kwargs):
        item = WishlistRepository.get_by_id(item_id)
        if not item:
            raise ValueError("Wishlist item not found.")
        if item.user_id != user_id:
            raise PermissionError("Not your wishlist item.")
        return WishlistRepository.update(item, **kwargs)

    @staticmethod
    def remove_item(item_id, user_id):
        item = WishlistRepository.get_by_id(item_id)
        if not item:
            raise ValueError("Wishlist item not found.")
        if item.user_id != user_id:
            raise PermissionError("Not your wishlist item.")
        WishlistRepository.delete(item)
