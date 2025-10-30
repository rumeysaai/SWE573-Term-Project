from django.urls import path
from .views import UserSignupView, UserProfileView

urlpatterns = [
    # sign-up-screen.tsx'ten gelen POST isteği için
    path('auth/signup/', UserSignupView.as_view(), name='user_signup'), 
    # user-profile.tsx'e veri sağlamak için
    path('profile/me/', UserProfileView.as_view(), name='user_profile'),
]