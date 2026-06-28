from .repositories import CategoryRepository, ProductRepository, TagRepository


class CategoryService:
    @staticmethod
    def list(query=None, limit=20):
        if query:
            return CategoryRepository.search(query, limit)
        return CategoryRepository.get_all()[:limit]


class TagService:
    @staticmethod
    def list(query=None, limit=20):
        if query:
            return TagRepository.search(query, limit)
        return TagRepository.get_all()[:limit]


class ProductService:
    @staticmethod
    def get_product(product_id):
        product = ProductRepository.get_by_id(product_id)
        if not product:
            raise ValueError(f"Product {product_id} not found or inactive")
        return product

    @staticmethod
    def list_products(category_id=None, tag_ids=None, min_price=None, max_price=None, search=None):
        return ProductRepository.list_active(
            category_id=category_id,
            tag_ids=tag_ids,
            min_price=min_price,
            max_price=max_price,
            search=search,
        )

    @staticmethod
    def search_products(query, limit=20):
        return ProductRepository.full_text_search(query, limit)
