# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0033_recreate_chat_and_add_message'),
    ]

    operations = [
        migrations.AddField(
            model_name='tag',
            name='wikidata_id',
            field=models.CharField(blank=True, help_text='Wikidata Q identifier (e.g., Q42)', max_length=20, null=True, unique=True),
        ),
        migrations.AddField(
            model_name='tag',
            name='is_custom',
            field=models.BooleanField(default=False, help_text='True if user created this tag as free-text'),
        ),
        # First set default empty string for existing null descriptions
        migrations.RunSQL(
            "UPDATE api_tag SET description = '' WHERE description IS NULL;",
            reverse_sql=migrations.RunSQL.noop,
        ),
        # Then alter the field - since we already updated nulls, this should work
        migrations.AlterField(
            model_name='tag',
            name='description',
            field=models.TextField(blank=True),
        ),
    ]

