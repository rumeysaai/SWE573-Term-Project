from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import login, authenticate, logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie

from rest_framework import generics, permissions, viewsets, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status

from .models import Post, Tag, Profile, Comment, Proposal, Review, Job, Chat, Message
from django.contrib.auth.models import User
from .serializers import (RegisterSerializer, 
    UserSerializer, 
    PostSerializer, 
    TagSerializer,
    ProfileSerializer,
    CommentSerializer,
    ProposalSerializer,
    ReviewSerializer,
    ChatListSerializer,
    MessageSerializer)
from django.db.models import Q
from django.utils import timezone

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


class ChatViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Chat model
    GET /api/chats/ - List all chats for current user (ordered by updated_at descending)
    POST /api/chats/ - Create or get existing chat with user_id
    """
    serializer_class = ChatListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Get all chats where current user is participant1 or participant2"""
        user = self.request.user
        return Chat.objects.filter(
            Q(participant1=user) | Q(participant2=user)
        ).order_by('-updated_at')

    def get_serializer_context(self):
        """Add request to serializer context for ChatListSerializer"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def create(self, request, *args, **kwargs):
        """Create or get existing chat with user_id"""
        user_id = request.data.get('user_id')
        if not user_id:
            return Response(
                {'error': 'user_id is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            other_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if other_user == request.user:
            return Response(
                {'error': 'Cannot create chat with yourself.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if chat already exists (in either direction)
        chat = Chat.objects.filter(
            (Q(participant1=request.user) & Q(participant2=other_user)) |
            (Q(participant1=other_user) & Q(participant2=request.user))
        ).first()
        
        if chat:
            # Chat exists, return it
            serializer = self.get_serializer(chat)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        # Create new chat (always put smaller user_id as participant1 for consistency)
        if request.user.id < other_user.id:
            chat = Chat.objects.create(
                participant1=request.user,
                participant2=other_user
            )
        else:
            chat = Chat.objects.create(
                participant1=other_user,
                participant2=request.user
            )
        
        serializer = self.get_serializer(chat)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get', 'post'], url_path='messages')
    def messages(self, request, pk=None):
        """Get messages for a chat or create a new message"""
        chat = self.get_object()
        
        # Check if user is participant
        if chat.participant1 != request.user and chat.participant2 != request.user:
            raise PermissionDenied("You are not authorized to access this chat.")
        
        if request.method == 'GET':
            # Get messages and mark unread messages as read
            messages = Message.objects.filter(chat=chat).order_by('created_at')
            
            # Store original is_read status before marking as read
            # This allows frontend to show unread messages visually
            message_ids_with_original_status = {}
            for msg in messages:
                if msg.sender != request.user:
                    message_ids_with_original_status[msg.id] = not msg.is_read
            
            # CRITICAL LOGIC: Mark messages as read if sender is not current user
            # Only mark messages that are from the other participant and not yet read
            messages_to_mark_read = messages.filter(
                sender__in=[chat.participant1, chat.participant2],
                is_read=False
            ).exclude(sender=request.user)
            
            # Update in bulk
            if messages_to_mark_read.exists():
                messages_to_mark_read.update(is_read=True)
                
                # Update chat's updated_at to reflect activity
                chat.updated_at = timezone.now()
                chat.save(update_fields=['updated_at'])
            
            # Re-fetch messages to get updated is_read status
            messages = Message.objects.filter(chat=chat).order_by('created_at')
            serializer = MessageSerializer(messages, many=True)
            response_data = serializer.data
            
            # Add original_is_unread field to messages that were unread before marking as read
            for msg_data in response_data:
                if msg_data['id'] in message_ids_with_original_status:
                    msg_data['was_unread_before_fetch'] = message_ids_with_original_status[msg_data['id']]
                else:
                    msg_data['was_unread_before_fetch'] = False
            
            return Response(response_data)
        
        elif request.method == 'POST':
            # Create new message
            content = request.data.get('content', '').strip()
            if not content:
                return Response(
                    {'error': 'Message content cannot be empty.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            message = Message.objects.create(
                chat=chat,
                sender=request.user,
                content=content,
                is_read=False  # New message is unread for the receiver
            )
            
            # Update chat's updated_at to reflect new message
            chat.updated_at = timezone.now()
            chat.save(update_fields=['updated_at'])
            
            serializer = MessageSerializer(message)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        """Get total count of unread messages for current user"""
        user = request.user
        
        # Get all chats where user is a participant
        user_chats = Chat.objects.filter(
            Q(participant1=user) | Q(participant2=user)
        )
        
        # Count unread messages where:
        # 1. Message is in one of user's chats
        # 2. Message sender is NOT the current user
        # 3. Message is not read
        unread_count = Message.objects.filter(
            chat__in=user_chats,
            is_read=False
        ).exclude(sender=user).count()
        
        return Response({'unread_count': unread_count}, status=status.HTTP_200_OK)