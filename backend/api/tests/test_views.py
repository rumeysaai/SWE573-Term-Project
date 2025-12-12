"""
Integration tests for API views
"""
from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from api.models import Profile, Tag, Post, Comment, Proposal, Review, Job, Chat, Message, ForumTopic, ForumComment
from decimal import Decimal
import json


class AuthenticationAPITest(TestCase):
    """Test authentication endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_register_success(self):
        """Test successful user registration"""
        url = reverse('register')
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'newpass123',
            'password2': 'newpass123'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('id', response.data)
        self.assertEqual(response.data['username'], 'newuser')
        
        # Check user was created
        self.assertTrue(User.objects.filter(username='newuser').exists())
        # Check profile was created
        user = User.objects.get(username='newuser')
        self.assertTrue(hasattr(user, 'profile'))
    
    def test_register_password_mismatch(self):
        """Test registration with password mismatch"""
        url = reverse('register')
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'newpass123',
            'password2': 'differentpass'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_register_duplicate_username(self):
        """Test registration with duplicate username"""
        url = reverse('register')
        data = {
            'username': 'testuser',
            'email': 'different@example.com',
            'password': 'newpass123',
            'password2': 'newpass123'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_login_success(self):
        """Test successful login"""
        url = reverse('login')
        data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        url = reverse('login')
        data = {
            'username': 'testuser',
            'password': 'wrongpass'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_logout(self):
        """Test logout"""
        self.client.force_authenticate(user=self.user)
        url = reverse('logout')
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_session_authenticated(self):
        """Test session endpoint for authenticated user"""
        self.client.force_authenticate(user=self.user)
        url = reverse('session')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')
    
    def test_session_unauthenticated(self):
        """Test session endpoint for unauthenticated user"""
        url = reverse('session')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class PostAPITest(TestCase):
    """Test Post API endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.tag = Tag.objects.create(name='Python')
    
    def test_create_post(self):
        """Test creating a post"""
        self.client.force_authenticate(user=self.user)
        url = reverse('post-list')
        data = {
            'title': 'Test Post',
            'description': 'Test Description',
            'post_type': 'offer',
            'location': 'Test Location',
            'duration': '1 hour',
            'tags': [self.tag.id]
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'Test Post')
        self.assertEqual(response.data['posted_by_id'], self.user.id)
    
    def test_list_posts(self):
        """Test listing posts"""
        Post.objects.create(
            title='Post 1',
            description='Description 1',
            posted_by=self.user,
            post_type='offer',
            location='Location 1',
            duration='1 hour'
        )
        
        url = reverse('post-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_get_post_detail(self):
        """Test getting post details"""
        post = Post.objects.create(
            title='Test Post',
            description='Test Description',
            posted_by=self.user,
            post_type='offer',
            location='Test Location',
            duration='1 hour'
        )
        
        url = reverse('post-detail', kwargs={'pk': post.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Test Post')
    
    def test_update_post_owner(self):
        """Test updating own post"""
        post = Post.objects.create(
            title='Test Post',
            description='Test Description',
            posted_by=self.user,
            post_type='offer',
            location='Test Location',
            duration='1 hour'
        )
        
        self.client.force_authenticate(user=self.user)
        url = reverse('post-detail', kwargs={'pk': post.id})
        data = {'title': 'Updated Post'}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Updated Post')
    
    def test_filter_posts_by_type(self):
        """Test filtering posts by type"""
        Post.objects.create(
            title='Offer Post',
            description='Description',
            posted_by=self.user,
            post_type='offer',
            location='Location',
            duration='1 hour'
        )
        Post.objects.create(
            title='Need Post',
            description='Description',
            posted_by=self.user,
            post_type='need',
            location='Location',
            duration='1 hour'
        )
        
        url = reverse('post-list') + '?post_type=offer'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['post_type'], 'offer')
    
    def test_search_posts(self):
        """Test searching posts"""
        Post.objects.create(
            title='Python Tutorial',
            description='Learn Python',
            posted_by=self.user,
            post_type='offer',
            location='Location',
            duration='1 hour'
        )
        Post.objects.create(
            title='JavaScript Guide',
            description='Learn JS',
            posted_by=self.user,
            post_type='offer',
            location='Location',
            duration='1 hour'
        )
        
        url = reverse('post-list') + '?search=Python'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertIn('Python', response.data[0]['title'])


class CommentAPITest(TestCase):
    """Test Comment API endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.post = Post.objects.create(
            title='Test Post',
            description='Test Description',
            posted_by=self.user,
            post_type='offer',
            location='Test Location',
            duration='1 hour'
        )
    
    def test_create_comment(self):
        """Test creating a comment"""
        self.client.force_authenticate(user=self.user)
        url = reverse('comment-list')
        data = {
            'post': self.post.id,
            'text': 'Test Comment'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['text'], 'Test Comment')
    
    def test_list_comments_for_post(self):
        """Test listing comments for a post"""
        Comment.objects.create(
            post=self.post,
            user=self.user,
            text='Comment 1'
        )
        
        url = reverse('comment-list') + f'?post_id={self.post.id}'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_delete_own_comment(self):
        """Test deleting own comment"""
        comment = Comment.objects.create(
            post=self.post,
            user=self.user,
            text='Test Comment'
        )
        
        self.client.force_authenticate(user=self.user)
        url = reverse('comment-detail', kwargs={'pk': comment.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Comment.objects.filter(id=comment.id).exists())


class ProposalAPITest(TestCase):
    """Test Proposal API endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.requester = User.objects.create_user(
            username='requester',
            password='pass123'
        )
        self.provider = User.objects.create_user(
            username='provider',
            password='pass123'
        )
        
        # Set balances
        self.requester.profile.time_balance = Decimal('5.00')
        self.requester.profile.save()
        
        self.post = Post.objects.create(
            title='Test Post',
            description='Test Description',
            posted_by=self.provider,
            post_type='offer',
            location='Test Location',
            duration='1 hour'
        )
    
    def test_create_proposal(self):
        """Test creating a proposal"""
        self.client.force_authenticate(user=self.requester)
        url = reverse('proposal-list')
        data = {
            'post': self.post.id,
            'timebank_hour': '2.00',
            'notes': 'Test proposal'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'waiting')
        self.assertEqual(response.data['requester'], self.requester.id)
        self.assertEqual(response.data['provider'], self.provider.id)
    
    def test_accept_proposal(self):
        """Test accepting a proposal"""
        proposal = Proposal.objects.create(
            post=self.post,
            requester=self.requester,
            provider=self.provider,
            timebank_hour=Decimal('2.00'),
            status='waiting'
        )
        
        self.client.force_authenticate(user=self.provider)
        url = reverse('proposal-detail', kwargs={'pk': proposal.id})
        data = {'status': 'accepted'}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check balance deducted
        self.requester.profile.refresh_from_db()
        self.assertEqual(self.requester.profile.time_balance, Decimal('3.00'))
        
        # Check job created
        self.assertTrue(Job.objects.filter(proposal=proposal).exists())
    
    def test_list_sent_proposals(self):
        """Test listing sent proposals"""
        Proposal.objects.create(
            post=self.post,
            requester=self.requester,
            provider=self.provider,
            timebank_hour=Decimal('1.00'),
            status='waiting'
        )
        
        self.client.force_authenticate(user=self.requester)
        url = reverse('proposal-list') + '?sent=true'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_list_received_proposals(self):
        """Test listing received proposals"""
        Proposal.objects.create(
            post=self.post,
            requester=self.requester,
            provider=self.provider,
            timebank_hour=Decimal('1.00'),
            status='waiting'
        )
        
        self.client.force_authenticate(user=self.provider)
        url = reverse('proposal-list') + '?received=true'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)


class ReviewAPITest(TestCase):
    """Test Review API endpoints"""
    
    def setUp(self):
        self.client = APIClient()
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
    
    def test_create_review(self):
        """Test creating a review"""
        self.client.force_authenticate(user=self.reviewer)
        url = reverse('review-list')
        data = {
            'proposal': self.proposal.id,
            'friendliness': 5,
            'time_management': 4,
            'reliability': 5,
            'communication': 4,
            'work_quality': 5,
            'comment': 'Great work!'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['reviewer'], self.reviewer.id)
        self.assertEqual(response.data['reviewed_user'], self.reviewed_user.id)
    
    def test_both_parties_can_review(self):
        """Test that both requester and provider can review each other"""
        # Requester reviews provider
        self.client.force_authenticate(user=self.reviewer)
        url = reverse('review-list')
        data = {
            'proposal': self.proposal.id,
            'friendliness': 5,
            'time_management': 4,
            'reliability': 5,
            'communication': 4,
            'work_quality': 5,
            'comment': 'Provider did great work!'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['reviewer'], self.reviewer.id)
        self.assertEqual(response.data['reviewed_user'], self.reviewed_user.id)
        
        # Provider reviews requester
        self.client.force_authenticate(user=self.reviewed_user)
        data = {
            'proposal': self.proposal.id,
            'friendliness': 4,
            'time_management': 5,
            'reliability': 4,
            'communication': 5,
            'work_quality': 4,
            'comment': 'Requester was excellent!'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['reviewer'], self.reviewed_user.id)
        self.assertEqual(response.data['reviewed_user'], self.reviewer.id)
        
        # Verify both reviews exist
        reviews = Review.objects.filter(proposal=self.proposal)
        self.assertEqual(reviews.count(), 2)


class ChatAPITest(TestCase):
    """Test Chat API endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.user1 = User.objects.create_user(
            username='user1',
            password='pass123'
        )
        self.user2 = User.objects.create_user(
            username='user2',
            password='pass123'
        )
    
    def test_create_chat(self):
        """Test creating a chat"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('chat-list')
        data = {'user_id': self.user2.id}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
    
    def test_get_existing_chat(self):
        """Test getting existing chat"""
        chat = Chat.objects.create(
            participant1=self.user1,
            participant2=self.user2
        )
        
        self.client.force_authenticate(user=self.user1)
        url = reverse('chat-list')
        data = {'user_id': self.user2.id}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], chat.id)
    
    def test_send_message(self):
        """Test sending a message"""
        chat = Chat.objects.create(
            participant1=self.user1,
            participant2=self.user2
        )
        
        self.client.force_authenticate(user=self.user1)
        url = reverse('chat-messages', kwargs={'pk': chat.id})
        data = {'content': 'Hello!'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['content'], 'Hello!')
    
    def test_get_messages(self):
        """Test getting messages"""
        chat = Chat.objects.create(
            participant1=self.user1,
            participant2=self.user2
        )
        
        Message.objects.create(
            chat=chat,
            sender=self.user1,
            content='Message 1'
        )
        Message.objects.create(
            chat=chat,
            sender=self.user2,
            content='Message 2'
        )
        
        self.client.force_authenticate(user=self.user1)
        url = reverse('chat-messages', kwargs={'pk': chat.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)


class ForumAPITest(TestCase):
    """Test Forum API endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
    
    def test_create_forum_topic(self):
        """Test creating a forum topic"""
        self.client.force_authenticate(user=self.user)
        url = reverse('forum-topic-list')
        data = {
            'title': 'Test Topic',
            'content': 'Test Content'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'Test Topic')
    
    def test_create_forum_comment(self):
        """Test creating a forum comment"""
        topic = ForumTopic.objects.create(
            author=self.user,
            title='Test Topic',
            content='Test Content'
        )
        
        self.client.force_authenticate(user=self.user)
        url = reverse('forum-comment-list')
        data = {
            'topic_id': topic.id,
            'content': 'Test Comment'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['content'], 'Test Comment')


class ProfileAPITest(TestCase):
    """Test Profile API endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_get_own_profile(self):
        """Test getting own profile"""
        self.client.force_authenticate(user=self.user)
        url = reverse('my-profile')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')
    
    def test_update_own_profile(self):
        """Test updating own profile"""
        self.client.force_authenticate(user=self.user)
        url = reverse('my-profile')
        data = {
            'bio': 'Test bio',
            'phone': '1234567890',
            'location': 'Test Location'
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.profile.refresh_from_db()
        self.assertEqual(self.user.profile.bio, 'Test bio')
    
    def test_get_user_profile(self):
        """Test getting another user's profile"""
        url = reverse('user-profile', kwargs={'username': self.user.username})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')

