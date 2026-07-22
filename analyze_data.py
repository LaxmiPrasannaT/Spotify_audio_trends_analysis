import pandas as pd
import numpy as np
import json
import os

def analyze_spotify_data():
    raw_path = r'C:\Users\thota\.gemini\antigravity\scratch\spotify_analysis\data\spotify_tracks.csv'
    if not os.path.exists(raw_path):
        print(f"Error: Raw data not found at {raw_path}")
        return

    # Load raw data
    df = pd.read_csv(raw_path)

    # 1. Feature Engineering
    # Convert duration_ms to minutes
    df['duration_min'] = round(df['duration_ms'] / 60000, 2)

    # Extract year from release_date (format is YYYY-MM-DD)
    df['year'] = pd.to_datetime(df['release_date']).dt.year

    # Group into decades
    df['decade'] = (df['year'] // 10 * 10).astype(str) + 's'

    # Save cleaned CSV
    cleaned_path = r'C:\Users\thota\.gemini\antigravity\scratch\spotify_analysis\data\spotify_tracks_cleaned.csv'
    df.to_csv(cleaned_path, index=False)
    print(f"Saved cleaned data to {cleaned_path}")

    # Ensure dashboard data directory exists
    dashboard_data_dir = r'C:\Users\thota\.gemini\antigravity\scratch\spotify_analysis\dashboard\data'
    os.makedirs(dashboard_data_dir, exist_ok=True)

    # 2. Pearson Correlation Matrix (Loudness vs Energy and other numeric metrics)
    numeric_cols = ['danceability', 'energy', 'loudness', 'speechiness', 'acousticness', 
                    'instrumentalness', 'liveness', 'valence', 'tempo', 'duration_min']
    correlation_matrix = df[numeric_cols].corr(method='pearson').round(3)
    
    # Structure correlation for heatmaps
    corr_json = {
        'columns': numeric_cols,
        'values': correlation_matrix.values.tolist()
    }
    
    with open(os.path.join(dashboard_data_dir, 'correlation.json'), 'w') as f:
        json.dump(corr_json, f, indent=2)

    # 3. Decade Trends (Happiness vs Energy Shift and others)
    decade_grouped = df.groupby('decade').agg({
        'valence': 'mean',
        'energy': 'mean',
        'danceability': 'mean',
        'loudness': 'mean',
        'duration_min': 'mean',
        'track_id': 'count'
    }).rename(columns={'track_id': 'track_count'}).round(3).reset_index()

    decade_grouped.to_json(os.path.join(dashboard_data_dir, 'decade_trends.json'), orient='records', indent=2)

    # 4. Yearly Trends (Duration shrinkage, Loudness war)
    yearly_grouped = df.groupby('year').agg({
        'duration_min': 'mean',
        'loudness': 'mean',
        'energy': 'mean',
        'valence': 'mean'
    }).round(3).reset_index()

    yearly_grouped.to_json(os.path.join(dashboard_data_dir, 'yearly_trends.json'), orient='records', indent=2)

    # 5. Genre Profiling (Pop, Hip-Hop, Classical, EDM, Rock, Jazz)
    # Normalize loudness between 0 and 1 for radar chart visual consistency
    min_loud = df['loudness'].min()
    max_loud = df['loudness'].max()
    df['normalized_loudness'] = (df['loudness'] - min_loud) / (max_loud - min_loud)

    genre_grouped = df.groupby('genre').agg({
        'danceability': 'mean',
        'energy': 'mean',
        'acousticness': 'mean',
        'valence': 'mean',
        'speechiness': 'mean',
        'normalized_loudness': 'mean',
        'duration_min': 'mean',
        'tempo': 'mean'
    }).round(3).reset_index()

    genre_grouped.to_json(os.path.join(dashboard_data_dir, 'genre_profiles.json'), orient='records', indent=2)

    # 6. Complete track subset for frontend filters & scatter plots
    # Keep columns light to minimize JSON size
    tracks_subset = df[[
        'track_id', 'track_name', 'artist_name', 'year', 'decade', 'genre',
        'danceability', 'energy', 'loudness', 'valence', 'duration_min', 'tempo'
    ]].to_dict(orient='records')

    with open(os.path.join(dashboard_data_dir, 'tracks_subset.json'), 'w') as f:
        json.dump(tracks_subset, f, indent=2)

    print("All analytical data exported to dashboard JSON successfully.")

if __name__ == '__main__':
    analyze_spotify_data()
