"""
Unit tests for models
"""
from django.test import TestCase
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from api.models import Profile, Tag, Post, Comment, Proposal, Review, Job, Chat, Message, ForumTopic, ForumComment
from decimal import Decimal


class ProfileModelTest(TestCase):
    """Test Profile model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_profile_auto_creation(self):
        """Test that profile is automatically created when user is created"""
        self.assertTrue(hasattr(self.user, 'profile'))
        self.assertEqual(self.user.profile.time_balance, Decimal('0.00'))
    
    def test_profile_default_avatar(self):
        """Test default avatar is set"""
        default_avatar = "https://placehold.co/100x100/EBF8FF/3B82F6?text=User"
        self.assertEqual(self.user.profile.avatar, default_avatar)
    
    def test_time_balance_validation(self):
        """Test time balance validators"""
        # Test minimum value (0.0)
        self.user.profile.time_balance = Decimal('0.00')
        self.user.profile.save()
        self.assertEqual(self.user.profile.time_balance, Decimal('0.00'))
        
        # Test maximum value (10.0)
        self.user.profile.time_balance = Decimal('10.00')
        self.user.profile.save()
        self.assertEqual(self.user.profile.time_balance, Decimal('10.00'))
        
        # Test negative value should fail
        self.user.profile.time_balance = Decimal('-1.00')
        with self.assertRaises(ValidationError):
            self.user.profile.full_clean()
        
        # Test value over 10 should fail
        self.user.profile.time_balance = Decimal('11.00')
        with self.assertRaises(ValidationError):
            self.user.profile.full_clean()
    
    def test_get_review_averages_no_reviews(self):
        """Test get_review_averages when user has no reviews"""
        averages = self.user.profile.get_review_averages()
        self.assertEqual(averages['friendliness'], 0)
        self.assertEqual(averages['time_management'], 0)
        self.assertEqual(averages['reliability'], 0)
        self.assertEqual(averages['communication'], 0)
        self.assertEqual(averages['work_quality'], 0)
        self.assertEqual(averages['overall'], 0)
        self.assertEqual(averages['total_reviews'], 0)
    
    def test_get_review_averages_with_reviews(self):
        """Test get_review_averages calculation"""
        # Create two reviewers
        reviewer1 = User.objects.create_user(username='reviewer1', password='pass123')
        reviewer2 = User.objects.create_user(username='reviewer2', password='pass123')
        
        # Create a post and proposal
        post = Post.objects.create(
            title='Test Post',
            description='Test Description',
            posted_by=self.user,
            post_type='offer',
            location='Test Location',
            duration='1 hour'
        )
        
        proposal = Proposal.objects.create(
            post=post,
            requester=reviewer1,
            provider=self.user,
            timebank_hour=Decimal('1.00'),
            status='completed'
        )
        
        # Create reviews from different reviewers
        Review.objects.create(
            proposal=proposal,
            reviewer=reviewer1,
            reviewed_user=self.user,
            friendliness=5,
            time_management=4,
            reliability=5,
            communication=4,
            work_quality=5
        )
        
        # Create second proposal for second reviewer
        proposal2 = Proposal.objects.create(
            post=post,
            requester=reviewer2,
            provider=self.user,
            timebank_hour=Decimal('1.00'),
            status='completed'
        )
        
        Review.objects.create(
            proposal=proposal2,
            reviewer=reviewer2,
            reviewed_user=self.user,
            friendliness=4,
            time_management=5,
            reliability=4,
            communication=5,
            work_quality=4
        )
        
        averages = self.user.profile.get_review_averages()
        self.assertEqual(averages['friendliness'], 4.5)
        self.assertEqual(averages['time_management'], 4.5)
        self.assertEqual(averages['reliability'], 4.5)
        self.assertEqual(averages['communication'], 4.5)
        self.assertEqual(averages['work_quality'], 4.5)
        self.assertEqual(averages['overall'], 4.5)
        self.assertEqual(averages['total_reviews'], 2)


class TagModelTest(TestCase):
    """Test Tag model"""
    
    def test_tag_creation(self):
        """Test tag creation"""
        tag = Tag.objects.create(
            name='Python',
            description='Python programming language',
            wikidata_id='Q28865'
        )
        self.assertEqual(tag.name, 'Python')
        self.assertEqual(tag.tag_id, 1)
    
    def test_tag_id_auto_increment(self):
        """Test tag_id auto increment"""
        tag1 = Tag.objects.create(name='Tag1')
        tag2 = Tag.objects.create(name='Tag2')
        
        self.assertEqual(tag1.tag_id, 1)
        self.assertEqual(tag2.tag_id, 2)
    
    def test_tag_unique_name(self):
        """Test tag name uniqueness"""
        Tag.objects.create(name='Unique Tag')
        with self.assertRaises(IntegrityError):
            Tag.objects.create(name='Unique Tag')
    
    def test_custom_tag(self):
        """Test custom tag creation"""
        tag = Tag.objects.create(
            name='Custom Tag',
            is_custom=True
        )
        self.assertTrue(tag.is_custom)


class PostModelTest(TestCase):
    """Test Post model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
    
    def test_post_creation_offer(self):
        """Test creating an offer post"""
        post = Post.objects.create(
            title='Test Offer',
            description='Test Description',
            posted_by=self.user,
            post_type='offer',
            location='Test Location',
            duration='1 hour'
        )
        self.assertEqual(post.post_type, 'offer')
        self.assertFalse(post.is_hidden)
    
    def test_post_creation_need(self):
        """Test creating a need post"""
        post = Post.objects.create(
            title='Test Need',
            description='Test Description',
            posted_by=self.user,
            post_type='need',
            location='Test Location',
            duration='1 hour'
        )
        self.assertEqual(post.post_type, 'need')
    
    def test_post_with_tags(self):
        """Test post with tags"""
        tag1 = Tag.objects.create(name='Tag1')
        tag2 = Tag.objects.create(name='Tag2')
        
        post = Post.objects.create(
            title='Test Post',
            description='Test Description',
            posted_by=self.user,
            post_type='offer',
            location='Test Location',
            duration='1 hour'
        )
        post.tags.add(tag1, tag2)
        
        self.assertEqual(post.tags.count(), 2)
    
    def test_post_with_coordinates(self):
        """Test post with geographic coordinates"""
        post = Post.objects.create(
            title='Test Post',
            description='Test Description',
            posted_by=self.user,
            post_type='offer',
            location='Test Location',
            duration='1 hour',
            latitude=41.0082,
            longitude=28.9784
        )
        self.assertEqual(post.latitude, 41.0082)
        self.assertEqual(post.longitude, 28.9784)


