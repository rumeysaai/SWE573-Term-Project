from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.validators import MaxValueValidator, MinValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar = models.TextField(blank=True, null=True, default="https://placehold.co/100x100/EBF8FF/3B82F6?text=User")
    time_balance = models.DecimalField(
        max_digits=4, 
        decimal_places=2, 
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(10.0)]
    )
    bio = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    location = models.CharField(max_length=200, blank=True, null=True)
    interested_tags = models.ManyToManyField('Tag', blank=True, related_name='interested_profiles')
    
    @property
    def avatar_url(self):
        """Return avatar URL - already stored as full URL in TextField"""
        return self.avatar if self.avatar else "https://placehold.co/100x100/EBF8FF/3B82F6?text=User"

    def get_review_averages(self):
        """Calculate average ratings from all reviews received by this user - optimized"""
        from django.db.models import Avg, Count
        # Use aggregate directly without exists() check - more efficient
        averages = Review.objects.filter(reviewed_user=self.user).aggregate(
            avg_friendliness=Avg('friendliness'),
            avg_time_management=Avg('time_management'),
            avg_reliability=Avg('reliability'),
            avg_communication=Avg('communication'),
            avg_work_quality=Avg('work_quality'),
            total_count=Count('id')
        )
        
        total_reviews = averages['total_count'] or 0
        
        if total_reviews == 0:
            return {
                'friendliness': 0,
                'time_management': 0,
                'reliability': 0,
                'communication': 0,
                'work_quality': 0,
                'overall': 0,
                'total_reviews': 0,
            }
        
        overall = (
            (averages['avg_friendliness'] or 0) +
            (averages['avg_time_management'] or 0) +
            (averages['avg_reliability'] or 0) +
            (averages['avg_communication'] or 0) +
            (averages['avg_work_quality'] or 0)
        ) / 5
        
        return {
            'friendliness': round(averages['avg_friendliness'] or 0, 2),
            'time_management': round(averages['avg_time_management'] or 0, 2),
            'reliability': round(averages['avg_reliability'] or 0, 2),
            'communication': round(averages['avg_communication'] or 0, 2),
            'work_quality': round(averages['avg_work_quality'] or 0, 2),
            'overall': round(overall, 2),
            'total_reviews': total_reviews,
        }

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
    description = models.TextField(blank=True)
    wikidata_id = models.CharField(max_length=20, blank=True, null=True, unique=True, help_text="Wikidata Q identifier (e.g., Q42)")
    is_custom = models.BooleanField(default=False, help_text="True if user created this tag as free-text")
    
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


class ForumTopic(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='forum_topics')
    title = models.CharField(max_length=200)
    content = models.TextField()
    image = models.TextField(blank=True, null=True, help_text="Base64 encoded image or image URL")
    semantic_tags = models.ManyToManyField(Tag, blank=True, related_name='forum_topics')
    is_hidden = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} by {self.author.username}"


class ForumComment(models.Model):
    topic = models.ForeignKey(ForumTopic, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='forum_comments')
    content = models.TextField()
    is_hidden = models.BooleanField(default=False)
    report_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.author.username} on {self.topic.title}"

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
    
    # Post image
    image = models.TextField(blank=True, null=True)
    
    # Moderation
    is_hidden = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at'] 

    def __str__(self):
        return self.title


