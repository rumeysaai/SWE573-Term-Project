from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import Profile, Tag, Post, Comment, Proposal, Review, Chat, Message, ForumTopic, ForumComment, Job

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'tag_id', 'name', 'label', 'description', 'wikidata_id', 'is_custom']
        read_only_fields = ['id', 'tag_id']

class TagSearchSerializer(serializers.Serializer):
    """Serializer for tag search results"""
    id = serializers.IntegerField(required=False, allow_null=True)
    tag_id = serializers.IntegerField(required=False, allow_null=True)
    name = serializers.CharField()
    label = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    description = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    wikidata_id = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    is_custom = serializers.BooleanField(default=False)
    source = serializers.CharField(required=False)  # 'local' or 'wikidata'

# Simple profile serializer to get only avatar
class ProfileSerializer(serializers.ModelSerializer):
    review_averages = serializers.SerializerMethodField()
    
    def get_review_averages(self, obj):
        """Get review averages for this profile"""
        return obj.get_review_averages()
    
    class Meta:
        model = Profile
        fields = ['avatar', 'time_balance', 'review_averages']

class UserSerializer(serializers.ModelSerializer):
    # Show 'profile' field (with time_balance) together with user
    profile = serializers.SerializerMethodField()
    is_staff = serializers.BooleanField(read_only=True)
    is_superuser = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile', 'is_staff', 'is_superuser']
    
    def get_profile(self, obj):
        # Get and return profile data
        # Use prefetched interested_tags if available
        interested_tags = getattr(obj.profile, '_prefetched_objects_cache', {}).get('interested_tags', None)
        if interested_tags is None:
            interested_tags = obj.profile.interested_tags.all()
        else:
            interested_tags = list(interested_tags)
        
        # Lazy load review_averages - only calculate if explicitly requested
        # This is a major performance win as review calculation can be slow
        # DEFAULT: Don't calculate reviews unless explicitly requested
        review_averages = None
        request = self.context.get('request')
        if request and request.query_params.get('include_reviews') == 'true':
            try:
                review_averages = obj.profile.get_review_averages()
            except Exception:
                review_averages = None
        
        # Return tag details along with IDs to avoid frontend fetch
        # This eliminates the need for a separate /tags/ API call
        tag_details = []
        for tag in interested_tags:
            tag_details.append({
                'id': tag.id,
                'name': tag.name,
                'label': tag.name,  # Use name as label
                'wikidata_id': tag.wikidata_id,
                'description': tag.description,
                'is_custom': tag.is_custom
            })
        
        return {
            'time_balance': obj.profile.time_balance,
            'review_averages': review_averages,
            'avatar': obj.profile.avatar,
            'bio': obj.profile.bio if hasattr(obj.profile, 'bio') else None,
            'phone': obj.profile.phone if hasattr(obj.profile, 'phone') else None,
            'location': obj.profile.location if hasattr(obj.profile, 'location') else None,
            'interested_tags': [tag.id for tag in interested_tags],  # Return tag IDs for backward compatibility
            'interested_tags_details': tag_details,  # Return full tag details to avoid frontend fetch
        }

