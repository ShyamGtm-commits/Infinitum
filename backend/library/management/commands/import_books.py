# library/management/commands/import_books.py
import json
import os
from django.core.management.base import BaseCommand
from library.models import Book


class Command(BaseCommand):
    help = 'Import books from JSON backup'

    def handle(self, *args, **options):
        json_file = 'books_only.json'

        if not os.path.exists(json_file):
            self.stdout.write(
                self.style.ERROR(
                    f'{json_file} not found. Run extract_books_fixed.py first.')
            )
            return

        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                books_data = json.load(f)

            count = 0
            for book_data in books_data:
                fields = book_data['fields']

                # Create or update book (this handles duplicates gracefully)
                book, created = Book.objects.update_or_create(
                    id=book_data['id'],
                    defaults={
                        'title': fields['title'],
                        'author': fields['author'],
                        'isbn': fields['isbn'],
                        'genre': fields['genre'],
                        'publication_year': fields['publication_year'],
                        'description': fields['description'],
                        'total_copies': fields['total_copies'],
                        'available_copies': fields['available_copies'],
                        'cover_image': fields['cover_image'],
                        'qr_code': fields['qr_code'],
                    }
                )

                count += 1
                if created:
                    self.stdout.write(
                        self.style.SUCCESS(f'Created: {book.title}')
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(f'Updated: {book.title}')
                    )

            self.stdout.write(
                self.style.SUCCESS(f'Successfully processed {count} books')
            )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error: {e}')
            )
