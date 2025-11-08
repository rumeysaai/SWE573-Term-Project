from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from .models import Post, Tag
from .serializers import PostSerializer, TagSerializer

class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all().order_by('-created_at')
    serializer_class = PostSerializer
    
    # Filtreleme ayarları
    filter_backends = [
        DjangoFilterBackend, 
        filters.SearchFilter, 
        filters.OrderingFilter
    ]
    
    # Hangi alanlara göre filtreleme yapılabilir?
    filterset_fields = ['post_type', 'location', 'tags__name']
    
    # Hangi alanlarda metin araması yapılabilir?
    search_fields = ['title', 'description', 'tags__name']
    
    # Hangi alanlara göre sıralama yapılabilir?
    ordering_fields = ['created_at', 'title']