class ProposalModelTest(TestCase):
    """Test Proposal model"""
    
    def setUp(self):
        self.requester = User.objects.create_user(
            username='requester',
            password='pass123'
        )
        self.provider = User.objects.create_user(
            username='provider',
            password='pass123'
        )
        
        # Set initial balances
        self.requester.profile.time_balance = Decimal('5.00')
        self.requester.profile.save()
        self.provider.profile.time_balance = Decimal('5.00')
        self.provider.profile.save()
        
        self.post = Post.objects.create(
            title='Test Post',
            description='Test Description',
            posted_by=self.provider,
            post_type='offer',
            location='Test Location',
            duration='1 hour'
        )
    
    def test_proposal_creation(self):
        """Test proposal creation"""
        proposal = Proposal.objects.create(
            post=self.post,
            requester=self.requester,
            provider=self.provider,
            timebank_hour=Decimal('2.00'),
            status='waiting'
        )
        self.assertEqual(proposal.status, 'waiting')
        self.assertEqual(proposal.requester, self.requester)
        self.assertEqual(proposal.provider, self.provider)
    
    def test_proposal_acceptance_offer_balance_deduction(self):
        """Test balance deduction when accepting offer proposal"""
        proposal = Proposal.objects.create(
            post=self.post,
            requester=self.requester,
            provider=self.provider,
            timebank_hour=Decimal('2.00'),
            status='waiting'
        )
        
        # Accept proposal
        proposal.status = 'accepted'
        proposal.save()
        
        # Check balance deducted from requester
        self.requester.profile.refresh_from_db()
        self.assertEqual(self.requester.profile.time_balance, Decimal('3.00'))
        
        # Check job created
        job = Job.objects.filter(proposal=proposal).first()
        self.assertIsNotNone(job)
        self.assertEqual(job.status, 'waiting')
    
    def test_proposal_acceptance_need_balance_deduction(self):
        """Test balance deduction when accepting need proposal"""
        need_post = Post.objects.create(
            title='Need Post',
            description='Test Description',
            posted_by=self.provider,
            post_type='need',
            location='Test Location',
            duration='1 hour'
        )
        
        proposal = Proposal.objects.create(
            post=need_post,
            requester=self.requester,
            provider=self.provider,
            timebank_hour=Decimal('2.00'),
            status='waiting'
        )
        
        # Accept proposal
        proposal.status = 'accepted'
        proposal.save()
        
        # Check balance deducted from provider
        self.provider.profile.refresh_from_db()
        self.assertEqual(self.provider.profile.time_balance, Decimal('3.00'))
    
    def test_proposal_acceptance_insufficient_balance(self):
        """Test proposal acceptance fails with insufficient balance"""
        self.requester.profile.time_balance = Decimal('1.00')
        self.requester.profile.save()
        
        proposal = Proposal.objects.create(
            post=self.post,
            requester=self.requester,
            provider=self.provider,
            timebank_hour=Decimal('2.00'),
            status='waiting'
        )
        
        # Try to accept with insufficient balance
        proposal.status = 'accepted'
        with self.assertRaises(ValidationError):
            proposal.save()
    
    def test_proposal_cancellation_refund(self):
        """Test balance refund when cancelling accepted proposal"""
        proposal = Proposal.objects.create(
            post=self.post,
            requester=self.requester,
            provider=self.provider,
            timebank_hour=Decimal('2.00'),
            status='waiting'
        )
        
        # Accept proposal
        proposal.status = 'accepted'
        proposal.save()
        
        # Cancel proposal
        proposal.status = 'cancelled'
        proposal.save()
        
        # Check balance refunded to requester
        self.requester.profile.refresh_from_db()
        self.assertEqual(self.requester.profile.time_balance, Decimal('5.00'))
    
    def test_proposal_completion_balance_transfer(self):
        """Test balance transfer when completing proposal"""
        proposal = Proposal.objects.create(
            post=self.post,
            requester=self.requester,
            provider=self.provider,
            timebank_hour=Decimal('2.00'),
            status='waiting'
        )
        
        # Accept proposal
        proposal.status = 'accepted'
        proposal.save()
        
        # Complete proposal
        proposal.provider_approved = True
        proposal.requester_approved = True
        proposal.save()
        
        # Check balance transferred to provider
        self.provider.profile.refresh_from_db()
        self.assertEqual(self.provider.profile.time_balance, Decimal('7.00'))


