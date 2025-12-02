from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import login, authenticate, logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie

from rest_framework import generics, permissions, viewsets, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status

from .models import Post, Tag, Profile
from django.contrib.auth.models import User
from .serializers import (RegisterSerializer, 
    UserSerializer, 
    PostSerializer, 
    TagSerializer,
    ProfileSerializer)

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny] 

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        login(request, user)
        
        return Response(UserSerializer(user).data)

@method_decorator(ensure_csrf_cookie, name='dispatch')
class GetCSRFToken(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
       
        return Response({"success": "CSRF cookie set"})

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')
        
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            # Kullanıcı doğrulandı, session başlat
            login(request, user)
            # Kullanıcı verisini (profile dahil) React'e döndür
            return Response(UserSerializer(user).data)
        else:
            # Hatalı giriş
            return Response(
                {"error": "Kullanıcı adı veya şifre hatalı."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

# --- YENİ EKLENEN LOGOUT VIEW ---
class LogoutView(APIView):
    # Çıkış yapmak için giriş yapmış olmak gerekir
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        logout(request)
        return Response({"success": "Başarıyla çıkış yapıldı."}, status=status.HTTP_200_OK)


class SessionView(APIView):
    permission_classes = [permissions.AllowAny] 

    def get(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            return Response(UserSerializer(request.user).data)
        
        # Giriş yapılmamışsa 401 hatası döndür
        return Response({"error": "Giriş yapılmamış."}, status=status.HTTP_401_UNAUTHORIZED)

class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all().order_by('-created_at')
    serializer_class = PostSerializer
    
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
       
        serializer.save(posted_by=self.request.user)

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
    
    def get_queryset(self):
        """
        Coğrafi sınır (bounding box) filtresi ekler.
        Query parametreleri: min_lat, max_lat, min_lon, max_lon
        """
        queryset = super().get_queryset()
        
        # Bounding box parametrelerini al
        min_lat = self.request.query_params.get('min_lat')
        max_lat = self.request.query_params.get('max_lat')
        min_lon = self.request.query_params.get('min_lon')
        max_lon = self.request.query_params.get('max_lon')
        
        # Coğrafi filtreleme uygula
        if min_lat is not None:
            try:
                queryset = queryset.filter(latitude__gte=float(min_lat))
            except (ValueError, TypeError):
                pass
        
        if max_lat is not None:
            try:
                queryset = queryset.filter(latitude__lte=float(max_lat))
            except (ValueError, TypeError):
                pass
        
        if min_lon is not None:
            try:
                queryset = queryset.filter(longitude__gte=float(min_lon))
            except (ValueError, TypeError):
                pass
        
        if max_lon is not None:
            try:
                queryset = queryset.filter(longitude__lte=float(max_lon))
            except (ValueError, TypeError):
                pass
        
        return queryset


# User Profile Views
class UserProfileView(APIView):
    """
    GET /api/users/<username>/ - Başka kullanıcıların profilini görüntüleme (Public veriler)
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, username, *args, **kwargs):
        try:
            user = User.objects.get(username=username)
            # Public data: username, avatar, time_balance (opsiyonel)
            return Response({
                'id': user.id,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'avatar': user.profile.avatar if hasattr(user, 'profile') else None,
                'time_balance': float(user.profile.time_balance) if hasattr(user, 'profile') else 0.0,
                'bio': user.profile.bio if hasattr(user, 'profile') and hasattr(user.profile, 'bio') else None,
            })
        except User.DoesNotExist:
            return Response(
                {"error": "User not found."},
                status=status.HTTP_404_NOT_FOUND
            )


class MyProfileView(APIView):
    """
    GET /api/users/me/ - Kendi profilini görüntüleme
    PUT /api/users/me/ - Kendi profilini düzenleme
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """Kendi profilini görüntüle"""
        return Response(UserSerializer(request.user).data)

    def put(self, request, *args, **kwargs):
        """Kendi profilini düzenle"""
        user = request.user
        profile = user.profile
        
        # Email update
        if 'email' in request.data:
            user.email = request.data['email']
            user.save()
        
        # Profile update (avatar, bio, interested_tags)
        if 'avatar' in request.data:
            profile.avatar = request.data['avatar']
        
        if 'bio' in request.data:
            profile.bio = request.data['bio']
        
        if 'interested_tags' in request.data:
            tag_ids = request.data['interested_tags']
            from .models import Tag
            tags = Tag.objects.filter(id__in=tag_ids)
            profile.interested_tags.set(tags)
        
        profile.save()
        
        return Response(UserSerializer(user).data)