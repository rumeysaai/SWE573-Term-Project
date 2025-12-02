from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import Profile, Tag, Post

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']

# Simple profile serializer to get only avatar
class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['avatar', 'time_balance']

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
            'postedBy',   
            'avatar',     
            'postedDate', 
        ]