from django.contrib import admin
from .models import Chat, Profile, Request, Tag, Post

admin.site.register(Profile)
admin.site.register(Tag)
admin.site.register(Post)
admin.site.register(Request)
admin.site.register(Chat)