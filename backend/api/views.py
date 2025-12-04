from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import login, authenticate, logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie

from rest_framework import generics, permissions, viewsets, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status

from .models import Post, Tag, Profile, Comment, Proposal
from django.contrib.auth.models import User
from .serializers import (RegisterSerializer, 
    UserSerializer, 
    PostSerializer, 
    TagSerializer,
    ProfileSerializer,
    CommentSerializer,
    ProposalSerializer)

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
            # User authenticated, start session
            login(request, user)
            # Return user data (including profile) to React
            return Response(UserSerializer(user).data)
        else:
            # Invalid login
            return Response(
                {"error": "Invalid username or password."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

# --- NEWLY ADDED LOGOUT VIEW ---
class LogoutView(APIView):
    # User must be authenticated to logout
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        logout(request)
        return Response({"success": "Successfully logged out."}, status=status.HTTP_200_OK)


class SessionView(APIView):
    permission_classes = [permissions.AllowAny] 

    def get(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            return Response(UserSerializer(request.user).data)
        
        # Return 401 error if not authenticated
        return Response({"error": "Not authenticated."}, status=status.HTTP_401_UNAUTHORIZED)

class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all().order_by('-created_at')
    serializer_class = PostSerializer
    
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
       
        serializer.save(posted_by=self.request.user)

    # Filtering settings
    filter_backends = [
        DjangoFilterBackend, 
        filters.SearchFilter, 
        filters.OrderingFilter
    ]
    
    # Which fields can be filtered?
    filterset_fields = ['post_type', 'location', 'tags__name', 'posted_by__username']
    
    # Which fields can be searched?
    search_fields = ['title', 'description', 'tags__name']
    
    # Which fields can be used for ordering?
    ordering_fields = ['created_at', 'title']
    
    def get_queryset(self):
        """
        Adds geographical bounding box filter.
        Query parameters: min_lat, max_lat, min_lon, max_lon
        """
        queryset = super().get_queryset()
        
        # Get bounding box parameters
        min_lat = self.request.query_params.get('min_lat')
        max_lat = self.request.query_params.get('max_lat')
        min_lon = self.request.query_params.get('min_lon')
        max_lon = self.request.query_params.get('max_lon')
        
        # Apply geographical filtering
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
    GET /api/users/<username>/ - View another user's profile (Public data)
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, username, *args, **kwargs):
        try:
            user = User.objects.get(username=username)
            # Public data: username, avatar, time_balance (optional)
            return Response({
                'id': user.id,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'avatar': user.profile.avatar if hasattr(user, 'profile') else None,
                'time_balance': float(user.profile.time_balance) if hasattr(user, 'profile') else 0.0,
                'bio': user.profile.bio if hasattr(user, 'profile') and hasattr(user.profile, 'bio') else None,
                'phone': user.profile.phone if hasattr(user, 'profile') and hasattr(user.profile, 'phone') else None,
                'location': user.profile.location if hasattr(user, 'profile') and hasattr(user.profile, 'location') else None,
            })
        except User.DoesNotExist:
            return Response(
                {"error": "User not found."},
                status=status.HTTP_404_NOT_FOUND
            )


class MyProfileView(APIView):
    """
    GET /api/users/me/ - View own profile
    PUT /api/users/me/ - Edit own profile
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """View own profile"""
        return Response(UserSerializer(request.user).data)

    def put(self, request, *args, **kwargs):
        """Edit own profile"""
        user = request.user
        profile = user.profile
        
        # Email update
        if 'email' in request.data:
            user.email = request.data['email']
            user.save()
        
        # Profile update (avatar, bio, phone, location, interested_tags)
        if 'avatar' in request.data:
            profile.avatar = request.data['avatar']
        
        if 'bio' in request.data:
            profile.bio = request.data['bio']
        
        if 'phone' in request.data:
            profile.phone = request.data['phone']
        
        if 'location' in request.data:
            profile.location = request.data['location']
        
        if 'interested_tags' in request.data:
            tag_ids = request.data['interested_tags']
            from .models import Tag
            tags = Tag.objects.filter(id__in=tag_ids)
            profile.interested_tags.set(tags)
        
        profile.save()
        
        return Response(UserSerializer(user).data)


class CommentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Comment model
    GET /api/comments/ - List all comments
    GET /api/comments/<id>/ - Get comment details
    POST /api/comments/ - Create a new comment
    PUT /api/comments/<id>/ - Update a comment
    DELETE /api/comments/<id>/ - Delete a comment
    """
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        """Set the user to the current authenticated user"""
        serializer.save(user=self.request.user)

    def perform_destroy(self, instance):
        """Only allow comment owner to delete their comment"""
        if instance.user != self.request.user:
            raise PermissionDenied("You can only delete your own comments.")
        instance.delete()

    def get_queryset(self):
        """Filter comments by post if post_id query parameter is provided"""
        queryset = super().get_queryset()
        post_id = self.request.query_params.get('post_id', None)
        if post_id is not None:
            queryset = queryset.filter(post_id=post_id)
        return queryset


class ProposalViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Proposal model
    GET /api/proposals/ - List all proposals (filtered by user)
    GET /api/proposals/<id>/ - Get proposal details
    POST /api/proposals/ - Create a new proposal
    PUT /api/proposals/<id>/ - Update a proposal
    DELETE /api/proposals/<id>/ - Delete a proposal
    """
    serializer_class = ProposalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Filter proposals by sender (sent proposals), post owner (received proposals), or post ID"""
        queryset = Proposal.objects.all()
        
        # Filter by post ID if provided
        post_id = self.request.query_params.get('post', None)
        if post_id is not None:
            queryset = queryset.filter(post_id=post_id)
        
        # Filter by sent proposals (proposals sent by current user)
        sent = self.request.query_params.get('sent', None)
        if sent == 'true':
            queryset = queryset.filter(sender=self.request.user)
        
        # Filter by received proposals (proposals for posts owned by current user)
        received = self.request.query_params.get('received', None)
        if received == 'true':
            queryset = queryset.filter(post__posted_by=self.request.user)
        
        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        """Set the sender to the current authenticated user"""
        serializer.save(sender=self.request.user)