# Database Schema Documentation

## Entity Relationship Diagram

```
┌─────────────────┐
│   auth.users    │
│  (Supabase Auth)│
└────────┬────────┘
         │ 1
         │
         │ N
┌─────────────────────────────────────────────────────────────────┐
│                        profiles                                 │
├─────────────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                                 │
│ email (TEXT)                                                   │
│ full_name (TEXT)                                               │
│ avatar_url (TEXT)                                             │
│ created_at (TIMESTAMP)                                        │
│ updated_at (TIMESTAMP)                                        │
│ is_guest (BOOLEAN)                                             │
└─────────────────────────────────────────────────────────────────┘
         │ 1
         │
         │ N
         ├──────────────────────────────────────────────────────────┐
         │                                                          │
         │ N                                                        │ N
┌─────────────────────┐                                 ┌─────────────────────┐
│  reading_progress   │                                 │  reading_history    │
├─────────────────────┤                                 ├─────────────────────┤
│ id (UUID, PK)       │                                 │ id (UUID, PK)       │
│ user_id (UUID, FK)   │                                 │ user_id (UUID, FK)   │
│ passage_id (TEXT)    │                                 │ passage_id (TEXT)    │
│ current_question_idx│                                 │ score (DECIMAL)      │
│ answers (JSONB)      │                                 │ band_score (DECIMAL)  │
│ time_spent_seconds  │                                 │ time_spent_seconds  │
│ is_completed (BOOL)  │                                 │ completed_at (TIMESTAMP)
│ created_at (TIMESTAMP)                                │ question_breakdown (JSONB)
│ updated_at (TIMESTAMP)                                │
└─────────────────────┘                                 └─────────────────────┘
         │                                                          │
         │ N                                                        │ N
┌─────────────────────┐                                 ┌─────────────────────┐
│    highlights       │                                 │ ai_conversations     │
├─────────────────────┤                                 ├─────────────────────┤
│ id (UUID, PK)       │                                 │ id (UUID, PK)       │
│ user_id (UUID, FK)   │                                 │ user_id (UUID, FK)   │
│ passage_id (TEXT)    │                                 │ title (TEXT)         │
│ text (TEXT)          │                                 │ messages (JSONB)     │
│ start_index (INT)    │                                 │ created_at (TIMESTAMP)
│ end_index (INT)      │                                 │ updated_at (TIMESTAMP)
│ color (TEXT)         │                                 │
│ note (TEXT)          │                                 │
│ created_at (TIMESTAMP)                                │
└─────────────────────┘                                 └─────────────────────┘
         │                                                          │
         │ N                                                        │ N
┌─────────────────────┐                                 ┌─────────────────────┐
│    saved_quotes     │                                 │   daily_missions    │
├─────────────────────┤                                 ├─────────────────────┤
│ id (UUID, PK)       │                                 │ id (UUID, PK)       │
│ user_id (UUID, FK)   │                                 │ user_id (UUID, FK)   │
│ quote_id (TEXT)     │                                 │ date (DATE)         │
│ quote (TEXT)         │                                 │ missions (JSONB)     │
│ author (TEXT)        │                                 │ completed_missions (JSONB)
│ role (TEXT)          │                                 │ created_at (TIMESTAMP)
│ category (TEXT)      │                                 │ updated_at (TIMESTAMP)
│ reflection (TEXT)    │                                 │
│ saved_at (TIMESTAMP) │                                 │
└─────────────────────┘                                 └─────────────────────┘
         │                                                          │
         │ N                                                        │ N
┌─────────────────────┐                                 ┌─────────────────────┐
│    achievements     │                                 │       streaks        │
├─────────────────────┤                                 ├─────────────────────┤
│ id (UUID, PK)       │                                 │ id (UUID, PK)       │
│ user_id (UUID, FK)   │                                 │ user_id (UUID, FK)   │
│ achievement_id (TEXT)                                 │ current_streak (INT) │
│ title (TEXT)         │                                 │ longest_streak (INT) │
│ description (TEXT)   │                                 │ last_activity_date (DATE)
│ icon (TEXT)          │                                 │ created_at (TIMESTAMP)
│ unlocked_at (TIMESTAMP)                                │ updated_at (TIMESTAMP)
└─────────────────────┘                                 └─────────────────────┘
         │                                                          │
         │ N                                                        │ N
┌─────────────────────┐                                 ┌─────────────────────┐
│         xp          │                                 │  user_settings      │
├─────────────────────┤                                 ├─────────────────────┤
│ id (UUID, PK)       │                                 │ id (UUID, PK)       │
│ user_id (UUID, FK)   │                                 │ user_id (UUID, FK)   │
│ total_xp (INT)       │                                 │ theme (TEXT)         │
│ level (INT)          │                                 │ language (TEXT)      │
│ created_at (TIMESTAMP)                                │ notifications_enabled (BOOL)
│ updated_at (TIMESTAMP)                                │ daily_reminder_time (TIME)
└─────────────────────┘                                 │ auto_save_enabled (BOOL)
                                                          │ reading_font_size (INT)
                                                          │ created_at (TIMESTAMP)
                                                          │ updated_at (TIMESTAMP)
                                                          └─────────────────────┘
         │                                                          │
         │ N                                                        │ N
┌─────────────────────┐                                 ┌─────────────────────┐
│ study_statistics    │                                 │
├─────────────────────┤                                 │
│ id (UUID, PK)       │                                 │
│ user_id (UUID, FK)   │                                 │
│ total_passages_completed (INT)                          │
│ total_time_spent_seconds (INT)                          │
│ average_score (DECIMAL)                                 │
│ average_band_score (DECIMAL)                            │
│ total_questions_answered (INT)                          │
│ correct_answers (INT)                                  │
│ accuracy_rate (DECIMAL)                                 │
│ strongest_category (TEXT)                              │
│ weakest_category (TEXT)                                │
│ last_updated_at (TIMESTAMP)                             │
└─────────────────────┘                                 │
                                                          │
```

