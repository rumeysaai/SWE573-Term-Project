from django.contrib import admin
from .models import Chat, Message, Profile, Tag, Post, Comment, Proposal, Job, Review, ForumTopic, ForumComment

admin.site.register(Profile)
admin.site.register(Tag)
admin.site.register(Post)
admin.site.register(Chat)
admin.site.register(ForumTopic)
admin.site.register(ForumComment)
admin.site.register(Message)
admin.site.register(Comment)
admin.site.register(Proposal)
admin.site.register(Job)
admin.site.register(Review)