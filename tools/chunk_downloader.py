#!/usr/bin/env python3
"""
Chunk Generator - Simple CLI tool for pre-mission satellite chunk downloads

Replaces complex chunk-generator.js with simple pre-mission preparation tool

Features:
- Calculate 50x50m grid for specified radius around center point
- Download single optimal zoom level (20) from Google Maps Static API
- Generate metadata.json with proper GPS bounds mapping
- Align chunks with existing coordinate system reference points

Usage:
    python chunk_generator.py --center 43.071,-89.409 --radius 1000 --output camp_randall
"""

import argparse
import json
import math
import os
import sys
from pathlib import Path


import requests
from dotenv import load_dotenv
load_dotenv()
# Configuration
# CHUNK_SIZE = 50       # meters -- deprecated
ZOOM_LEVEL = 20      # Zoom level which will be used to render in MDRS
TILE_SIZE = 512

API_KEY = os.environ.get("REACT_APP_GOOGLE_MAP_API")

def gps_to_Mercator(lat : float, lon : float, zoom_level : int) -> tuple[float, float]:

    """
    Converts a GPS coorrdinate to the Google Maps flat pixel plane i.e WebMercator system

    Use this formula for mercator projection:
    pixelX = ((longitude + 180) / 360) * 256 * 2 level

    pixelY = (0.5 - log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * pi)) * 256 * 2 level
    """

    scale = 256 * (2 ** zoom_level)
    x = scale * (lon + 180) / 360 
    sinLatitude = math.sin(math.radians(lat))
    y = scale * (0.5 - math.log((1+sinLatitude)/(1-sinLatitude)) / (4*math.pi))

    return x,y

def Mercator_to_gps(x : float, y : float, zoom_level : int) -> tuple[float, float]:
    """
    Converts Google Maps flat pixel plane back to GPS coordinate
    """

    scale = 256 * (2 ** zoom_level)
    lon = (360*x/scale) - 180
    y_scaled_reverse = 0.5 - (y / scale) # = math.log(1+sinLat/1-sinLat)/4pi
    exp_y = math.exp(y_scaled_reverse*4*math.pi) # = 1+sinLat/1-sinLat
    lat = math.degrees(math.asin((exp_y - 1)/(exp_y+1))) # solve math

    return lat, lon


def download_chunk(centerLat: float, centerLng: float, filename: str, output_dir: Path) -> None:
    """
    Utility for downloading chunks - it downloads one chunk at a given center lat and long
    We are going to be taking tile sizes of 512 x 512 pixels for good resolution
    """
    url = (
        "https://maps.googleapis.com/maps/api/staticmap"
        f"?center={centerLat},{centerLng}"
        f"&zoom={ZOOM_LEVEL}"
        f"&size={TILE_SIZE}x{TILE_SIZE}"
        f"&maptype=satellite"
        f"&format=jpg"
        f"&key={API_KEY}"
    )

    response = requests.get(url, timeout=30)
    response.raise_for_status()

    (output_dir / filename).write_bytes(response.content)


def generate_chunks(center_lat: float, center_lng: float, radius_meters: int, output_name: str) -> None:
    print(f"🗺️  Generating chunks for {output_name}")

    # Scale
    ground_resolution = (math.cos(center_lat * math.pi/180) * 2 * math.pi * 6378137) / (256*(2**ZOOM_LEVEL)) # Distance represented by a single pixel
    tile_width = TILE_SIZE * ground_resolution # distance in meters across the tile
    radius_pixels = int(radius_meters / ground_resolution) # metres / metres/pxl = radius in pixels of the entire

    print(f"Center: {center_lat}, {center_lng}") # The global center
    print(f"Map Scale: {ground_resolution:.4f} meters/px")
    print(f"Tile covers exactly: {tile_width:.1f}x{tile_width:.1f} meters")

    output_dir = Path("..") / "frontend" / "public" / "chunks"
    output_dir.mkdir(parents=True, exist_ok=True)

    center_px_x, center_px_y = gps_to_Mercator(center_lat, center_lng, ZOOM_LEVEL) # Mercator proj of origin

    metadata = {
        "chunkSize": f"{TILE_SIZE}x{TILE_SIZE} pixels",
        "pixelsPerMeter": 1/ground_resolution,
        "tilePhysicalMeters": tile_width,
        "referencePoint": {
            "gps":   [center_lat, center_lng], # The center of the entire map
        },
        "chunks": {},
    } # Define the schema for the metadata

    # From center we have to cover the radius
    grid_steps = range(-radius_pixels, radius_pixels + TILE_SIZE, TILE_SIZE) # Can use for both x and y as radius 2D
    total_chunks = len(grid_steps) * len(grid_steps) # Cuz 2D
    print(f"Total chunks to download: {total_chunks}")
    
    completed = 0
    # Loop to download all the chunks
    for x_offset in grid_steps: # For every lat
        for y_offset in grid_steps: # for every lat, lon pair
            chunk_px_x = center_px_x + x_offset # lat
            chunk_px_y = center_px_y + y_offset # lon
            chunk_lat, chunk_lng = Mercator_to_gps(chunk_px_x, chunk_px_y, ZOOM_LEVEL)

            filename = f"chunk_{chunk_lat:.6f}_{chunk_lng:.6f}.jpg"
            try:
                download_chunk(chunk_lat, chunk_lng, filename, output_dir)
                metadata["chunks"][filename] = {"centerGPS": [chunk_lat, chunk_lng], "filename": filename,}

                completed += 1
                print(f"Progress: {completed}/{total_chunks} ({round(completed/total_chunks*100)}%)", end="", flush=True)
            except requests.HTTPError as e:
                print(f"Failed to download {filename}: {e}")
    (output_dir / "metadata.json").write_text(json.dumps(metadata, indent=2))
    print("All chunks downloaded, please check alignment to Mercator (should be fine)")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Pre-mission satellite chunk downloader",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="Example:\n  python chunk_generator.py --center 43.071,-89.409 --radius 1000 --output camp_randall",
    )
    parser.add_argument("--center", required=True, metavar="LAT,LNG", help="Center coordinate as 'lat,lng'")
    parser.add_argument("--radius", required=True, type=int, metavar="METERS", help="Radius in meters")
    parser.add_argument("--output", default="mission_area", metavar="NAME", help="Output name / label (default: mission_area)")
    args = parser.parse_args()

    try:
        center_lat, center_lng = map(float, args.center.split(","))
    except ValueError:
        parser.error("--center must be in the format 'lat,lng', e.g. 43.071,-89.409")

    if not API_KEY:
        print("❌ Error: REACT_APP_GOOGLE_MAP_API environment variable not set", file=sys.stderr)
        sys.exit(1)

    generate_chunks(center_lat, center_lng, args.radius, args.output)


if __name__ == "__main__":
    main()
    # 43.07065451210445, -89.409809231738 - coords for camp randall