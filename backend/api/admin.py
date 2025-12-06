from django.contrib import admin
from .models import Chat, Profile, Tag, Post, Comment, Proposal, Job, Review

admin.site.register(Profile)
admin.site.register(Tag)
admin.site.register(Post)
admin.site.register(Chat)
admin.site.register(Comment)
admin.site.register(Proposal)
admin.site.register(Job)
admin.site.register(Review)