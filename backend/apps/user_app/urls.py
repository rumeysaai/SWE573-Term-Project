from django.urls import path
from .views import UserSignupView, UserProfileView

urlpatterns = [
    
    path('auth/signup/', UserSignupView.as_view(), name='user_signup'), 
   
    path('profile/me/', UserProfileView.as_view(), name='user_profile'),
]