## Table Explanations

### profiles
Extends Supabase Auth user data with additional profile information.
- **Purpose**: Store user profile data
- **Relationships**: One-to-many with all user-specific tables
- **Key Fields**: 
  - `is_guest`: Identifies guest accounts vs authenticated users
  - `avatar_url`: User profile picture
  - `full_name`: Display name

### reading_progress
Tracks current reading progress for passages.
- **Purpose**: Save in-progress reading sessions
- **Relationships**: Many-to-one with profiles
- **Key Fields**:
  - `passage_id`: Identifier for the reading passage
  - `current_question_index`: Current question being answered
  - `answers`: User's answers stored as JSON
  - `is_completed`: Whether the passage is finished

### reading_history
Stores completed reading test results.
- **Purpose**: Historical record of completed passages
- **Relationships**: Many-to-one with profiles
- **Key Fields**:
  - `score`: Percentage score
  - `band_score`: IELTS band score estimate
  - `question_breakdown`: Detailed performance by question type

### highlights
User highlights within reading passages.
- **Purpose**: Allow users to highlight and annotate text
- **Relationships**: Many-to-one with profiles
- **Key Fields**:
  - `passage_id`: Which passage the highlight belongs to
  - `start_index`/`end_index`: Text position
  - `color`: Highlight color
  - `note`: User annotation

### ai_conversations
AI Coach conversation history.
- **Purpose**: Store chat conversations with AI
- **Relationships**: Many-to-one with profiles
- **Key Fields**:
  - `messages`: Conversation message history as JSON
  - `title`: User-defined conversation title

### saved_quotes
User's saved Study Wisdom quotes.
- **Purpose**: Favorite quotes for later reference
- **Relationships**: Many-to-one with profiles
- **Key Fields**:
  - `quote_id`: Unique identifier for the quote
  - `reflection`: IELTS study connection

### daily_missions
Daily study missions and completion status.
- **Purpose**: Track daily study goals
- **Relationships**: Many-to-one with profiles
- **Key Fields**:
  - `date`: Specific date for missions
  - `missions`: Available missions for the day
  - `completed_missions`: IDs of completed missions

### achievements
User achievements and badges.
- **Purpose**: Gamification and progress tracking
- **Relationships**: Many-to-one with profiles
- **Key Fields**:
  - `achievement_id`: Unique achievement identifier
  - `unlocked_at`: When achievement was earned

### streaks
User study streak tracking.
- **Purpose**: Encourage consistent daily practice
- **Relationships**: One-to-one with profiles
- **Key Fields**:
  - `current_streak`: Current consecutive days
  - `longest_streak`: Best streak achieved
  - `last_activity_date`: Last day user studied

### xp
User experience points and level.
- **Purpose**: Gamification and progress tracking
- **Relationships**: One-to-one with profiles
- **Key Fields**:
  - `total_xp`: Cumulative experience points
  - `level`: Current user level

### user_settings
User preferences and settings.
- **Purpose**: Personalization and app configuration
- **Relationships**: One-to-one with profiles
- **Key Fields**:
  - `theme`: Light/dark mode preference
  - `language`: Interface language
  - `notifications_enabled`: Push notification preference

### study_statistics
Aggregate study statistics.
- **Purpose**: Overall performance metrics
- **Relationships**: One-to-one with profiles
- **Key Fields**:
  - `total_passages_completed`: Lifetime count
  - `average_score`: Mean performance
  - `accuracy_rate`: Overall correctness percentage

## Security

All tables have Row Level Security (RLS) enabled with policies ensuring:
- Users can only read their own data
- Users can only insert their own data
- Users can only update their own data
- Users can only delete their own data

## Indexes

Performance indexes are created on:
- All `user_id` foreign key columns
- `passage_id` in reading-related tables
- `date` in daily_missions
- `completed_at` in reading_history
- `quote_id` in saved_quotes (unique constraint)
