const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const archiver = require('archiver');
const fs = require('fs');
const {
  findBusinessesWithoutWebsites,
  verifyMapsApiKey,
} = require('./services/places');
const { generateWebsite, verifyApiKey } = require('./services/llm');
const { exportWebsite } = require('./services/exporter');

dotenv.config();

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(process.cwd(), 'public')));

const MAX_RADIUS_METERS = 50000;
const DEFAULT_MAX_RESULTS = 20;

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const normalizeString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const parsePositiveNumber = (value) => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return null;
  if (numberValue <= 0) return null;
  return numberValue;
};

const resolveRadiusMeters = (body) => {
  const directRadius = parsePositiveNumber(body.radiusMeters ?? body.rangeMeters);
  if (directRadius) return Math.round(directRadius);

  const milesRadius = parsePositiveNumber(body.rangeMiles ?? body.radiusMiles);
  if (milesRadius) return Math.round(milesRadius * 1609.34);

  const rangeValue = parsePositiveNumber(body.range);
  const rangeUnit = normalizeString(body.rangeUnit);
  if (rangeValue && rangeUnit) {
    if (rangeUnit.toLowerCase() === 'miles') {
      return Math.round(rangeValue * 1609.34);
    }
    if (rangeUnit.toLowerCase() === 'meters') {
      return Math.round(rangeValue);
    }
  }

  return null;
};

app.get('/rake_logo.png', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'rake_logo.png'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

app.post(
  '/api/run',
  asyncHandler(async (req, res) => {
    const errors = [];
    const location = normalizeString(req.body.location);
    const keyword = normalizeString(req.body.keyword);
    const placeType = normalizeString(req.body.placeType);
    const outputDirInput = normalizeString(req.body.outputDir);

    if (!location) {
      errors.push('location is required (string).');
    }

    const radiusMeters = resolveRadiusMeters(req.body);
    if (!radiusMeters) {
      errors.push(
        'Provide range using radiusMeters, rangeMeters, rangeMiles, or range + rangeUnit.'
      );
    } else if (radiusMeters > MAX_RADIUS_METERS) {
      errors.push(`radiusMeters must be <= ${MAX_RADIUS_METERS}.`);
    }

    let maxResults = DEFAULT_MAX_RESULTS;
    if (req.body.maxResults !== undefined) {
      const parsedMax = parsePositiveNumber(req.body.maxResults);
      if (!parsedMax) {
        errors.push('maxResults must be a positive number.');
      } else {
        maxResults = Math.round(parsedMax);
      }
    }

    if (errors.length > 0) {
      res.status(400).json({ errors });
      return;
    }

    console.log('Run request received', {
      location,
      keyword,
      placeType,
      radiusMeters,
      maxResults,
      outputDir: outputDirInput || process.env.OUTPUT_DIR || 'output',
    });

    const mapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
    const llmApiKey = process.env.BLACKBOX_API_KEY;
    if (!mapsApiKey) {
      throw new Error('GOOGLE_MAPS_API_KEY is required.');
    }
    if (!llmApiKey) {
      throw new Error('BLACKBOX_API_KEY is required.');
    }

    console.log('Validating Google Maps API key...');
    const validatedLocation = await verifyMapsApiKey({ location, mapsApiKey });
    console.log('Google Maps API key worked.', {
      location,
      coordinates: validatedLocation,
    });

    console.log('Validating Blackbox AI API key...');
    await verifyApiKey(llmApiKey);
    console.log('Blackbox AI API key worked.');

    const businesses = await findBusinessesWithoutWebsites({
      location,
      locationCoordinates: validatedLocation,
      radiusMeters,
      maxResults,
      keyword,
      placeType,
      mapsApiKey,
    });

    console.log('Maps lookup complete.', {
      totalBusinessesWithoutWebsites: businesses.length,
      businesses,
    });

    const outputRoot = path.resolve(
      process.cwd(),
      outputDirInput || process.env.OUTPUT_DIR || 'output'
    );

    const generated = [];
    for (const business of businesses) {
      console.log('Generating website for business.', business);
      const website = await generateWebsite(business, llmApiKey);
      console.log('Website generated.', {
        businessName: business.name,
        htmlLength: website.html.length,
        cssLength: website.css.length,
        htmlPreview: website.html.slice(0, 500),
        cssPreview: website.css.slice(0, 500),
      });
      const outputFolder = await exportWebsite(outputRoot, business, website);
      console.log('Website exported.', {
        businessName: business.name,
        outputFolder,
      });
      generated.push({ ...business, outputFolder });
    }

    console.log('Run complete.', {
      totalFound: businesses.length,
      totalGenerated: generated.length,
      outputDir: outputRoot,
    });

    res.json({
      totalFound: businesses.length,
      totalGenerated: generated.length,
      outputDir: outputRoot,
      businesses: generated,
    });
  })
);

app.post(
  '/api/preview',
  asyncHandler(async (req, res) => {
    const { outputFolder } = req.body;
    if (!outputFolder || typeof outputFolder !== 'string') {
      res.status(400).json({ error: 'outputFolder is required.' });
      return;
    }

    const resolved = path.resolve(outputFolder);
    const outputRoot = path.resolve(
      process.cwd(),
      process.env.OUTPUT_DIR || 'output'
    );
    if (!resolved.startsWith(outputRoot + path.sep) && resolved !== outputRoot) {
      res.status(403).json({ error: 'Invalid output folder path.' });
      return;
    }

    if (!fs.existsSync(resolved)) {
      res.status(404).json({ error: 'Output folder not found.' });
      return;
    }

    const htmlPath = path.join(resolved, 'index.html');
    const cssPath = path.join(resolved, 'styles.css');

    if (!fs.existsSync(htmlPath)) {
      res.status(404).json({ error: 'index.html not found in output folder.' });
      return;
    }

    const html = fs.readFileSync(htmlPath, 'utf8');
    const css = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8') : '';

    res.json({ html, css });
  })
);

app.post(
  '/api/download',
  asyncHandler(async (req, res) => {
    const { outputFolder } = req.body;
    if (!outputFolder || typeof outputFolder !== 'string') {
      res.status(400).json({ error: 'outputFolder is required.' });
      return;
    }

    // Resolve and validate the path is within the output directory
    const resolved = path.resolve(outputFolder);
    const outputRoot = path.resolve(
      process.cwd(),
      process.env.OUTPUT_DIR || 'output'
    );
    if (!resolved.startsWith(outputRoot + path.sep) && resolved !== outputRoot) {
      res.status(403).json({ error: 'Invalid output folder path.' });
      return;
    }

    if (!fs.existsSync(resolved)) {
      res.status(404).json({ error: 'Output folder not found.' });
      return;
    }

    const folderName = path.basename(resolved);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${folderName}.zip"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to create archive.' });
      }
    });

    archive.pipe(res);
    archive.directory(resolved, folderName);
    await archive.finalize();
  })
);

