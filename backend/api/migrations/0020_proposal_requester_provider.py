# Generated manually

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def populate_provider(apps, schema_editor):
    Proposal = apps.get_model('api', 'Proposal')
    Post = apps.get_model('api', 'Post')
    for proposal in Proposal.objects.all():
        post = Post.objects.get(pk=proposal.post_id)
        proposal.provider_id = post.posted_by_id
        proposal.save()


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0019_proposal'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Rename sender to requester
        migrations.RenameField(
            model_name='proposal',
            old_name='sender',
            new_name='requester',
        ),
        # Add provider field (nullable first, will be populated)
        migrations.AddField(
            model_name='proposal',
            name='provider',
            field=models.ForeignKey(
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='received_proposals',
                to=settings.AUTH_USER_MODEL
            ),
        ),
        # Data migration: populate provider from post.posted_by
        migrations.RunPython(
            code=populate_provider,
            reverse_code=migrations.RunPython.noop,
        ),
        # Make provider non-nullable
        migrations.AlterField(
            model_name='proposal',
            name='provider',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='received_proposals',
                to=settings.AUTH_USER_MODEL
            ),
        ),
    ]
