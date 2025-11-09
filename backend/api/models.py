from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar = models.URLField(max_length=500, blank=True, null=True, default="https://placehold.co/100x100/EBF8FF/3B82F6?text=User")
    time_balance = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)

    def __str__(self):
        return f"{self.user.username}'s Profile"

# ❗ ÖNEMLİ: Sinyal
# Yeni bir User (kullanıcı) oluşturulduğu an bu fonksiyon tetiklenir
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

# Tag (Etiket) modeli
class Tag(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

# Ana İlan (Post) modeli
class Post(models.Model):
    TYPE_CHOICES = [
        ('offer', 'Offer'), # Teklif
        ('need', 'Need'),   # İhtiyaç
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()
    
    # İlişkiler
    posted_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    tags = models.ManyToManyField(Tag, blank=True)

    # İlan Detayları
    post_type = models.CharField(max_length=5, choices=TYPE_CHOICES, default='offer')
    location = models.CharField(max_length=200)
    duration = models.CharField(max_length=100) # "3-4 saat", "Esnek" gibi
    
    # Otomatik Tarihler
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at'] # En yeniden eskiye sırala

    def __str__(self):
        return self.title