```markdown
# Chunk Downloader

A CLI tool for pre-mission satellite map chunk downloads. It queries the Google Maps Static API to download high-resolution (Zoom Level 20, 512x512px) satellite tiles using the Web Mercator projection and generates the necessary `metadata.json` for the offline React frontend tile renderer.

## Prerequisites

1. **Install Dependencies:**
   Ensure you have the required Python packages installed (e.g., `requests`, `python-dotenv`).
   ```bash
   pip install requests python-dotenv
   ```

2. **Environment Variables:**
   You must have a valid Google Maps API key. Create a `.env` file in the same directory as the script, or set it in your system environment variables:
   ```env
   REACT_APP_GOOGLE_MAP_API=your_google_maps_api_key_here
   ```

## Usage

Run the script using Python and provide the center coordinates and radius. 

**Example Command:**
```bash
python chunk_downloader.py --center 43.07065451210445,-89.409809231738 --radius 100
```

### Arguments

| Argument | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `--center` | **Yes** | The center GPS coordinate formatted as `lat,lng`. | `43.0706,-89.4098` |
| `--radius` | **Yes** | The radius from the center to download, measured in meters. | `100` |
| `--output` | No | Optional label/name for the mission area (default: `mission_area`). | `camp_randall` |

## Output

The script automatically creates the output folder structure if it does not exist. All downloaded `.jpg` map chunks and the mapping system's `metadata.json` file are saved directly into the frontend public directory for offline access:

```text
../frontend/public/chunks/
  ├── metadata.json
  ├── chunk_43.070655_-89.409809.jpg
  ├── chunk_...
```
```
  ├── chunk_43.070047_-89.408291.jpg
  └── ...
```
```
```