class ReviewModelTest(TestCase):
    """Test Review model"""
    
    def setUp(self):
        self.reviewer = User.objects.create_user(
            username='reviewer',
            password='pass123'
        )
        self.reviewed_user = User.objects.create_user(
            username='reviewed',
            password='pass123'
        )
        
        post = Post.objects.create(
            title='Test Post',
            description='Test Description',
            posted_by=self.reviewed_user,
            post_type='offer',
            location='Test Location',
            duration='1 hour'
        )
        
        self.proposal = Proposal.objects.create(
            post=post,
            requester=self.reviewer,
            provider=self.reviewed_user,
            timebank_hour=Decimal('1.00'),
            status='completed'
        )
    
    def test_review_creation(self):
        """Test review creation"""
        review = Review.objects.create(
            proposal=self.proposal,
            reviewer=self.reviewer,
            reviewed_user=self.reviewed_user,
            friendliness=5,
            time_management=4,
            reliability=5,
            communication=4,
            work_quality=5
        )
        self.assertEqual(review.friendliness, 5)
        self.assertEqual(review.reviewer, self.reviewer)
        self.assertEqual(review.reviewed_user, self.reviewed_user)
    
    def test_review_rating_validation(self):
        """Test review rating validators"""
        # Test valid ratings (1-5)
        review = Review(
            proposal=self.proposal,
            reviewer=self.reviewer,
            reviewed_user=self.reviewed_user,
            friendliness=3,
            time_management=3,
            reliability=3,
            communication=3,
            work_quality=3
        )
        review.full_clean()  # Should not raise
        
        # Test invalid rating (0)
        review.friendliness = 0
        with self.assertRaises(ValidationError):
            review.full_clean()
        
        # Test invalid rating (6)
        review.friendliness = 6
        with self.assertRaises(ValidationError):
            review.full_clean()
    
    def test_review_unique_constraint(self):
        """Test that one review per proposal per reviewer"""
        Review.objects.create(
            proposal=self.proposal,
            reviewer=self.reviewer,
            reviewed_user=self.reviewed_user,
            friendliness=5,
            time_management=4,
            reliability=5,
            communication=4,
            work_quality=5
        )
        
        # Try to create another review for same proposal by same reviewer
        with self.assertRaises(IntegrityError):
            Review.objects.create(
                proposal=self.proposal,
                reviewer=self.reviewer,
                reviewed_user=self.reviewed_user,
                friendliness=4,
                time_management=4,
                reliability=4,
                communication=4,
                work_quality=4
            )


