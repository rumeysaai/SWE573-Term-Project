from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PostViewSet, TagViewSet, CommentViewSet, ProposalViewSet, ReviewViewSet
from . import views

router = DefaultRouter()
router.register(r'posts', PostViewSet, basename='post')
router.register(r'tags', TagViewSet, basename='tag')
router.register(r'comments', CommentViewSet, basename='comment')
router.register(r'proposals', ProposalViewSet, basename='proposal')
router.register(r'reviews', ReviewViewSet, basename='review')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('csrf/', views.GetCSRFToken.as_view(), name='csrf'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('session/', views.SessionView.as_view(), name='session'),
    path('users/me/', views.MyProfileView.as_view(), name='my-profile'),  # Must come before users/<str:username>/
    path('users/<str:username>/', views.UserProfileView.as_view(), name='user-profile'),
]