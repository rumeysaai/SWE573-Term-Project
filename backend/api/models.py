from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar = models.URLField(max_length=500, blank=True, null=True, default="https://placehold.co/100x100/EBF8FF/3B82F6?text=User")
    time_balance = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    interested_tags = models.ManyToManyField('Tag', blank=True, related_name='interested_profiles')

    def __str__(self):
        return f"{self.user.username}'s Profile"


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)


class Tag(models.Model):
    tag_id = models.IntegerField(unique=True)
    name = models.CharField(max_length=100, unique=True)
    label = models.CharField(max_length=200, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    
    def save(self, *args, **kwargs):
        if not self.tag_id or self.tag_id == 0:
            last_tag = Tag.objects.order_by('-tag_id').first()
            if last_tag and last_tag.tag_id:
                self.tag_id = last_tag.tag_id + 1
            else:
                self.tag_id = 1
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class Post(models.Model):
    TYPE_CHOICES = [
        ('offer', 'Offer'), 
        ('need', 'Need'), 
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()
    
    # Relations
    posted_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    tags = models.ManyToManyField(Tag, blank=True)

    # Post Details
    post_type = models.CharField(max_length=5, choices=TYPE_CHOICES, default='offer')
    location = models.CharField(max_length=200)
    duration = models.CharField(max_length=100) 
    
    frequency = models.CharField(max_length=50, blank=True, null=True) 
    participant_count = models.IntegerField(default=1, blank=True, null=True)
    date = models.DateField(blank=True, null=True)
    
    # Geographic coordinates
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True) 
    location_display_name = models.CharField(max_length=255, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at'] 

    def __str__(self):
        return self.title


class Request(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='requests')
    requester = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_requests')
    provider = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_requests')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    message = models.TextField(blank=True, null=True)  
    
    proposed_date = models.DateField(blank=True, null=True) 
    proposed_time = models.TimeField(blank=True, null=True) 
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = [['post', 'requester']]  

    def __str__(self):
        return f"{self.requester.username} -> {self.post.title} ({self.status})"


class Chat(models.Model):
    request = models.ForeignKey(Request, on_delete=models.CASCADE, related_name='messages', blank=True, null=True)
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender.username} -> {self.receiver.username}: {self.message[:50]}"