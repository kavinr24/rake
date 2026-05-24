# rake

An AI-powered tool that scans Google Maps for local businesses without websites and automatically generates modern, responsive websites + pitches for each one.

## How It Works

1. **Search** - Enter a location, keyword, and place type. Rake queries the Google Maps Places API to find businesses matching your criteria.
2. **Filter** - Each result is checked for an existing website. Only businesses without one are kept.
3. **Generate** - An LLM (large language model) creates a complete website - HTML and CSS - tailored to each business using its name, address, phone, and category data.
4. **Export** - The generated website is saved to disk as a ready-to-deploy folder. Programmatic hero images and decorative assets are created automatically using Sharp.
5. **Review** - From the dashboard, you can preview each website live in-browser, download it as a zip, and copy a cold-outreach pitch to send to the business owner.

## Tech Stack

### Backend (Node.js)

| Library | Purpose |
| --- | --- |
| [Express](https://expressjs.com/) | HTTP server and REST API |
| [Axios](https://axios-http.com/) | HTTP client for Google Maps and LLM APIs |
| [Archiver](https://archiverjs.com/) | On-the-fly zip creation for website downloads |
| [Sharp](https://sharp.pixelplumbing.com/) | Programmatic hero image and asset generation |
| [Canvas](https://github.com/Automattic/node-canvas) | SVG-to-raster rendering for decorative patterns |
| [Fabric.js](http://fabricjs.com/) | Canvas abstraction layer for image composition |
| [jsdom](https://github.com/jsdom/jsdom) | DOM manipulation in Node.js |
| [fs-extra](https://github.com/jprichardson/node-fs-extra) | Extended filesystem operations |
| [slugify](https://github.com/simov/slugify) | URL-safe folder name generation |
| [dotenv](https://github.com/motdotla/dotenv) | Environment variable management |

### Frontend (Vanilla JS)

| Library | Purpose |
| --- | --- |
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first CSS framework (CDN) |
| [Material Symbols](https://fonts.google.com/icons) | Icon set (Google Fonts CDN) |
| Google Fonts | Inter, Space Grotesk, and Geist typefaces |

## Getting Started

### Prerequisites

- Node.js 18 or later
- A Google Maps API key (with Places API enabled)
- A Blackbox AI API key (or a Gemini API key)

### Setup

```bash
# Clone the repository
git clone https://github.com/kavinr24/rake
cd rake

# Install dependencies
npm install

# Create your environment file
cp .env.example .env
```

Edit `.env` and set your maps API key and preferred port:

```env
PORT=3000
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
BLACKBOX_API_KEY=BLACKBOX_API_KEY
OUTPUT_DIR=output
```

### Run

```bash
npm start
```

Open `http://localhost:3000` in your browser.

## API Endpoints

### `POST /api/run`

Runs a full search-and-generate pipeline.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `location` | string | Yes | Address or place name to search near |
| `keyword` | string | No | Business keyword filter (e.g. "coffee") |
| `placeType` | string | No | Google Maps place type (e.g. "cafe") |
| `rangeMiles` | number | No | Search radius in miles (default: 5) |
| `maxResults` | number | No | Max businesses to return (default: 20) |
| `outputDir` | string | No | Override the output directory |

### `POST /api/preview`

Returns the HTML and CSS for a generated website so the frontend can render it live in an iframe.

| Field | Type | Description |
| --- | --- | --- |
| `outputFolder` | string | Absolute path to the generated website folder |

### `POST /api/download`

Streams a zip file of the generated website folder.

| Field | Type | Description |
| --- | --- | --- |
| `outputFolder` | string | Absolute path to the generated website folder |

## Project Structure

```
rake-v2/
  public/              Frontend static files
    index.html         Main dashboard UI
    app.js             Client-side logic (rendering, modals, API calls)
    styles.css         Custom CSS animations
  src/
    index.js           Express server, API routes, startup validation
    services/
      places.js        Google Maps Places API integration
      llm.js           LLM integration (Blackbox AI), JSON repair logic
      gemini.js        Gemini alternative LLM provider
      exporter.js      Website file export and image generation
      image-generator.js  Programmatic image asset creation (Sharp + Canvas)
  output/              Default output directory for generated websites
  .env                 Environment variables (not committed)
  .env.example         Environment variable template
```

## License

ISC
