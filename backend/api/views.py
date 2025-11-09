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
from .serializers import (RegisterSerializer, 
    UserSerializer, 
    PostSerializer, 
    TagSerializer)

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

# --- YENİ EKLENEN SESSION VIEW ---
# (React App ilk yüklendiğinde "giriş yapmış mıyım?" diye kontrol edeceği yer)
class SessionView(APIView):
    permission_classes = [permissions.AllowAny] # İzinleri view içinde kontrol edeceğiz

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