--  CineRate – Phase 3 Database Schema & Core Data

-- Drop existing tables if they exist to allow clean re-initialization
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS movies CASCADE;
DROP TABLE IF EXISTS users CASCADE;

--  1. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(120) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

--  2. Movies Table
CREATE TABLE movies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    synopsis TEXT NOT NULL DEFAULT '',
    director VARCHAR(120) NOT NULL DEFAULT 'Unknown',
    release_year INT NOT NULL CHECK (release_year >= 1888),
    poster_url TEXT NOT NULL DEFAULT ''
);

--  3. Reviews Table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    review_text TEXT DEFAULT '',
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Ensure a user can only review a movie once
    UNIQUE (user_id, movie_id)
);

-- Indexes for faster lookups on foreign keys
CREATE INDEX idx_reviews_movie ON reviews(movie_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);

--  Seed Data: 5 Users
INSERT INTO users (id, username, email) VALUES
    ('11111111-1111-1111-1111-111111111111', 'fahreza', 'fahreza@cinerate.io'),
    ('22222222-2222-2222-2222-222222222222', 'jarkon', 'jarkon@cinerate.io'),
    ('33333333-3333-3333-3333-333333333333', 'brogib', 'brogib@cinerate.io'),
    ('44444444-4444-4444-4444-444444444444', 'abed', 'abed@cinerate.io'),
    ('55555555-5555-5555-5555-555555555555', 'gibkon', 'gibkon@cinerate.io');

--  Seed Data: 12 Movies
INSERT INTO movies (id, title, synopsis, director, release_year, poster_url) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Spirited Away', 'During her family''s move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits.', 'Hayao Miyazaki', 2001, 'https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'The Godfather', 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant youngest son.', 'Francis Ford Coppola', 1972, 'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'The Shawshank Redemption', 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.', 'Frank Darabont', 1994, 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg'),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'The Dark Knight', 'When the menace known as the Joker wreaks havoc on Gotham, Batman must accept one of the greatest psychological tests of his ability to fight injustice.', 'Christopher Nolan', 2008, 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Inception', 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a CEO.', 'Christopher Nolan', 2010, 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg'),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Parasite', 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.', 'Bong Joon-ho', 2019, 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg'),
    ('1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a', 'Interstellar', 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity''s survival.', 'Christopher Nolan', 2014, 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg'),
    ('2b2b2b2b-2b2b-2b2b-2b2b-2b2b2b2b2b2b', 'Pulp Fiction', 'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.', 'Quentin Tarantino', 1994, 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg'),
    ('3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c', 'Whiplash', 'A promising young drummer enrolls at a cut-throat music conservatory where his dreams of greatness are mentored by an instructor who will stop at nothing to realize a student''s potential.', 'Damien Chazelle', 2014, 'https://image.tmdb.org/t/p/w500/7fn624j5lj3xTme2SgiLCeuedmO.jpg'),
    ('4d4d4d4d-4d4d-4d4d-4d4d-4d4d4d4d4d4d', 'The Matrix', 'A computer hacker learns about the true nature of his reality and his role in the war against its controllers.', 'The Wachowskis', 1999, 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg'),
    ('5e5e5e5e-5e5e-5e5e-5e5e-5e5e5e5e5e5e', 'Spider-Man: Into the Spider-Verse', 'Teen Miles Morales becomes Spider-Man of his reality, and must join with five spider-powered individuals from other dimensions to stop a threat for all realities.', 'Bob Persichetti', 2018, 'https://image.tmdb.org/t/p/w500/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg'),
    ('6f6f6f6f-6f6f-6f6f-6f6f-6f6f6f6f6f6f', 'Dune', 'Feature adaptation of Frank Herbert''s science fiction novel about the son of a noble family entrusted with the protection of the most valuable asset in the galaxy.', 'Denis Villeneuve', 2021, 'https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg');

--  Seed Data: Reviews (Ratings 1-5)
INSERT INTO reviews (user_id, movie_id, rating, review_text) VALUES
    ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5, 'An absolute masterpiece. Stunning visuals and story.'),
    ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5, 'Pure magic from start to finish.'),
    ('33333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 5, 'The definitive gangster film. Every scene is perfect.'),
    ('44444444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 4, 'A bit slow at times, but undeniably great.'),
    ('55555555-5555-5555-5555-555555555555', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 5, 'A timeless story of hope.'),
    ('11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 5, 'So incredibly moving. Must watch.'),
    ('22222222-2222-2222-2222-222222222222', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 5, 'Heath Ledger''s Joker is legendary.'),
    ('33333333-3333-3333-3333-333333333333', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 4, 'Mind-bending, complex, and rewarding.'),
    ('44444444-4444-4444-4444-444444444444', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 5, 'A biting social commentary wrapped in a thriller.'),
    ('55555555-5555-5555-5555-555555555555', '1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a', 5, 'Visually stunning with an emotional core.'),
    ('11111111-1111-1111-1111-111111111111', '2b2b2b2b-2b2b-2b2b-2b2b-2b2b2b2b2b2b', 4, 'Tarantino''s dialogue is unmatched.'),
    ('22222222-2222-2222-2222-222222222222', '3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c', 5, 'Incredibly intense performances.'),
    ('33333333-3333-3333-3333-333333333333', '4d4d4d4d-4d4d-4d4d-4d4d-4d4d4d4d4d4d', 5, 'Revolutionary sci-fi.'),
    ('44444444-4444-4444-4444-444444444444', '5e5e5e5e-5e5e-5e5e-5e5e-5e5e5e5e5e5e', 5, 'Best animated film in years.'),
    ('55555555-5555-5555-5555-555555555555', '6f6f6f6f-6f6f-6f6f-6f6f-6f6f6f6f6f6f', 4, 'Epic world-building.');
