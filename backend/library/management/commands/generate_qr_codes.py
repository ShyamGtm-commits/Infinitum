from django.core.management.base import BaseCommand
from library.models import Book

class Command(BaseCommand):
    help = 'Generate QR codes for all books that don\'t have them'

    def handle(self, *args, **options):
        books_without_qr = Book.objects.filter(qr_code__isnull=True)
        
        self.stdout.write(f'Generating QR codes for {books_without_qr.count()} books...')
        
        for book in books_without_qr:
            book.generate_qr_code()
            self.stdout.write(f'Generated QR code for: {book.title}')
        
        self.stdout.write(self.style.SUCCESS('QR code generation completed!'))