from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import login, authenticate, logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie

from rest_framework import generics, permissions, viewsets, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status

from .models import Post, Tag, Profile, Comment, Proposal, Review, Job
from django.contrib.auth.models import User
from .serializers import (RegisterSerializer, 
    UserSerializer, 
    PostSerializer, 
    TagSerializer,
    ProfileSerializer,
    CommentSerializer,
    ProposalSerializer,
    ReviewSerializer)

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
            # Use UserSerializer to get profile data including review_averages
            serializer = UserSerializer(user)
            user_data = serializer.data
            # Add first_name and last_name to response (public data)
            user_data['first_name'] = user.first_name
            user_data['last_name'] = user.last_name
            # Ensure profile data structure is correct
            if 'profile' in user_data:
                # Profile data is already included from UserSerializer with review_averages
                pass
            else:
                # Fallback: manually add profile data if serializer doesn't include it
                profile = user.profile if hasattr(user, 'profile') else None
                user_data['profile'] = {
                    'avatar': profile.avatar if profile else None,
                    'time_balance': float(profile.time_balance) if profile else 0.0,
                    'bio': profile.bio if profile and hasattr(profile, 'bio') else None,
                    'phone': profile.phone if profile and hasattr(profile, 'phone') else None,
                    'location': profile.location if profile and hasattr(profile, 'location') else None,
                    'review_averages': profile.get_review_averages() if profile else None,
                }
            return Response(user_data)
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
        """Filter proposals by requester (sent proposals), provider (received proposals), or post ID"""
        queryset = Proposal.objects.all()
        
        # Filter by post ID if provided
        post_id = self.request.query_params.get('post', None)
        if post_id is not None:
            queryset = queryset.filter(post_id=post_id)
        
        # Filter by username if provided (for viewing other users' proposals)
        username = self.request.query_params.get('username', None)
        target_user = None
        if username:
            try:
                target_user = User.objects.get(username=username)
            except User.DoesNotExist:
                pass
        
        # Filter by sent proposals (proposals sent by user as requester)
        sent = self.request.query_params.get('sent', None)
        if sent == 'true':
            user_to_filter = target_user if target_user else self.request.user
            queryset = queryset.filter(requester=user_to_filter)
        
        # Filter by received proposals (proposals for posts owned by user as provider)
        received = self.request.query_params.get('received', None)
        if received == 'true':
            user_to_filter = target_user if target_user else self.request.user
            queryset = queryset.filter(provider=user_to_filter)
        
        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        """Set the requester to the current authenticated user and provider to the post owner"""
        post = serializer.validated_data['post']
        serializer.save(requester=self.request.user, provider=post.posted_by)
    
    def update(self, request, *args, **kwargs):
        """Handle update with proper error handling for balance validation"""
        try:
            instance = self.get_object()
            
            # Check if this is a decline action (from approval page)
            # If proposal is already accepted and has jobs, we should only cancel the job, not the proposal
            if 'decline_job' in request.data and request.data['decline_job']:
                # This is a decline from approval page - only cancel the job, keep proposal status as accepted
                from api.models import Profile
                from rest_framework.response import Response
                
                # Cancel the job (at approval stage, job should be 'waiting')
                job = instance.jobs.filter(status='waiting').first()
                if not job:
                    return Response(
                        {'detail': 'No waiting job found to cancel.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                job.status = 'cancelled'
                job.cancelled_by = request.user
                
                # Set cancellation_reason if provided
                cancellation_reason = request.data.get('cancellation_reason', 'other')
                if cancellation_reason in ['not_showed_up', 'other']:
                    job.cancellation_reason = cancellation_reason
                else:
                    job.cancellation_reason = 'other'  # Default to 'other'
                
                job.save()
                
                # Handle balance based on cancellation_reason
                if cancellation_reason == 'not_showed_up':
                    # Transfer balance to the other party
                    if instance.post.post_type == 'offer':
                        # Offer: transfer to provider (post owner)
                        provider_profile = instance.provider.profile
                        provider_profile.time_balance += instance.timebank_hour
                        provider_profile.save()
                    elif instance.post.post_type == 'need':
                        # Need: transfer to requester
                        requester_profile = instance.requester.profile
                        requester_profile.time_balance += instance.timebank_hour
                        requester_profile.save()
                else:  # 'other' - refund to original payer
                    # Refund balance based on post type
                    if instance.post.post_type == 'offer':
                        # Offer: refund to requester
                        requester_profile = instance.requester.profile
                        requester_profile.time_balance += instance.timebank_hour
                        requester_profile.save()
                    elif instance.post.post_type == 'need':
                        # Need: refund to provider
                        provider_profile = instance.provider.profile
                        provider_profile.time_balance += instance.timebank_hour
                        provider_profile.save()
                
                # Update notes if provided
                if 'notes' in request.data:
                    instance.notes = (instance.notes or '') + '\n\n' + request.data['notes']
                    instance.save()
                
                # Return updated instance without going through serializer validation
                # because decline_job is not a valid serializer field
                serializer = self.get_serializer(instance)
                return Response(serializer.data)
            
            # Check if status is being changed to cancelled (regular cancellation)
            if 'status' in request.data and request.data['status'] == 'cancelled':
                # Update related jobs to set cancelled_by
                for job in instance.jobs.all():
                    if job.status == 'waiting':
                        job.status = 'cancelled'
                        job.cancelled_by = request.user
                        job.save()
            
            return super().update(request, *args, **kwargs)
        except ValidationError as e:
            from rest_framework.response import Response
            from rest_framework import status
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class ReviewViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Review model
    GET /api/reviews/ - List all reviews
    GET /api/reviews/<id>/ - Get review details
    POST /api/reviews/ - Create a new review
    PUT /api/reviews/<id>/ - Update a review
    DELETE /api/reviews/<id>/ - Delete a review
    """
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Filter reviews by proposal, reviewer, or reviewed_user"""
        queryset = Review.objects.all()
        
        # Filter by proposal ID
        proposal_id = self.request.query_params.get('proposal', None)
        if proposal_id is not None:
            queryset = queryset.filter(proposal_id=proposal_id)
        
        # Filter by reviewed user
        reviewed_user = self.request.query_params.get('reviewed_user', None)
        if reviewed_user is not None:
            queryset = queryset.filter(reviewed_user_id=reviewed_user)
        
        # Filter by reviewer
        reviewer = self.request.query_params.get('reviewer', None)
        if reviewer is not None:
            queryset = queryset.filter(reviewer_id=reviewer)
        
        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        """Set the reviewer to the current authenticated user"""
        proposal = serializer.validated_data['proposal']
        
        # Determine reviewed_user based on post type and current user
        post_type = proposal.post.post_type
        is_requester = self.request.user.id == proposal.requester_id
        is_provider = self.request.user.id == proposal.provider_id
        
        if post_type == 'offer' and is_requester:
            # Offer: requester reviews provider
            reviewed_user = proposal.provider
        elif post_type == 'need' and is_provider:
            # Need: provider reviews requester
            reviewed_user = proposal.requester
        else:
            raise PermissionDenied("You are not authorized to create a review for this proposal.")
        
        serializer.save(reviewer=self.request.user, reviewed_user=reviewed_user)