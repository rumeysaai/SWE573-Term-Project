from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import Profile, Tag, Post, Comment, Proposal, Review

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']

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
        fields = ['id', 'username', 'email', 'profile', 'is_staff', 'is_superuser']
    
    def get_profile(self, obj):
        # Get and return profile data
        return {
            'time_balance': obj.profile.time_balance,
            'review_averages': obj.profile.get_review_averages(),
            'avatar': obj.profile.avatar,
            'bio': obj.profile.bio if hasattr(obj.profile, 'bio') else None,
            'phone': obj.profile.phone if hasattr(obj.profile, 'phone') else None,
            'location': obj.profile.location if hasattr(obj.profile, 'location') else None,
        }

# NEW: Serializer for registration
class RegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=True)
    email = serializers.EmailField(required=True)
    
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True, label="Password Confirmation")
    
    interested_tags = serializers.SlugRelatedField(
        many=True,
        queryset=Tag.objects.all(),
        required=False,
        write_only=True,
        slug_field='tag_id'
    )

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'interested_tags']

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
        interested_tags = validated_data.pop('interested_tags', [])
        
        # create_user method automatically hashes the password
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        
        # ❗ STARTING BONUS
        user.profile.time_balance = 3.0  # 3 hour bonus
        
        # Add interested_tags to profile
        if interested_tags:
            user.profile.interested_tags.set(interested_tags)
        
        user.profile.save()
        
        return user

# Main Post Serializer
class PostSerializer(serializers.ModelSerializer):
    # posted_by = UserSerializer(read_only=True) # This returns an object within an object
    
    # We create the 'postedBy' and 'avatar' fields that the frontend expects
    # by deriving them from the 'posted_by' (User) object.
    postedBy = serializers.CharField(source='posted_by.username', read_only=True)
    avatar = serializers.URLField(source='posted_by.profile.avatar', read_only=True)
    
    # 'tags' field: Takes ID list for write, returns name list for read
    # We will use PrimaryKeyRelatedField for write, SerializerMethodField for read
    tags = serializers.SerializerMethodField()
    
    # tags_ids field for write
    tags_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Tag.objects.all(),
        required=False,
        write_only=True,
        source='tags'
    )
    
    def get_tags(self, obj):
        """Return tags as name list in response"""
        return [tag.name for tag in obj.tags.all()]
    
    
    postedDate = serializers.DateTimeField(source='created_at', read_only=True)
    image = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    def create(self, validated_data):
        """Manually process tags in create operation"""
        
        tags_data = validated_data.pop('tags', [])
        post = Post.objects.create(**validated_data)
        if tags_data:
            post.tags.set(tags_data)
        return post
    
    def update(self, instance, validated_data):
        """Manually process tags in update operation"""
        
        tags_data = validated_data.pop('tags', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if tags_data is not None:
            instance.tags.set(tags_data)
        return instance


    class Meta:
        model = Post
        
        fields = [
            'id',
            'title',
            'tags',        
            'tags_ids',   
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
    post_id = serializers.IntegerField(source='post.id', read_only=True)
    post_title = serializers.CharField(source='post.title', read_only=True)
    post_type = serializers.CharField(source='post.post_type', read_only=True)
    requester_id = serializers.IntegerField(source='requester.id', read_only=True)
    requester_username = serializers.CharField(source='requester.username', read_only=True)
    provider_id = serializers.IntegerField(source='provider.id', read_only=True)
    provider_username = serializers.CharField(source='provider.username', read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def to_representation(self, instance):
        """Override to return 'completed' if associated Job is completed, otherwise return proposal status"""
        data = super().to_representation(instance)
        # Check if there's a Job associated with this proposal
        job = instance.jobs.first()  # Get the first (and typically only) job for this proposal
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
            'provider',
            'provider_id',
            'provider_username',
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

    class Meta:
        model = Review
        fields = [
            'id',
            'proposal',
            'proposal_id',
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
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'reviewer', 'reviewed_user', 'created_at', 'updated_at']