"""
Google Sheets Service for data storage.
Handles CRUD operations for all data types.
"""

import os
import json
import gspread
from google.oauth2.service_account import Credentials
from datetime import datetime
from cachetools import TTLCache
import uuid

# Cache for sheets data (5 minutes TTL)
cache = TTLCache(maxsize=100, ttl=300)


class GoogleSheetsService:
    """Service for interacting with Google Sheets as a database."""
    
    SCOPES = [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
    ]
    
    # Sheet names
    SHEETS = {
        'users': 'Users',
        'books': 'Books',
        'authors': 'Authors',
        'publishers': 'Publishers',
        'reviews': 'Reviews',
        'favorites': 'Favorites',
        'search_history': 'SearchHistory',
        'reading_history': 'ReadingHistory'
    }
    
    # Column headers for each sheet
    HEADERS = {
        'users': ['id', 'firebase_uid', 'email', 'username', 'display_name', 'avatar_url', 'role', 'preferred_language', 'created_at', 'updated_at'],
        'books': ['id', 'title', 'title_thai', 'description', 'description_thai', 'cover_image_url', 'type', 'status', 'publication_year', 'total_chapters', 'total_volumes', 'author_id', 'publisher_id', 'average_rating', 'total_reviews', 'tags', 'genres', 'is_nsfw', 'created_at', 'updated_at'],
        'authors': ['id', 'name', 'name_thai', 'bio', 'bio_thai', 'image_url', 'created_at', 'updated_at'],
        'publishers': ['id', 'name', 'name_thai', 'description', 'description_thai', 'website_url', 'logo_url', 'created_at', 'updated_at'],
        'reviews': ['id', 'user_id', 'book_id', 'rating', 'content', 'is_spoiler', 'is_approved', 'helpful_count', 'created_at', 'updated_at'],
        'favorites': ['id', 'user_id', 'book_id', 'created_at'],
        'search_history': ['id', 'user_id', 'query', 'filters', 'results_count', 'created_at'],
        'reading_history': ['id', 'user_id', 'book_id', 'view_count', 'last_viewed_at', 'created_at']
    }
    
    # Field type definitions for parsing
    JSON_FIELDS = {'tags', 'genres', 'filters'}
    BOOLEAN_FIELDS = {'is_nsfw', 'is_spoiler', 'is_approved'}
    INTEGER_FIELDS = {'rating', 'helpful_count', 'view_count', 'publication_year', 
                      'total_chapters', 'total_volumes', 'total_reviews', 'results_count'}
    FLOAT_FIELDS = {'average_rating'}
    
    def __init__(self):
        self.client = None
        self.spreadsheet = None
        self._initialized = False
        self._mock_mode = False
    
    def _get_credentials(self):
        """Get Google credentials from environment or file."""
        credentials_json = os.getenv('GOOGLE_CREDENTIALS_JSON')
        credentials_file = os.getenv('GOOGLE_CREDENTIALS_FILE')
        
        if credentials_json:
            try:
                credentials_dict = json.loads(credentials_json)
                return Credentials.from_service_account_info(credentials_dict, scopes=self.SCOPES)
            except json.JSONDecodeError as e:
                print(f"Error parsing GOOGLE_CREDENTIALS_JSON: {e}")
                return None
        elif credentials_file and os.path.exists(credentials_file):
            return Credentials.from_service_account_file(credentials_file, scopes=self.SCOPES)
        else:
            return None
    
    def initialize(self):
        """Initialize connection to Google Sheets."""
        if self._initialized:
            return not self._mock_mode
            
        try:
            credentials = self._get_credentials()
            if credentials is None:
                print("Warning: No Google credentials found. Running in mock mode with empty data.")
                self._initialized = True
                self._mock_mode = True
                return False
            
            self.client = gspread.authorize(credentials)
            spreadsheet_id = os.getenv('GOOGLE_SPREADSHEET_ID')
            
            if spreadsheet_id:
                self.spreadsheet = self.client.open_by_key(spreadsheet_id)
            else:
                # Create new spreadsheet if ID not provided
                self.spreadsheet = self.client.create('MangaNovelRecommendation')
                print(f"Created new spreadsheet: {self.spreadsheet.id}")
            
            # Ensure all sheets exist
            self._ensure_sheets()
            self._initialized = True
            return True
        except Exception as e:
            print(f"Error initializing Google Sheets: {e}")
            self._initialized = True
            return False
    
    def _ensure_sheets(self):
        """Ensure all required sheets exist with headers."""
        if not self.spreadsheet:
            return
            
        existing_sheets = [ws.title for ws in self.spreadsheet.worksheets()]
        
        for sheet_key, sheet_name in self.SHEETS.items():
            if sheet_name not in existing_sheets:
                worksheet = self.spreadsheet.add_worksheet(title=sheet_name, rows=1000, cols=30)
                headers = self.HEADERS.get(sheet_key, [])
                if headers:
                    worksheet.update('A1', [headers])
    
    def _get_worksheet(self, sheet_key):
        """Get worksheet by key."""
        if not self.spreadsheet:
            return None
        sheet_name = self.SHEETS.get(sheet_key)
        if sheet_name:
            try:
                return self.spreadsheet.worksheet(sheet_name)
            except gspread.WorksheetNotFound:
                return None
        return None
    
    def _row_to_dict(self, headers, row):
        """Convert row data to dictionary."""
        result = {}
        for i, header in enumerate(headers):
            if i < len(row):
                value = row[i]
                # Parse JSON fields
                if header in self.JSON_FIELDS:
                    try:
                        result[header] = json.loads(value) if value else []
                    except (json.JSONDecodeError, TypeError):
                        result[header] = []
                # Parse boolean fields
                elif header in self.BOOLEAN_FIELDS:
                    result[header] = str(value).lower() == 'true'
                # Parse integer fields
                elif header in self.INTEGER_FIELDS:
                    try:
                        result[header] = int(value) if value else 0
                    except (ValueError, TypeError):
                        result[header] = 0
                # Parse float fields
                elif header in self.FLOAT_FIELDS:
                    try:
                        result[header] = float(value) if value else 0.0
                    except (ValueError, TypeError):
                        result[header] = 0.0
                else:
                    result[header] = value if value else None
            else:
                result[header] = None
        return result
    
    def _dict_to_row(self, headers, data):
        """Convert dictionary to row data."""
        row = []
        for header in headers:
            value = data.get(header, '')
            # Convert lists/dicts to JSON
            if isinstance(value, (list, dict)):
                value = json.dumps(value, ensure_ascii=False)
            # Convert booleans
            elif isinstance(value, bool):
                value = str(value).lower()
            # Handle None
            elif value is None:
                value = ''
            else:
                value = str(value)
            row.append(value)
        return row
    
    def get_all(self, sheet_key, use_cache=True):
        """Get all records from a sheet."""
        cache_key = f"all_{sheet_key}"
        if use_cache and cache_key in cache:
            return cache[cache_key]
        
        self.initialize()
        worksheet = self._get_worksheet(sheet_key)
        
        if not worksheet:
            return []
        
        try:
            all_values = worksheet.get_all_values()
            if len(all_values) < 2:
                return []
            
            headers = all_values[0]
            records = [self._row_to_dict(headers, row) for row in all_values[1:] if any(row)]
            
            if use_cache:
                cache[cache_key] = records
            return records
        except Exception as e:
            print(f"Error getting all from {sheet_key}: {e}")
            return []
    
    def get_by_id(self, sheet_key, record_id):
        """Get a record by ID."""
        records = self.get_all(sheet_key)
        for record in records:
            if record.get('id') == record_id:
                return record
        return None
    
    def find_by_field(self, sheet_key, field, value):
        """Find records by field value."""
        records = self.get_all(sheet_key)
        return [r for r in records if r.get(field) == value]
    
    def create(self, sheet_key, data):
        """Create a new record."""
        self.initialize()
        worksheet = self._get_worksheet(sheet_key)
        
        if not worksheet:
            return None
        
        headers = self.HEADERS.get(sheet_key, [])
        
        # Generate ID and timestamps
        data['id'] = data.get('id') or str(uuid.uuid4())
        data['created_at'] = data.get('created_at') or datetime.utcnow().isoformat()
        if 'updated_at' in headers:
            data['updated_at'] = datetime.utcnow().isoformat()
        
        row = self._dict_to_row(headers, data)
        
        try:
            worksheet.append_row(row)
            # Invalidate cache
            cache_key = f"all_{sheet_key}"
            if cache_key in cache:
                del cache[cache_key]
            return data
        except Exception as e:
            print(f"Error creating record in {sheet_key}: {e}")
            return None
    
    def update(self, sheet_key, record_id, data):
        """Update a record by ID."""
        self.initialize()
        worksheet = self._get_worksheet(sheet_key)
        
        if not worksheet:
            return None
        
        headers = self.HEADERS.get(sheet_key, [])
        
        try:
            all_values = worksheet.get_all_values()
            if len(all_values) < 2:
                return None
            
            header_row = all_values[0]
            id_col = header_row.index('id') + 1
            
            for row_num, row in enumerate(all_values[1:], start=2):
                if len(row) > 0 and row[0] == record_id:
                    # Merge existing data with updates
                    existing = self._row_to_dict(headers, row)
                    existing.update(data)
                    existing['updated_at'] = datetime.utcnow().isoformat()
                    
                    new_row = self._dict_to_row(headers, existing)
                    worksheet.update(f'A{row_num}', [new_row])
                    
                    # Invalidate cache
                    cache_key = f"all_{sheet_key}"
                    if cache_key in cache:
                        del cache[cache_key]
                    return existing
            
            return None
        except Exception as e:
            print(f"Error updating record in {sheet_key}: {e}")
            return None
    
    def delete(self, sheet_key, record_id):
        """Delete a record by ID."""
        self.initialize()
        worksheet = self._get_worksheet(sheet_key)
        
        if not worksheet:
            return False
        
        try:
            all_values = worksheet.get_all_values()
            if len(all_values) < 2:
                return False
            
            for row_num, row in enumerate(all_values[1:], start=2):
                if len(row) > 0 and row[0] == record_id:
                    worksheet.delete_rows(row_num)
                    
                    # Invalidate cache
                    cache_key = f"all_{sheet_key}"
                    if cache_key in cache:
                        del cache[cache_key]
                    return True
            
            return False
        except Exception as e:
            print(f"Error deleting record from {sheet_key}: {e}")
            return False
    
    def search(self, sheet_key, query, fields=None):
        """Search records by query in specified fields."""
        records = self.get_all(sheet_key)
        query_lower = query.lower()
        
        results = []
        for record in records:
            search_fields = fields or list(record.keys())
            for field in search_fields:
                value = record.get(field)
                if value and isinstance(value, str) and query_lower in value.lower():
                    results.append(record)
                    break
        
        return results
    
    def clear_cache(self, sheet_key=None):
        """Clear cache for a sheet or all sheets."""
        if sheet_key:
            cache_key = f"all_{sheet_key}"
            if cache_key in cache:
                del cache[cache_key]
        else:
            cache.clear()


# Singleton instance
sheets_service = GoogleSheetsService()