# NEW: Serializer for registration
class RegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=True)
    email = serializers.EmailField(required=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True, label="Password Confirmation")
    
    interested_tags = serializers.ListField(
        child=serializers.JSONField(),
        required=False,
        write_only=True,
        help_text="List of tags, each can be {'id': int} or {'name': str, 'wikidata_id': str (optional)}"
    )
    location = serializers.CharField(required=False, allow_blank=True, write_only=True)
    bio = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'password2', 'interested_tags', 'location', 'bio']

    def validate(self, attrs):
        
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
      
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "This email address is already in use."})
        
        if User.objects.filter(username=attrs['username']).exists():
            raise serializers.ValidationError({"username": "This username is already taken."})

        return attrs

    def create(self, validated_data):
        # Extract interested_tags from validated_data
        interested_tags_data = validated_data.pop('interested_tags', [])
        location = validated_data.pop('location', None)
        bio = validated_data.pop('bio', None)
        first_name = validated_data.pop('first_name', '')
        last_name = validated_data.pop('last_name', '')
        
        # create_user method automatically hashes the password
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=first_name,
            last_name=last_name
        )
        
        # ❗ STARTING BONUS
        user.profile.time_balance = 3.0  # 3 hour bonus
        
        # Set location and bio if provided
        if location:
            user.profile.location = location
        if bio:
            user.profile.bio = bio
        
        # Process interested_tags: can be list of IDs or list of tag objects with name/text
        tag_objects = []
        if interested_tags_data:
            for tag_data in interested_tags_data:
                if isinstance(tag_data, dict):
                    # If it's a dict with 'id', get existing tag
                    if 'id' in tag_data:
                        try:
                            tag = Tag.objects.get(id=tag_data['id'])
                            tag_objects.append(tag)
                        except Tag.DoesNotExist:
                            continue
                    # If it's a dict with 'name' or string, create new custom tag
                    elif 'name' in tag_data or isinstance(tag_data.get('value'), str):
                        tag_name = tag_data.get('name') or tag_data.get('value', '').strip()
                        if tag_name:
                            tag, created = Tag.objects.get_or_create(
                                name=tag_name,
                                defaults={
                                    'description': tag_data.get('description', ''),
                                    'wikidata_id': tag_data.get('wikidata_id'),
                                    'is_custom': True,
                                    'label': tag_data.get('label', tag_name)
                                }
                            )
                            tag_objects.append(tag)
                    # If it's just a string
                    elif 'value' in tag_data:
                        tag_name = str(tag_data['value']).strip()
                        if tag_name:
                            tag, created = Tag.objects.get_or_create(
                                name=tag_name,
                                defaults={'is_custom': True}
                            )
                            tag_objects.append(tag)
                # If it's just an integer (tag ID)
                elif isinstance(tag_data, int):
                    try:
                        tag = Tag.objects.get(id=tag_data)
                        tag_objects.append(tag)
                    except Tag.DoesNotExist:
                        continue
                # If it's a string (tag name)
                elif isinstance(tag_data, str):
                    tag_name = tag_data.strip()
                    if tag_name:
                        tag, created = Tag.objects.get_or_create(
                            name=tag_name,
                            defaults={'is_custom': True}
                        )
                        tag_objects.append(tag)
        
        # Add interested_tags to profile
        if tag_objects:
            user.profile.interested_tags.set(tag_objects)
        
        user.profile.save()
        
        return user

