from django.db import models
from django.contrib.auth.models import AbstractUser, UserManager as BaseUserManager
from django.utils.text import slugify


# --- YENİ: Kategori Modeli (Yetenek ve İlgi Alanları için) ---
class Category(models.Model):
    """Sign-up ekranındaki Skills ve Interests listelerini tutar."""

    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=50, unique=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Kategori (Yetenek/İlgi)"
        verbose_name_plural = "Kategoriler (Yetenek/İlgi)"


# --- YENİ: Custom UserManager (Email ile Giriş için) ---
class CustomUserManager(BaseUserManager):
    """Django'nun UserManager'ını miras alır ve kullanıcı adı yerine e-posta kullanır."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("E-posta adresi zorunludur.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        # Eğer username alanı zorunlu olmasa da gerekiyorsa, burada bir değer atayabiliriz
        extra_fields.setdefault("username", email.split("@")[0])
        return self.create_user(email, password, **extra_fields)


# --- GÜNCEL User Modeli ---
class User(AbstractUser):
    # 1. TEMEL DEĞİŞİKLİK: email'i benzersiz ve zorunlu yap
    email = models.EmailField(
        "e-posta adresi",
        unique=True,
        error_messages={"unique": "Bu e-posta adresi zaten kullanımda."},
    )

    # 2. TEMEL DEĞİŞİKLİK: username alanını opsiyonel yap
    username = models.CharField(
        max_length=150, unique=False, null=True, blank=True, verbose_name="User Name"
    )

    # 3. TEMEL AYARLAR: Hangi alanların giriş ve yetkilendirmede kullanılacağını belirt
    USERNAME_FIELD = "email"  # <--- GİRİŞİ EMAIL İLE YAP
    REQUIRED_FIELDS = (
        []
    )  # <--- create_superuser() sırasında zorunlu tutulacak alan kalmadı (email ve şifre zaten zorunlu)
    objects = CustomUserManager()  # <--- Özel Manager'ı kullan

    # --- Ek Özellik Alanları ---
    phone_number = models.CharField(
        max_length=15, blank=True, null=True, verbose_name="Phone Number"
    )

    # FR-10, FR-11: TimeBank Balance
    timebank_balance = models.DecimalField(
        max_digits=5, decimal_places=2, default=3.00, verbose_name="TimeBank Balance"
    )

    is_admin = models.BooleanField(default=False, verbose_name="Admin")

    guidelines_acknowledged_at = models.DateTimeField(null=True, blank=True)

    is_anonymous_profile = models.BooleanField(
        default=False, verbose_name="Anonymous Profile"
    )

    location = models.CharField(
        max_length=255, blank=True, null=True, verbose_name="Location (City/District)"
    )

    warnings_received = models.IntegerField(default=0)

    # --- SIGN-UP EKRANI İÇİN İLİŞKİSEL ALANLAR ---
    # Skills I Can Offer (Briefcase/Leaf icon)
    skills = models.ManyToManyField(
        Category, related_name="skill_providers", blank=True, verbose_name="Yetenekler"
    )

    # Services I'm Looking For (Heart icon)
    interests = models.ManyToManyField(
        Category,
        related_name="interest_seekers",
        blank=True,
        verbose_name="İlgi Alanları",
    )

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        # Nesne temsilinde email adresi kullanılır
        return self.email
