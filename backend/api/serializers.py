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
    # Django User modelinde 'username' zorunludur.
    # Frontend'den 'userName' olarak geliyor, biz 'username' olarak eşleştiriyoruz.
    username = serializers.CharField(required=True)
    email = serializers.EmailField(required=True)
    
    # Parolayı doğrulamak için
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True, label="Parola Tekrarı")

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2']

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
        # create_user metodu parolayı otomatik olarak hash'ler (şifreler)
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        
        # ❗ BAŞLANGIÇ BONUSU
        # Sinyal, profili oluşturdu. Biz şimdi bonusu ekliyoruz.
        user.profile.time_balance = 5.0  # 5 saatlik bonus
        user.profile.save()
        
        return user

# Ana İlan (Post) Serializer'ı
class PostSerializer(serializers.ModelSerializer):
    # posted_by = UserSerializer(read_only=True) # Bu, nesne içinde nesne döndürür
    
    # Frontend'in bekleiği 'postedBy' ve 'avatar' alanlarını
    # 'posted_by' (User) nesnesinden türeterek oluşturuyoruz.
    postedBy = serializers.CharField(source='posted_by.username', read_only=True)
    avatar = serializers.URLField(source='posted_by.profile.avatar', read_only=True)
    
    # 'tags' alanını ID listesi yerine 'name' listesi (["Gardening", "Music"]) olarak göster
    tags = serializers.StringRelatedField(many=True, read_only=True)
    
    # 'postedDate' alanını 'created_at' olarak yeniden adlandır
    postedDate = serializers.DateTimeField(source='created_at', read_only=True)


    class Meta:
        model = Post
        # 'fields' listesi, API'nin döndüreceği JSON alanlarıdır
        fields = [
            'id',
            'title',
            'tags',
            'location',
            'post_type', # Frontend 'type' bekliyor, bunu FE'de map'leyeceğiz
            'description',
            'duration',
            'postedBy',   # Türetilmiş alan
            'avatar',     # Türetilmiş alan
            'postedDate', # Yeniden adlandırılmış alan
        ]