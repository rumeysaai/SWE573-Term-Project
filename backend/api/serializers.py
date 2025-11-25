from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import Profile, Tag, Post

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']

# Sadece Avatarı almak için basit bir profil serializer'ı
class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['avatar', 'time_balance']

class UserSerializer(serializers.ModelSerializer):
    # 'profile' alanını (içindeki time_balance ile) kullanıcıyla birlikte göster
    profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'profile']
    
    def get_profile(self, obj):
        # Profil bakiyesini alıp döndür
        return {
            'time_balance': obj.profile.time_balance,
            'avatar': obj.profile.avatar
        }

# YENİ: Kayıt işlemi için serializer
class RegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=True)
    email = serializers.EmailField(required=True)
    
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True, label="Parola Tekrarı")
    
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
        # 1. Parolalar eşleşiyor mu?
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Parolalar eşleşmiyor."})
        
        # 2. Email adresi zaten kayıtlı mı?
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "Bu e-posta adresi zaten kullanılıyor."})
        
        # 3. Kullanıcı adı zaten alınmış mı?
        if User.objects.filter(username=attrs['username']).exists():
            raise serializers.ValidationError({"username": "Bu kullanıcı adı zaten alınmış."})

        return attrs

    def create(self, validated_data):
        # interested_tags'i validated_data'dan çıkar
        interested_tags = validated_data.pop('interested_tags', [])
        
        # create_user metodu parolayı otomatik olarak hash'ler (şifreler)
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        
        # ❗ BAŞLANGIÇ BONUSU
        # Sinyal, profili oluşturdu. Biz şimdi bonusu ekliyoruz.
        user.profile.time_balance = 5.0  # 5 saatlik bonus
        
        # interested_tags'i profile'a ekle
        if interested_tags:
            user.profile.interested_tags.set(interested_tags)
        
        user.profile.save()
        
        return user

# Ana İlan (Post) Serializer'ı
class PostSerializer(serializers.ModelSerializer):
    # posted_by = UserSerializer(read_only=True) # Bu, nesne içinde nesne döndürür
    
    # Frontend'in bekleiği 'postedBy' ve 'avatar' alanlarını
    # 'posted_by' (User) nesnesinden türeterek oluşturuyoruz.
    postedBy = serializers.CharField(source='posted_by.username', read_only=True)
    avatar = serializers.URLField(source='posted_by.profile.avatar', read_only=True)
    
    # 'tags' alanı: Write için ID listesi alır, Read için name listesi döner
    # PrimaryKeyRelatedField ile write, SerializerMethodField ile read yapacağız
    tags = serializers.SerializerMethodField()
    
    # Write için tags_ids alanı
    tags_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Tag.objects.all(),
        required=False,
        write_only=True,
        source='tags'
    )
    
    def get_tags(self, obj):
        """Response'da tags'i name listesi olarak döndür"""
        return [tag.name for tag in obj.tags.all()]
    
    # 'postedDate' alanını 'created_at' olarak yeniden adlandır
    postedDate = serializers.DateTimeField(source='created_at', read_only=True)
    
    def create(self, validated_data):
        """Create işleminde tags'i manuel olarak işle"""
        # tags_ids alanı source='tags' ile işaretlendiği için validated_data'da 'tags' olarak gelecek
        tags_data = validated_data.pop('tags', [])
        post = Post.objects.create(**validated_data)
        if tags_data:
            post.tags.set(tags_data)
        return post
    
    def update(self, instance, validated_data):
        """Update işleminde tags'i manuel olarak işle"""
        
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