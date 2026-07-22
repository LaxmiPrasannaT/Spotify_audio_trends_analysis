import pandas as pd
import numpy as np
import os
import random

# Seed for reproducibility
np.random.seed(42)
random.seed(42)

# Parameters
n_tracks = 2000
genres = ['Pop', 'Hip-Hop', 'Classical', 'EDM', 'Rock', 'Jazz']

# Generate year from 1950 to 2026 with a distribution skewed towards recent decades
years = np.clip(np.random.normal(1995, 20, n_tracks).astype(int), 1950, 2026)

# Generate artist and track names based on genres
artist_templates = {
    'Pop': ['Aria Green', 'The Melody Crew', 'Lumina', 'Echo Smith', 'Solaris', 'Nove', 'Luna V', 'Vibe Society'],
    'Hip-Hop': ['Lil Beat', 'DJ Rhythm', 'MC Flow', 'Rhyme Syndicate', 'K-Low', 'G-Street', 'Yung Lyric'],
    'Classical': ['Ludwig Quartet', 'Vienna Philharmonic', 'Chopin Ensemble', 'Amadeus Strings', 'Clara Vane'],
    'EDM': ['Neon Pulse', 'Hyperdrive', 'Synthwave Collective', 'DJ Bassdrop', 'Circuit Breaker', 'Aero'],
    'Rock': ['The Iron Jacks', 'Stone Rebels', 'Crimson Tide', 'Riff Lords', 'Silver Bullet', 'The Fenders'],
    'Jazz': ['Miles Quartet', 'Blue Note Trio', 'The Velvet Sax', 'Ella & Friends', 'Duke\'s Rhythm']
}

track_adjectives = ['Midnight', 'Golden', 'Silent', 'Electric', 'Lonesome', 'Crimson', 'Vibrant', 'Deep', 'Lost', 'Sweet']
track_nouns = ['Dream', 'Heart', 'Beat', 'River', 'City', 'Shadow', 'Melody', 'Light', 'Echo', 'Journey']

data = []
for i in range(n_tracks):
    year = int(years[i])
    genre = random.choice(genres)
    artist = random.choice(artist_templates[genre])
    # Add a suffix to make artists more diverse
    if random.random() > 0.6:
        artist += f" {random.choice(['feat. Kid C', 'Trio', 'Orchestra', '& The Band', 'Remix'])}"
    
    track_name = f"{random.choice(track_adjectives)} {random.choice(track_nouns)}"
    
    # We want to model relationships:
    # 1. Loudness vs Energy (Pearson correlation ~ 0.7 - 0.8)
    energy_base = 0.5
    if genre == 'Classical':
        energy_base = 0.15
    elif genre == 'EDM':
        energy_base = 0.85
    elif genre in ['Rock', 'Hip-Hop', 'Pop']:
        energy_base = 0.7
    elif genre == 'Jazz':
        energy_base = 0.35
        
    # Loudness War: loudness increases over time (from -16dB in 1950s to -5dB in 2020s)
    loudness_year_effect = -16.0 + 11.0 * (year - 1950) / (2026 - 1950)
    genre_loudness_adjust = {
        'Classical': -15.0,
        'EDM': 2.0,
        'Rock': 1.0,
        'Pop': 1.0,
        'Hip-Hop': 0.0,
        'Jazz': -5.0
    }
    
    loudness_base = loudness_year_effect + genre_loudness_adjust[genre]
    noise = np.random.normal(0, 1)
    loudness = np.clip(loudness_base + noise * 2.0, -60.0, 0.0)
    
    # Energy is highly correlated with loudness.
    normalized_loudness = (loudness + 60.0) / 60.0 # 0 to 1
    energy = np.clip(0.3 * energy_base + 0.5 * normalized_loudness + np.random.normal(0, 0.1), 0.0, 1.0)
    
    # 2. Song Duration shrinking over time (peaked in 90s, drops in 2010s/2020s)
    if year < 1995:
        duration_base = 170000 + 70000 * ((year - 1950) / 45)
    else:
        duration_base = 240000 - 80000 * ((year - 1995) / 31)
        
    genre_duration_adjust = {
        'Classical': 120000,
        'Jazz': 60000,
        'EDM': 30000,
        'Hip-Hop': -20000,
        'Pop': -10000,
        'Rock': 15000
    }
    duration_ms = int(duration_base + genre_duration_adjust[genre] + np.random.normal(0, 20000))
    duration_ms = max(60000, duration_ms) # minimum 1 minute
    
    # 3. Happiness vs. Energy Shift (Valence vs Energy)
    # Valence decreases over time, while energy remains high.
    valence_year_effect = 0.65 - 0.20 * (year - 1950) / (2026 - 1950)
    genre_valence_adjust = {
        'Classical': -0.1,
        'Pop': 0.1,
        'Hip-Hop': 0.05,
        'EDM': 0.05,
        'Rock': -0.05,
        'Jazz': 0.0
    }
    valence = np.clip(valence_year_effect + genre_valence_adjust[genre] + np.random.normal(0, 0.12), 0.0, 1.0)
    
    # Danceability: slightly increased over the years
    danceability_year_effect = 0.50 + 0.12 * (year - 1950) / (2026 - 1950)
    genre_dance_adjust = {
        'Classical': -0.3,
        'Pop': 0.15,
        'Hip-Hop': 0.2,
        'EDM': 0.2,
        'Rock': 0.0,
        'Jazz': 0.05
    }
    danceability = np.clip(danceability_year_effect + genre_dance_adjust[genre] + np.random.normal(0, 0.1), 0.0, 1.0)
    
    month = random.randint(1, 12)
    day = random.randint(1, 28)
    release_date = f"{year}-{month:02d}-{day:02d}"
    
    speechiness = np.clip(np.random.beta(1.5, 5.0) if genre != 'Hip-Hop' else np.random.beta(3.0, 5.0), 0.0, 1.0)
    acousticness = np.clip(np.random.beta(1.0, 5.0) if genre != 'Classical' and genre != 'Jazz' else np.random.beta(5.0, 1.5), 0.0, 1.0)
    instrumentalness = np.clip(np.random.beta(0.1, 5.0) if genre != 'Classical' and genre != 'EDM' else np.random.beta(4.0, 1.0), 0.0, 1.0)
    liveness = np.clip(np.random.beta(1.5, 6.0), 0.0, 1.0)
    tempo = np.clip(np.random.normal(120, 20) if genre != 'Classical' else np.random.normal(90, 30), 50.0, 220.0)
    
    data.append({
        'track_id': f"track_{i:04d}",
        'track_name': track_name,
        'artist_name': artist,
        'release_date': release_date,
        'genre': genre,
        'danceability': round(danceability, 3),
        'energy': round(energy, 3),
        'loudness': round(loudness, 2),
        'speechiness': round(speechiness, 3),
        'acousticness': round(acousticness, 3),
        'instrumentalness': round(instrumentalness, 3),
        'liveness': round(liveness, 3),
        'valence': round(valence, 3),
        'tempo': round(tempo, 1),
        'duration_ms': duration_ms
    })

df = pd.DataFrame(data)
os.makedirs(os.path.dirname(r'C:\Users\thota\.gemini\antigravity\scratch\spotify_analysis\data\spotify_tracks.csv'), exist_ok=True)
df.to_csv(r'C:\Users\thota\.gemini\antigravity\scratch\spotify_analysis\data\spotify_tracks.csv', index=False)
print(f"Successfully generated {n_tracks} tracks and saved to CSV.")
