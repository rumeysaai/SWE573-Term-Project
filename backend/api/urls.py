from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PostViewSet, TagViewSet
from . import views

router = DefaultRouter()
router.register(r'posts', PostViewSet, basename='post')
router.register(r'tags', TagViewSet, basename='tag')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('csrf/', views.GetCSRFToken.as_view(), name='csrf'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('session/', views.SessionView.as_view(), name='session'),
]