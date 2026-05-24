const axios = require('axios');

const DEFAULT_MODEL = 'gemini-pro';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

const buildPrompt = (business) => {
  const details = [
    `Business name: ${business.name}`,
    business.address ? `Address: ${business.address}` : null,
    business.phone ? `Phone: ${business.phone}` : null,
    business.types?.length ? `Categories: ${business.types.join(', ')}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return `You are a senior web designer. Create a premium, modern, single-page website for the business below.

${details}

Requirements:
- Return ONLY valid JSON (no markdown).
- JSON must have keys: "html" and "css".
- "html" must be a complete HTML document that links to "styles.css" via <link rel="stylesheet" href="styles.css">.
- Do not include <style> or <script> tags in the HTML.
- Use semantic HTML with sections: hero, services, about, contact.
- If address or phone is missing, omit that line instead of inventing data.
`;
};

const extractText = (responseData) => {
  const candidate = responseData?.candidates?.[0];
  const parts = candidate?.content?.parts || [];
  const textPart = parts.find((part) => typeof part.text === 'string');
  return textPart?.text || '';
};

const stripCodeFences = (text) => {
  return text
    .replace(/^\s*```[a-zA-Z]*\s*/u, '')
    .replace(/\s*```\s*$/u, '')
    .trim();
};

const verifyGeminiApiKey = async (apiKey) => {
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  console.log('Checking Gemini API access...', { model });

  let response;
  try {
    response = await axios.get(`${GEMINI_API_BASE}/models`, {
      params: { key: apiKey },
    });
  } catch (error) {
    console.error('Gemini access check failed.', error.response?.data || error);
    throw error;
  }

  const models = Array.isArray(response.data?.models) ? response.data.models : [];
  console.log('Gemini models response received.', {
    modelCount: models.length,
    modelNames: models.map((entry) => entry.name),
  });

  return response.data;
};

const generateWebsite = async (business, apiKey) => {
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`;

  console.log('Sending Gemini generation request.', {
    model,
    business,
  });

  let response;
  try {
    response = await axios.post(
      url,
      {
        contents: [
          {
            role: 'user',
            parts: [{ text: buildPrompt(business) }],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 2048,
        },
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Gemini generation request failed.', error.response?.data || error);
    throw error;
  }

  console.log('Gemini generation response received.', response.data);

  const rawText = extractText(response.data);
  if (!rawText) {
    throw new Error('Gemini returned an empty response.');
  }

  const jsonText = stripCodeFences(rawText);
  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    throw new Error(`Failed to parse Gemini JSON response: ${error.message}`);
  }

  if (typeof parsed.html !== 'string' || typeof parsed.css !== 'string') {
    throw new Error('Gemini response must include html and css strings.');
  }

  if (!parsed.html.includes('styles.css')) {
    throw new Error('Gemini HTML must link to styles.css.');
  }

  return { html: parsed.html, css: parsed.css };
};

module.exports = {
  generateWebsite,
  verifyGeminiApiKey,
};
