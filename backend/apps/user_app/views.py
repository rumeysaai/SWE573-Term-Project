from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import UserSignupSerializer, UserProfileSerializer
from .models import User
from django.db import IntegrityError


class UserSignupView(generics.CreateAPIView):
    """
    Yeni kullanıcı kaydı için POST endpoint'i.
    """

    queryset = User.objects.all()
    serializer_class = UserSignupSerializer
    permission_classes = (permissions.AllowAny,)  # Giriş yapmaya gerek yok

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            self.perform_create(serializer)
            # FR-19: Email doğrulama sonrası TimeBank bakiyesi otomatik atanır (Model'de varsayılan 3.00)
            return Response(
                {
                    "message": "Account created successfully. Please check your email for verification."
                },
                status=status.HTTP_201_CREATED,
            )
        except IntegrityError:
            return Response(
                {"error": "Bu e-posta adresi zaten kayıtlı."},
                status=status.HTTP_400_BAD_REQUEST,
            )


# Profil Ekranı API'si (Sadece okuma ve kendi profilini düzenleme)
class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Giriş yapmış kullanıcının kendi profilini görüntülemesi ve düzenlemesi.
    """

    serializer_class = UserProfileSerializer
    permission_classes = (
        permissions.IsAuthenticated,
    )  # Sadece giriş yapanlar erişebilir

    def get_object(self):
        # Giriş yapmış kullanıcının nesnesini döndürür
        return self.request.user

    def update(self, request, *args, **kwargs):
        # FR-6: Anonimlik ayarını güncelleyebilir.
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)
