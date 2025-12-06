from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.validators import MaxValueValidator, MinValueValidator
from django.core.exceptions import ValidationError

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
    
    # Post image
    image = models.TextField(blank=True, null=True)
    
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

    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='proposals')
    requester = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_proposals')
    provider = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_proposals')
    
    notes = models.TextField(blank=True, null=True)
    timebank_hour = models.DecimalField(max_digits=4, decimal_places=2, default=0.0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='waiting')
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


class Chat(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender.username} -> {self.receiver.username}: {self.message[:50]}"


class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    
    text = models.TextField()
    like_count = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} commented on {self.post.title}: {self.text[:50]}"


class Job(models.Model):
    STATUS_CHOICES = [
        ('waiting', 'Waiting'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
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