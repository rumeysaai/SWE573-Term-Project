# users/serializers.py

from rest_framework import serializers
from .models import User, Category # Category'yi import et
from timebank_app.models import Rating # Rating'i timebank app'ten import et

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'name')

class UserSignupSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(style={'input_type': 'password'}, write_only=True)
    
    # Frontend'den gelen yetenek ve ilgi listesini almak için
    skills = serializers.ListField(child=serializers.CharField(), write_only=True, required=False)
    interests = serializers.ListField(child=serializers.CharField(), write_only=True, required=False)

    class Meta:
        model = User
        # signup-screen.tsx'ten gelen tüm form alanlarını içerir
        fields = ('username', 'email', 'password', 'password2', 'location', 'bio', 'skills', 'interests')
        extra_kwargs = {'password': {'write_only': True}}
        
    def create(self, validated_data):
        # İlişkisel verileri ayır
        skill_names = validated_data.pop('skills', [])
        interest_names = validated_data.pop('interests', [])
        validated_data.pop('password2')
        
        user = User.objects.create_user(
            email=validated_data.pop('email'),
            password=validated_data.pop('password'),
            **validated_data
        )
        
        # Many-to-Many ilişkilerini kaydet
        for name in skill_names:
            category, _ = Category.objects.get_or_create(name=name)
            user.skills.add(category)
            
        for name in interest_names:
            category, _ = Category.objects.get_or_create(name=name)
            user.interests.add(category)
            
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    # user-profile.tsx'e veri sağlamak için
    skills = CategorySerializer(many=True, read_only=True)
    interests = CategorySerializer(many=True, read_only=True)
    
    # Derecelendirme verilerini hesaplayacağız, serileştiricinin içinde değil
    average_ratings = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'location', 'bio', 'timebank_balance', 
            'is_anonymous_profile', 'skills', 'interests', 'average_ratings'
        )
        read_only_fields = ('timebank_balance', 'average_ratings')

    def get_average_ratings(self, obj):
        """FR-29: Kategorik ve genel puan ortalamalarını hesaplar."""
        ratings = Rating.objects.filter(provider=obj)
        if not ratings.exists():
            return None # Derecelendirme yoksa boş döner

        from django.db.models import Avg
        # Bu kısım daha karmaşık sorgularla optimize edilmelidir, basitleştirilmiş ortalama alımı:
        avg = ratings.aggregate(
            reliability=Avg('punctuality'),
            quality=Avg('quality'),
            time_management=Avg('communication'), # Time Management için Communication kullandık
            friendliness=Avg('friendliness') # Modellerde tanımlanacak
        )
        
        # user-profile.tsx'teki formatı yakalamak için
        return {
            'reliability': avg['reliability'] or 0.0,
            'quality': avg['quality'] or 0.0,
            'time_management': avg['time_management'] or 0.0,
            # 'friendliness' alanını Rating modelinde tanımlamadık, şimdilik sabit veya hesaplanmış varsayalım
            'friendliness': avg.get('friendliness', 5.0) or 5.0 
        }