from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from library.models import UserProfile

class Command(BaseCommand):
    help = 'Create UserProfile for users that don\'t have one'

    def handle(self, *args, **options):
        users_without_profiles = User.objects.filter(userprofile__isnull=True)
        count = 0
        
        for user in users_without_profiles:
            UserProfile.objects.create(user=user, user_type='student')
            count += 1
            
        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {count} user profiles')
        )