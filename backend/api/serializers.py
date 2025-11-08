from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile, Tag, Post

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']

# Sadece Avatarı almak için basit bir profil serializer'ı
class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['avatar', 'timebank_balance']

# Kullanıcı adı ve profilini birleştiren serializer
class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'profile']


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