class ChatModelTest(TestCase):
    """Test Chat and Message models"""
    
    def setUp(self):
        self.user1 = User.objects.create_user(
            username='user1',
            password='pass123'
        )
        self.user2 = User.objects.create_user(
            username='user2',
            password='pass123'
        )
    
    def test_chat_creation(self):
        """Test chat creation"""
        chat = Chat.objects.create(
            participant1=self.user1,
            participant2=self.user2
        )
        self.assertEqual(chat.participant1, self.user1)
        self.assertEqual(chat.participant2, self.user2)
    
    def test_chat_unique_constraint(self):
        """Test that one chat per pair of users per post"""
        post = Post.objects.create(
            title='Test Post',
            description='Test Description',
            posted_by=self.user1,
            post_type='offer',
            location='Test Location',
            duration='1 hour'
        )
        
        # İlk chat
        Chat.objects.create(
            post=post,
            participant1=self.user1,
            participant2=self.user2
        )
        
        # İkinci chat (AYNI post, AYNI kişiler olmalı)
        with self.assertRaises(IntegrityError):
            Chat.objects.create(
                post=post,
                participant1=self.user1,
                participant2=self.user2
            )
    
    def test_message_creation(self):
        """Test message creation"""
        chat = Chat.objects.create(
            participant1=self.user1,
            participant2=self.user2
        )
        
        message = Message.objects.create(
            chat=chat,
            sender=self.user1,
            content='Hello!'
        )
        
        self.assertEqual(message.content, 'Hello!')
        self.assertFalse(message.is_read)
    
    def test_message_read_status(self):
        """Test message read status"""
        chat = Chat.objects.create(
            participant1=self.user1,
            participant2=self.user2
        )
        
        message = Message.objects.create(
            chat=chat,
            sender=self.user1,
            content='Hello!',
            is_read=False
        )
        
        message.is_read = True
        message.save()
        
        self.assertTrue(message.is_read)


class ForumModelTest(TestCase):
    """Test Forum models"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
    
    def test_forum_topic_creation(self):
        """Test forum topic creation"""
        topic = ForumTopic.objects.create(
            author=self.user,
            title='Test Topic',
            content='Test Content'
        )
        self.assertEqual(topic.title, 'Test Topic')
        self.assertFalse(topic.is_hidden)
    
    def test_forum_comment_creation(self):
        """Test forum comment creation"""
        topic = ForumTopic.objects.create(
            author=self.user,
            title='Test Topic',
            content='Test Content'
        )
        
        comment = ForumComment.objects.create(
            topic=topic,
            author=self.user,
            content='Test Comment'
        )
        
        self.assertEqual(comment.content, 'Test Comment')
        self.assertFalse(comment.is_hidden)
        self.assertEqual(comment.report_count, 0)

