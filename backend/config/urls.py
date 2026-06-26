from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from apps.users.controllers import MetadataController

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.users.auth_urls')),
    path('api/users/', include('apps.users.urls')),
    path('api/products/', include('apps.products.urls')),
    path('api/categories/', include('apps.products.category_urls')),
    path('api/tags/', include('apps.products.tag_urls')),
    path('api/wishlists/', include('apps.wishlists.urls')),
    path('api/recommendations/', include('apps.recommendations.urls')),
    path('api/chat/', include('apps.chat.urls')),
    path('api/metadata/', MetadataController.as_view(), name='metadata'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
