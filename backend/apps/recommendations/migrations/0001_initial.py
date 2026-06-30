from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('users', '0004_remove_userprofile_interests_privacy_and_more'),
        ('products', '0002_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='GiftHistory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('recipient_stranger_name', models.CharField(blank=True, max_length=150)),
                ('budget', models.DecimalField(decimal_places=2, max_digits=12)),
                ('event_type', models.CharField(blank=True, max_length=50)),
                ('strategy', models.CharField(blank=True, max_length=50)),
                ('total_price', models.DecimalField(decimal_places=2, max_digits=12)),
                ('items', models.JSONField(default=list)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('giver', models.ForeignKey(on_delete=models.CASCADE, related_name='gift_histories_given', to='users.user')),
                ('recipient', models.ForeignKey(blank=True, null=True, on_delete=models.SET_NULL, related_name='gift_histories_received', to='users.user')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