app.use((err, req, res, next) => {
  console.error('Request failed.', {
    method: req.method,
    path: req.originalUrl,
    body: req.body,
  });
  console.error(err?.stack || err);
  res.status(500).json({ error: err.message || 'Internal server error.' });
});

const validateStartup = async () => {
  const mapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
  const llmApiKey = process.env.BLACKBOX_API_KEY;

  console.log('\n=== API Key Validation ===\n');

  if (!mapsApiKey) {
    console.error('❌ GOOGLE_MAPS_API_KEY is not set in .env');
  } else {
    try {
      console.log('Checking Google Maps API key...');
      await verifyMapsApiKey({ location: 'San Francisco', mapsApiKey });
      console.log('✓ Google Maps API key is valid\n');
    } catch (error) {
      console.error('❌ Google Maps API key failed:', error.message, '\n');
    }
  }

  if (!llmApiKey) {
    console.error('❌ BLACKBOX_API_KEY is not set in .env');
  } else {
    try {
      console.log('Checking Blackbox AI API key...');
      await verifyApiKey(llmApiKey);
      console.log('✓ Blackbox AI API key is valid\n');
    } catch (error) {
      console.error('❌ Blackbox AI API key failed:', error.message, '\n');
    }
  }

  console.log('=========================\n');
};

const port = Number(process.env.PORT) || 3000;

validateStartup().then(() => {
  app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
  });
});
