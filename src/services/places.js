const axios = require('axios');

const GOOGLE_API_BASE = 'https://maps.googleapis.com/maps/api';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const buildGoogleError = (context, data) => {
  const message = data?.error_message
    ? `${context}: ${data.error_message}`
    : `${context}: Google API status ${data?.status || 'UNKNOWN'}`;
  return new Error(message);
};

const geocodeLocation = async (location, apiKey) => {
  console.log('Geocoding location...', { location });
  let response;
  try {
    response = await axios.get(`${GOOGLE_API_BASE}/geocode/json`, {
      params: { address: location, key: apiKey },
    });
  } catch (error) {
    console.error('Geocoding request failed.', error.response?.data || error);
    throw error;
  }

  console.log('Geocoding response received.', response.data);

  if (response.data.status !== 'OK' || !response.data.results?.length) {
    throw buildGoogleError('Geocoding failed', response.data);
  }

  const firstResult = response.data.results[0];
  return firstResult.geometry.location;
};

const verifyMapsApiKey = async ({ location, mapsApiKey }) => {
  return geocodeLocation(location, mapsApiKey);
};

const nearbySearch = async ({
  lat,
  lng,
  radiusMeters,
  keyword,
  type,
  pageToken,
  apiKey,
}) => {
  const params = {
    location: `${lat},${lng}`,
    radius: radiusMeters,
    key: apiKey,
  };

  if (keyword) params.keyword = keyword;
  if (type) params.type = type;
  if (pageToken) params.pagetoken = pageToken;

  let response;
  try {
    response = await axios.get(`${GOOGLE_API_BASE}/place/nearbysearch/json`, {
      params,
    });
  } catch (error) {
    console.error('Nearby search request failed.', error.response?.data || error);
    throw error;
  }

  if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
    throw buildGoogleError('Places search failed', response.data);
  }

  return response.data;
};

const getPlaceDetails = async (placeId, apiKey) => {
  let response;
  try {
    response = await axios.get(`${GOOGLE_API_BASE}/place/details/json`, {
      params: {
        place_id: placeId,
        fields:
          'name,website,formatted_address,formatted_phone_number,international_phone_number,types,geometry',
        key: apiKey,
      },
    });
  } catch (error) {
    console.error('Place details request failed.', error.response?.data || error);
    throw error;
  }

  if (response.data.status !== 'OK') {
    throw buildGoogleError('Place details failed', response.data);
  }

  return response.data.result;
};

const findBusinessesWithoutWebsites = async ({
  location,
  locationCoordinates,
  radiusMeters,
  maxResults,
  keyword,
  placeType,
  mapsApiKey,
}) => {
  const { lat, lng } = locationCoordinates || (await geocodeLocation(location, mapsApiKey));

  console.log('Starting nearby business search.', {
    lat,
    lng,
    radiusMeters,
    keyword,
    placeType,
    maxResults,
  });

  const businesses = [];
  const seenPlaceIds = new Set();
  let pageToken = null;

  do {
    if (pageToken) {
      await sleep(2000);
    }

    const searchData = await nearbySearch({
      lat,
      lng,
      radiusMeters,
      keyword,
      type: placeType || (!keyword ? 'establishment' : undefined),
      pageToken,
      apiKey: mapsApiKey,
    });

    console.log('Nearby search response received.', searchData);

    const results = Array.isArray(searchData.results) ? searchData.results : [];
    for (const result of results) {
      if (businesses.length >= maxResults) break;
      if (!result.place_id || seenPlaceIds.has(result.place_id)) continue;

      console.log('Fetching place details.', result);

      seenPlaceIds.add(result.place_id);
      const details = await getPlaceDetails(result.place_id, mapsApiKey);

      console.log('Place details received.', details);

      if (!details.website) {
        businesses.push({
          name: details.name,
          address: details.formatted_address || null,
          phone:
            details.international_phone_number ||
            details.formatted_phone_number ||
            null,
          placeId: result.place_id,
          types: details.types || [],
          location: details.geometry?.location || null,
        });
      }
    }

    if (businesses.length >= maxResults) break;
    pageToken = searchData.next_page_token || null;
  } while (pageToken);

  return businesses;
};

module.exports = {
  findBusinessesWithoutWebsites,
  verifyMapsApiKey,
};