class Proposal(models.Model):
    STATUS_CHOICES = [
        ('waiting', 'Waiting'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='proposals', db_index=True)
    requester = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_proposals', db_index=True)
    provider = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_proposals', db_index=True)
    
    notes = models.TextField(blank=True, null=True)
    timebank_hour = models.DecimalField(max_digits=4, decimal_places=2, default=0.0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='waiting', db_index=True)
    proposed_date = models.DateField(blank=True, null=True)
    proposed_time = models.TimeField(blank=True, null=True)
    proposed_location = models.CharField(max_length=255, blank=True, null=True)
    
    # Approval fields
    provider_approved = models.BooleanField(default=False)
    requester_approved = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['requester', 'status']),
            models.Index(fields=['provider', 'status']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['requester', 'provider']),
        ]

    def save(self, *args, **kwargs):
        """Handle proposal status changes and related operations"""
        # Track if this is a new proposal being accepted
        is_being_accepted = False
        was_accepted = False
        was_cancelled = False
        
        if self.pk:
            try:
                old_instance = Proposal.objects.get(pk=self.pk)
                was_accepted = old_instance.status == 'accepted'
                was_cancelled = old_instance.status == 'cancelled'
                
                # Check if status is changing to accepted
                if old_instance.status != 'accepted' and self.status == 'accepted':
                    is_being_accepted = True
            except Proposal.DoesNotExist:
                pass
        elif self.status == 'accepted':
            is_being_accepted = True
        
        # Handle accepted status - create Job and deduct balance
        if is_being_accepted:
            # Check if Job already exists for this proposal
            existing_job = self.jobs.filter(status='waiting').first()
            if not existing_job:
                # Create Job with waiting status only if it doesn't exist
                Job.objects.create(
                    post=self.post,
                    proposal=self,
                    requester=self.requester,
                    provider=self.provider,
                    timebank_hour=self.timebank_hour,
                    status='waiting',
                    date=self.proposed_date
                )
            
            # Check balance and deduct based on post type
            if self.post.post_type == 'offer':
                # Offer: requester pays (balance deducted from requester)
                requester_profile = self.requester.profile
                if requester_profile.time_balance < self.timebank_hour:
                    raise ValidationError(
                        f"Insufficient balance. Required: {self.timebank_hour} hours, "
                        f"Available: {requester_profile.time_balance} hours."
                    )
                requester_profile.time_balance -= self.timebank_hour
                requester_profile.save()
            elif self.post.post_type == 'need':
                # Need: provider pays (balance deducted from provider/post owner)
                provider_profile = self.provider.profile
                if provider_profile.time_balance < self.timebank_hour:
                    raise ValidationError(
                        f"Insufficient balance. Required: {self.timebank_hour} hours, "
                        f"Available: {provider_profile.time_balance} hours."
                    )
                provider_profile.time_balance -= self.timebank_hour
                provider_profile.save()
        
        # Handle cancelled status (if was accepted before)
        if self.status == 'cancelled' and was_accepted and not was_cancelled:
            # Refund balance based on post type
            if self.post.post_type == 'offer':
                # Offer: refund to requester
                requester_profile = self.requester.profile
                requester_profile.time_balance += self.timebank_hour
                requester_profile.save()
            elif self.post.post_type == 'need':
                # Need: refund to provider
                provider_profile = self.provider.profile
                provider_profile.time_balance += self.timebank_hour
                provider_profile.save()
            
            # Update related Job status to cancelled
            # Note: cancelled_by will be set in the view where we have access to request.user
            for job in self.jobs.all():
                if job.status == 'waiting':
                    job.status = 'cancelled'
                    job.save()
        
        # Handle completed status - update Job and add balance
        if self.status == 'accepted' and self.provider_approved and self.requester_approved:
            self.status = 'completed'
            # Update Job status to completed
            for job in self.jobs.all():
                if job.status == 'waiting':
                    job.status = 'completed'
                    job.save()
                    
                    # Add balance based on post type
                    if self.post.post_type == 'offer':
                        # Offer: provider receives (balance added to provider/post owner)
                        provider_profile = self.provider.profile
                        provider_profile.time_balance += self.timebank_hour
                        provider_profile.save()
                    elif self.post.post_type == 'need':
                        # Need: requester receives (balance added to requester)
                        requester_profile = self.requester.profile
                        requester_profile.time_balance += self.timebank_hour
                        requester_profile.save()
        
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.requester.username} -> {self.post.title} ({self.status})"




class Job(models.Model):
    STATUS_CHOICES = [
        ('waiting', 'Waiting'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    CANCELLATION_REASON_CHOICES = [
        ('not_showed_up', 'Not Showed Up'),
        ('other', 'Other'),
    ]

    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='jobs')
    proposal = models.ForeignKey(Proposal, on_delete=models.CASCADE, related_name='jobs')
    requester = models.ForeignKey(User, on_delete=models.CASCADE, related_name='requested_jobs')
    provider = models.ForeignKey(User, on_delete=models.CASCADE, related_name='provided_jobs')
    
    timebank_hour = models.DecimalField(max_digits=4, decimal_places=2, default=0.0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='waiting')
    date = models.DateField(blank=True, null=True)
    
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='updated_jobs')
    cancelled_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='cancelled_jobs')
    cancellation_reason = models.CharField(max_length=20, choices=CANCELLATION_REASON_CHOICES, blank=True, null=True)

    class Meta:
        ordering = ['-updated_at']

    def save(self, *args, **kwargs):
        """Automatically set requester and provider from proposal if not set"""
        if self.proposal and not self.requester_id:
            self.requester = self.proposal.requester
        if self.proposal and not self.provider_id:
            self.provider = self.proposal.provider
        if self.proposal and not self.timebank_hour:
            self.timebank_hour = self.proposal.timebank_hour
        if self.proposal and not self.date:
            self.date = self.proposal.proposed_date
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Job #{self.id} - {self.post.title} ({self.status})"

class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    
    text = models.TextField()
    like_count = models.IntegerField(default=0)
    is_hidden = models.BooleanField(default=False)
    report_count = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} commented on {self.post.title}: {self.text[:50]}"


class Review(models.Model):
    """Review model for rating users after completed proposals"""
    proposal = models.ForeignKey(Proposal, on_delete=models.CASCADE, related_name='reviews')
    reviewer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='given_reviews')
    reviewed_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_reviews')
    
    # Rating criteria (1-5 scale)
    friendliness = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Rating from 1 to 5"
    )
    time_management = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Rating from 1 to 5"
    )
    reliability = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Rating from 1 to 5"
    )
    communication = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Rating from 1 to 5"
    )
    work_quality = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Rating from 1 to 5"
    )
    
    comment = models.TextField(blank=True, null=True, help_text="Optional comment about the reviewed user")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['proposal', 'reviewer']  # One review per proposal per reviewer

    def __str__(self):
        return f"{self.reviewer.username} reviewed {self.reviewed_user.username} for proposal {self.proposal.id}"


class Chat(models.Model):
    """1-on-1 Chat model between two users"""
    participant1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chats_as_p1')
    participant2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chats_as_p2')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='chats', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        unique_together = ['participant1', 'participant2', 'post']  # One chat per pair of users per post

    def __str__(self):
        return f"Chat between {self.participant1.username} and {self.participant2.username} for post {self.post.id if self.post else 'N/A'}"


class Message(models.Model):
    """Message model for Chat"""
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']  # Oldest first for display

    def __str__(self):
        return f"Message from {self.sender.username} in chat {self.chat.id}"