# Main Post Serializer
class PostSerializer(serializers.ModelSerializer):
    # posted_by = UserSerializer(read_only=True) # This returns an object within an object
    
    # We create the 'postedBy' and 'avatar' fields that the frontend expects
    # by deriving them from the 'posted_by' (User) object.
    postedBy = serializers.CharField(source='posted_by.username', read_only=True)
    posted_by_id = serializers.IntegerField(source='posted_by.id', read_only=True)
    avatar = serializers.URLField(source='posted_by.profile.avatar', read_only=True)
    
    # 'tags' field: Takes ID list or tag objects for write, returns name list for read
    # We will use SerializerMethodField for read
    tags = serializers.SerializerMethodField()
    
    # tags_data field for write - can accept IDs or tag objects with name/text
    tags_data = serializers.ListField(
        child=serializers.JSONField(),
        required=False,
        write_only=True,
        help_text="List of tags, each can be integer (ID) or {'id': int} or {'name': str, 'wikidata_id': str (optional)}"
    )
    
    def get_tags(self, obj):
        """Return tags as name list in response"""
        # Use prefetched tags if available
        tags = getattr(obj, '_prefetched_objects_cache', {}).get('tags', None)
        if tags is not None:
            return [tag.name for tag in tags]
        # If not prefetched, return empty list to avoid N+1 queries
        # Tags should always be prefetched in PostViewSet
        return []
    
    def _process_tags(self, tags_data):
        """Helper method to process tags from various formats"""
        tag_objects = []
        if not tags_data:
            return tag_objects
            
        for tag_item in tags_data:
            if isinstance(tag_item, dict):
                # If it's a dict with 'id', get existing tag
                if 'id' in tag_item:
                    try:
                        tag = Tag.objects.get(id=tag_item['id'])
                        tag_objects.append(tag)
                    except Tag.DoesNotExist:
                        continue
                # If it's a dict with 'name' or string, create new custom tag
                elif 'name' in tag_item or isinstance(tag_item.get('value'), str):
                    tag_name = tag_item.get('name') or tag_item.get('value', '').strip()
                    if tag_name:
                        tag, created = Tag.objects.get_or_create(
                            name=tag_name,
                            defaults={
                                'description': tag_item.get('description', ''),
                                'wikidata_id': tag_item.get('wikidata_id'),
                                'is_custom': True,
                                'label': tag_item.get('label', tag_name)
                            }
                        )
                        tag_objects.append(tag)
                # If it's just a string
                elif 'value' in tag_item:
                    tag_name = str(tag_item['value']).strip()
                    if tag_name:
                        tag, created = Tag.objects.get_or_create(
                            name=tag_name,
                            defaults={'is_custom': True}
                        )
                        tag_objects.append(tag)
            # If it's just an integer (tag ID)
            elif isinstance(tag_item, int):
                try:
                    tag = Tag.objects.get(id=tag_item)
                    tag_objects.append(tag)
                except Tag.DoesNotExist:
                    continue
            # If it's a string (tag name)
            elif isinstance(tag_item, str):
                tag_name = tag_item.strip()
                if tag_name:
                    tag, created = Tag.objects.get_or_create(
                        name=tag_name,
                        defaults={'is_custom': True}
                    )
                    tag_objects.append(tag)
        return tag_objects
    
    postedDate = serializers.DateTimeField(source='created_at', read_only=True)
    image = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    def create(self, validated_data):
        """Manually process tags in create operation"""
        tags_data = validated_data.pop('tags_data', [])
        post = Post.objects.create(**validated_data)
        tag_objects = self._process_tags(tags_data)
        if tag_objects:
            post.tags.set(tag_objects)
        return post
    
    def update(self, instance, validated_data):
        """Manually process tags in update operation"""
        tags_data = validated_data.pop('tags_data', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if tags_data is not None:
            tag_objects = self._process_tags(tags_data)
            instance.tags.set(tag_objects)
        return instance


    class Meta:
        model = Post
        
        fields = [
            'id',
            'title',
            'tags',        
            'tags_data',   
            'location',
            'post_type', 
            'description',
            'duration',
            'frequency',
            'participant_count',
            'date',
            'latitude',
            'longitude',
            'image',
            'postedBy',
            'posted_by_id',
            'avatar',
            'postedDate',
        ]


class CommentSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    avatar = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    like_count = serializers.IntegerField(read_only=True)

    def get_avatar(self, obj):
        """Get user's avatar from profile"""
        if hasattr(obj.user, 'profile') and obj.user.profile.avatar:
            return obj.user.profile.avatar
        return None

    class Meta:
        model = Comment
        fields = [
            'id',
            'post',
            'user_id',
            'username',
            'avatar',
            'text',
            'like_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'like_count']


class ProposalSerializer(serializers.ModelSerializer):
    post_id = serializers.IntegerField(source='post.id', read_only=True, allow_null=True)
    post_title = serializers.CharField(source='post.title', read_only=True, allow_null=True)
    post_type = serializers.CharField(source='post.post_type', read_only=True, allow_null=True)
    requester_id = serializers.IntegerField(source='requester.id', read_only=True)
    requester_username = serializers.CharField(source='requester.username', read_only=True)
    requester_avatar = serializers.CharField(source='requester.profile.avatar_url', read_only=True)
    provider_id = serializers.IntegerField(source='provider.id', read_only=True)
    provider_username = serializers.CharField(source='provider.username', read_only=True)
    provider_avatar = serializers.CharField(source='provider.profile.avatar_url', read_only=True)
    has_reviewed = serializers.SerializerMethodField()
    can_review = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    
    def get_has_reviewed(self, obj):
        """Check if current user has reviewed this proposal"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        
        # Use prefetched reviews if available
        reviews = getattr(obj, '_prefetched_objects_cache', {}).get('reviews', None)
        if reviews is not None:
            return any(r.reviewer_id == request.user.id for r in reviews)
        
        # If not prefetched, return False to avoid N+1 queries
        return False
    
    def get_can_review(self, obj):
        """Check if current user can review this proposal"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        
        user = request.user
        is_requester = user.id == obj.requester_id
        is_provider = user.id == obj.provider_id
        
        if not (is_requester or is_provider):
            return False
        
        # Check if user has approved OR cancelled the job
        # Only use prefetched jobs to avoid N+1 queries
        jobs = getattr(obj, '_prefetched_objects_cache', {}).get('jobs', None)
        if jobs is not None:
            job = jobs[0] if jobs else None
            user_cancelled_job = False
            if job and job.status == 'cancelled' and job.cancelled_by:
                if is_requester and job.cancelled_by.id == obj.requester_id:
                    user_cancelled_job = True
                elif is_provider and job.cancelled_by.id == obj.provider_id:
                    user_cancelled_job = True
            
            if is_requester:
                return obj.requester_approved or user_cancelled_job
            elif is_provider:
                return obj.provider_approved or user_cancelled_job
        
        # If jobs not prefetched, only check approval status
        if is_requester:
            return obj.requester_approved
        elif is_provider:
            return obj.provider_approved
        
        return False

    def to_representation(self, instance):
        """Override to return 'completed' if associated Job is completed, otherwise return proposal status"""
        data = super().to_representation(instance)
        # Check if there's a Job associated with this proposal
        # Only use prefetched jobs to avoid N+1 queries
        jobs = getattr(instance, '_prefetched_objects_cache', {}).get('jobs', None)
        if jobs is not None:
            job = jobs[0] if jobs else None
        else:
            # If not prefetched, don't query - just set defaults
            job = None
        if job:
            # Include job status and cancelled_by info in the response
            data['job_status'] = job.status
            data['job_cancellation_reason'] = job.cancellation_reason
            if job.cancelled_by:
                data['job_cancelled_by_id'] = job.cancelled_by.id
                data['job_cancelled_by_username'] = job.cancelled_by.username
            else:
                data['job_cancelled_by_id'] = None
                data['job_cancelled_by_username'] = None
            if job.status == 'completed':
                data['status'] = 'completed'
            elif job.status == 'cancelled':
                # Keep proposal status but include job_status for frontend filtering
                data['status'] = instance.status
            else:
                data['status'] = instance.status
        else:
            data['job_status'] = None
            data['job_cancellation_reason'] = None
            data['job_cancelled_by_id'] = None
            data['job_cancelled_by_username'] = None
            data['status'] = instance.status
        return data

    def validate(self, data):
        """Validate approval order based on post type"""
        instance = self.instance
        if instance is None:
            # Creating new proposal, no validation needed
            return data
        
        # Get the post type
        post_type = instance.post.post_type
        
        # Check if provider_approved or requester_approved is being updated
        provider_approved = data.get('provider_approved', instance.provider_approved)
        requester_approved = data.get('requester_approved', instance.requester_approved)
        
        # Only validate if status is 'accepted'
        if instance.status != 'accepted':
            return data
        
        # Check if trying to approve
        if 'provider_approved' in data or 'requester_approved' in data:
            # If post is 'offer': provider must approve first, then requester
            if post_type == 'offer':
                # Provider trying to approve - always allowed if not already approved
                if 'provider_approved' in data and data['provider_approved'] and not instance.provider_approved:
                    # Provider approval is valid
                    pass
                # Requester trying to approve - must wait for provider approval first
                elif 'requester_approved' in data and data['requester_approved'] and not instance.requester_approved:
                    if not instance.provider_approved:
                        raise serializers.ValidationError({
                            'requester_approved': 'Post owner (provider) must approve first for offer type posts.'
                        })
            
            # If post is 'need': requester must approve first, then provider
            elif post_type == 'need':
                # Requester trying to approve - always allowed if not already approved
                if 'requester_approved' in data and data['requester_approved'] and not instance.requester_approved:
                    # Requester approval is valid
                    pass
                # Provider trying to approve - must wait for requester approval first
                elif 'provider_approved' in data and data['provider_approved'] and not instance.provider_approved:
                    if not instance.requester_approved:
                        raise serializers.ValidationError({
                            'provider_approved': 'Requester must approve first for need type posts.'
                        })
        
        return data

    class Meta:
        model = Proposal
        fields = [
            'id',
            'post',
            'post_id',
            'post_title',
            'post_type',
            'requester',
            'requester_id',
            'requester_username',
            'requester_avatar',
            'provider',
            'provider_id',
            'provider_username',
            'provider_avatar',
            'has_reviewed',
            'can_review',
            'notes',
            'timebank_hour',
            'status',
            'proposed_date',
            'proposed_time',
            'proposed_location',
            'provider_approved',
            'requester_approved',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'requester', 'provider', 'created_at', 'updated_at']


class ReviewSerializer(serializers.ModelSerializer):
    reviewer_id = serializers.IntegerField(source='reviewer.id', read_only=True)
    reviewer_username = serializers.CharField(source='reviewer.username', read_only=True)
    reviewed_user_id = serializers.IntegerField(source='reviewed_user.id', read_only=True)
    reviewed_user_username = serializers.CharField(source='reviewed_user.username', read_only=True)
    proposal_id = serializers.IntegerField(source='proposal.id', read_only=True)
    post_title = serializers.CharField(source='proposal.post.title', read_only=True)
    post_id = serializers.IntegerField(source='proposal.post.id', read_only=True)
    post_type = serializers.CharField(source='proposal.post.post_type', read_only=True)
    role = serializers.SerializerMethodField()

    def get_role(self, obj):
        """Determine the role of reviewed_user in this proposal"""
        # If reviewed_user is the provider, role is "provider"
        if obj.reviewed_user.id == obj.proposal.provider.id:
            return "provider"
        # If reviewed_user is the requester, role is "requester"
        elif obj.reviewed_user.id == obj.proposal.requester.id:
            return "requester"
        return None

    class Meta:
        model = Review
        fields = [
            'id',
            'proposal',
            'proposal_id',
            'post_id',
            'post_title',
            'post_type',
            'role',
            'reviewer',
            'reviewer_id',
            'reviewer_username',
            'reviewed_user',
            'reviewed_user_id',
            'reviewed_user_username',
            'friendliness',
            'time_management',
            'reliability',
            'communication',
            'work_quality',
            'comment',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'reviewer', 'reviewed_user', 'created_at', 'updated_at']


class MessageSerializer(serializers.ModelSerializer):
    sender_id = serializers.IntegerField(source='sender.id', read_only=True)
    sender_username = serializers.CharField(source='sender.username', read_only=True)

    class Meta:
        model = Message
        fields = [
            'id',
            'chat',
            'sender',
            'sender_id',
            'sender_username',
            'content',
            'is_read',
            'created_at',
        ]
        read_only_fields = ['id', 'sender', 'created_at']


class ChatListSerializer(serializers.ModelSerializer):
    """Serializer for chat list with other user info and last message"""
    other_user = serializers.SerializerMethodField()
    other_user_avatar = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    post_id = serializers.SerializerMethodField()
    post_title = serializers.SerializerMethodField()
    post_type = serializers.SerializerMethodField()

    def get_other_user(self, obj):
        """Get the other participant's username (not the current user)"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        
        current_user = request.user
        if obj.participant1 == current_user:
            return obj.participant2.username
        else:
            return obj.participant1.username

    def get_other_user_avatar(self, obj):
        """Get the other participant's avatar"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        
        current_user = request.user
        other_user = obj.participant2 if obj.participant1 == current_user else obj.participant1
        if hasattr(other_user, 'profile') and other_user.profile.avatar:
            return other_user.profile.avatar
        return None

    def get_last_message(self, obj):
        """Get the last message in this chat"""
        last_msg = obj.messages.last()  # Get last message due to ordering
        if last_msg:
            return {
                'content': last_msg.content[:50] + '...' if len(last_msg.content) > 50 else last_msg.content,
                'created_at': last_msg.created_at,
                'sender_username': last_msg.sender.username,
            }
        return None

    def get_post_id(self, obj):
        """Get post ID if post exists"""
        return obj.post.id if obj.post else None

    def get_post_title(self, obj):
        """Get post title if post exists"""
        return obj.post.title if obj.post else None

    def get_post_type(self, obj):
        """Get post type if post exists"""
        return obj.post.post_type if obj.post else None

    def get_unread_count(self, obj):
        """Get count of unread messages for current user in this chat"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0
        
        current_user = request.user
        # Count unread messages where sender is NOT the current user
        unread_count = obj.messages.filter(
            is_read=False
        ).exclude(sender=current_user).count()
        return unread_count

    class Meta:
        model = Chat
        fields = [
            'id',
            'participant1',
            'participant2',
            'post',
            'post_id',
            'post_title',
            'post_type',
            'other_user',
            'other_user_avatar',
            'last_message',
            'unread_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'participant1', 'participant2', 'created_at', 'updated_at']


class ForumCommentSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    topic_id = serializers.IntegerField(write_only=True, required=True)
    
    class Meta:
        model = ForumComment
        fields = ['id', 'topic', 'topic_id', 'author', 'content', 'is_hidden', 'report_count', 'created_at']
        read_only_fields = ['id', 'topic', 'author', 'report_count', 'created_at']
    
    def get_author(self, obj):
        return {
            'id': obj.author.id,
            'username': obj.author.username,
        }
    
    def create(self, validated_data):
        topic_id = validated_data.pop('topic_id')
        user = self.context['request'].user
        
        try:
            from .models import ForumTopic
            topic = ForumTopic.objects.get(id=topic_id)
        except ForumTopic.DoesNotExist:
            raise serializers.ValidationError({'topic_id': 'Topic not found'})
        
        validated_data['topic'] = topic
        validated_data['author'] = user
        
        return super().create(validated_data)


class ForumTopicSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    semantic_tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text="List of tag IDs"
    )
    wikidata_ids = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False,
        help_text="List of Wikidata IDs to find or create tags"
    )
    comments = ForumCommentSerializer(many=True, read_only=True)
    comments_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ForumTopic
        fields = ['id', 'author', 'title', 'content', 'image', 'semantic_tags', 'tag_ids', 'wikidata_ids', 'is_hidden', 'created_at', 'updated_at', 'comments', 'comments_count']
        read_only_fields = ['id', 'author', 'semantic_tags', 'created_at', 'updated_at', 'comments']
    
    def get_author(self, obj):
        avatar = None
        if hasattr(obj.author, 'profile') and obj.author.profile.avatar:
            avatar = obj.author.profile.avatar
        return {
            'id': obj.author.id,
            'username': obj.author.username,
            'avatar': avatar,
        }
    
    def get_comments_count(self, obj):
        # Count only visible comments
        return obj.comments.filter(is_hidden=False).count()
    
    def create(self, validated_data):
        tag_ids = validated_data.pop('tag_ids', [])
        wikidata_ids = validated_data.pop('wikidata_ids', [])
        user = self.context['request'].user
        
        print(f"[ForumTopicSerializer] Creating topic with tag_ids: {tag_ids}, wikidata_ids: {wikidata_ids}")
        
        validated_data['author'] = user
        
        # Create topic first
        topic = super().create(validated_data)
        
        # Collect all tags to set
        all_tags = []
        
        # Add tags by ID
        if tag_ids and len(tag_ids) > 0:
            valid_tag_ids = [tid for tid in tag_ids if tid is not None and isinstance(tid, (int, str)) and str(tid).isdigit()]
            if valid_tag_ids:
                valid_tag_ids = [int(tid) for tid in valid_tag_ids]
                tags_by_id = Tag.objects.filter(id__in=valid_tag_ids)
                all_tags.extend(tags_by_id)
                print(f"[ForumTopicSerializer] Found {tags_by_id.count()} tags by ID: {list(tags_by_id.values_list('id', 'name'))}")
        
        # Add tags by wikidata_id (find existing or create them)
        if wikidata_ids and len(wikidata_ids) > 0:
            from .services.wikidata import get_wikidata_entity
            
            # Try to find existing tags with these wikidata_ids
            tags_by_wikidata = Tag.objects.filter(wikidata_id__in=wikidata_ids)
            found_wikidata_ids = set(tags_by_wikidata.values_list('wikidata_id', flat=True))
            all_tags.extend(tags_by_wikidata)
            
            # For wikidata_ids not found, create them from Wikidata
            missing_wikidata_ids = [wid for wid in wikidata_ids if wid not in found_wikidata_ids]
            if missing_wikidata_ids:
                print(f"[ForumTopicSerializer] Creating {len(missing_wikidata_ids)} tags from Wikidata: {missing_wikidata_ids}")
                for wikidata_id in missing_wikidata_ids:
                    try:
                        # Try to get entity details from Wikidata
                        entity_data = get_wikidata_entity(wikidata_id)
                        if entity_data:
                            # Create tag
                            tag = Tag.objects.create(
                                name=entity_data.get('label', wikidata_id),
                                label=entity_data.get('label', wikidata_id),
                                description=entity_data.get('description', ''),
                                wikidata_id=wikidata_id,
                                is_custom=False
                            )
                            all_tags.append(tag)
                            print(f"[ForumTopicSerializer] Created tag: {tag.name} (ID: {tag.id})")
                        else:
                            print(f"[ForumTopicSerializer] Could not fetch entity data for {wikidata_id}")
                    except Exception as e:
                        print(f"[ForumTopicSerializer] Error creating tag for {wikidata_id}: {e}")
        
        # Set all tags
        if all_tags:
            # Remove duplicates
            unique_tags = list(set(all_tags))
            topic.semantic_tags.set(unique_tags)
            print(f"[ForumTopicSerializer] Topic {topic.id} now has {topic.semantic_tags.count()} tags")
        
        return topic


# Admin Dashboard Serializers
class TransactionSerializer(serializers.ModelSerializer):
    """Serializer for Job transactions in admin dashboard"""
    sender_name = serializers.CharField(source='requester.username', read_only=True)
    receiver_name = serializers.CharField(source='provider.username', read_only=True)
    amount = serializers.DecimalField(source='timebank_hour', max_digits=4, decimal_places=2, read_only=True)
    date = serializers.SerializerMethodField()
    status = serializers.CharField(read_only=True)
    
    class Meta:
        model = Job
        fields = ['id', 'sender_name', 'receiver_name', 'amount', 'date', 'status']
    
    def get_date(self, obj):
        """Return formatted date with time"""
        if obj.updated_at:
            return obj.updated_at.strftime('%b %d, %Y %H:%M')
        elif obj.date:
            return obj.date.strftime('%b %d, %Y')
        return None


class AdminPostSerializer(serializers.ModelSerializer):
    """Serializer for posts in admin dashboard"""
    author_name = serializers.CharField(source='posted_by.username', read_only=True)
    status = serializers.SerializerMethodField()
    date = serializers.SerializerMethodField()
    report_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = ['id', 'title', 'author_name', 'status', 'date', 'report_count', 'is_hidden']
    
    def get_status(self, obj):
        """Return status based on is_hidden"""
        return 'Hidden' if obj.is_hidden else 'Active'
    
    def get_date(self, obj):
        """Return formatted creation date"""
        if obj.created_at:
            return obj.created_at.strftime('%b %d, %Y')
        return None
    
    def get_report_count(self, obj):
        """Return report count - 0 for now as report_count field doesn't exist"""
        return 0


class AdminCommentSerializer(serializers.ModelSerializer):
    """Serializer for post comments in admin dashboard"""
    author_name = serializers.CharField(source='user.username', read_only=True)
    post_title = serializers.CharField(source='post.title', read_only=True)
    date = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = ['id', 'text', 'author_name', 'post_title', 'status', 'date', 'report_count', 'is_hidden']
    
    def get_status(self, obj):
        """Return status based on is_hidden"""
        return 'Hidden' if obj.is_hidden else 'Active'
    
    def get_date(self, obj):
        """Return formatted creation date"""
        if obj.created_at:
            return obj.created_at.strftime('%b %d, %Y')
        return None


class AdminForumCommentSerializer(serializers.ModelSerializer):
    """Serializer for forum comments in admin dashboard"""
    author_name = serializers.CharField(source='author.username', read_only=True)
    topic_title = serializers.CharField(source='topic.title', read_only=True)
    date = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    
    class Meta:
        model = ForumComment
        fields = ['id', 'content', 'author_name', 'topic_title', 'status', 'date', 'report_count', 'is_hidden']
    
    def get_status(self, obj):
        """Return status based on is_hidden"""
        return 'Hidden' if obj.is_hidden else 'Active'
    
    def get_date(self, obj):
        """Return formatted creation date"""
        if obj.created_at:
            return obj.created_at.strftime('%b %d, %Y')
        return None


class AdminForumTopicSerializer(serializers.ModelSerializer):
    """Serializer for forum topics in admin dashboard"""
    author_name = serializers.CharField(source='author.username', read_only=True)
    status = serializers.SerializerMethodField()
    date = serializers.SerializerMethodField()
    report_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ForumTopic
        fields = ['id', 'title', 'author_name', 'status', 'date', 'report_count', 'is_hidden']
    
    def get_status(self, obj):
        """Return status based on is_hidden"""
        return 'Hidden' if obj.is_hidden else 'Active'
    
    def get_date(self, obj):
        """Return formatted creation date"""
        if obj.created_at:
            return obj.created_at.strftime('%b %d, %Y')
        return None
    
    def get_report_count(self, obj):
        """Return report count - 0 for now as report_count field doesn't exist"""
        return 0