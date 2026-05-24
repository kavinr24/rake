const axios = require('axios');

async function test() {
  const apiKey = 'BLACKBOX_API_KEY';
  const model = 'blackboxai/minimax/minimax-free';

  console.log('Testing with model:', model);
  console.log('API Key:', apiKey);

  // Test 1: Simple verification
  console.log('\n--- Test 1: Simple verification ---');
  try {
    const r1 = await axios.post(
      'https://api.blackbox.ai/chat/completions',
      { model, messages: [{ role: 'user', content: 'Hello' }], max_tokens: 1 },
      { headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
    );
    console.log('STATUS:', r1.status);
    console.log('FULL RESPONSE:', JSON.stringify(r1.data, null, 2));
  } catch (e) {
    console.log('ERROR:', e.response?.status, JSON.stringify(e.response?.data, null, 2));
  }

  // Test 2: Website generation prompt
  console.log('\n--- Test 2: Website generation ---');
  try {
    const r2 = await axios.post(
      'https://api.blackbox.ai/chat/completions',
      {
        model,
        messages: [{ role: 'user', content: 'Return JSON with html and css keys for a coffee shop website. Only valid JSON.' }],
        temperature: 0.4,
        max_tokens: 2048,
      },
      { headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
    );
    console.log('STATUS:', r2.status);
    console.log('FULL RESPONSE:', JSON.stringify(r2.data, null, 2));
    if (r2.data?.choices?.[0]?.message?.content) {
      console.log('\nCONTENT:', r2.data.choices[0].message.content);
    } else {
      console.log('\nCONTENT IS EMPTY OR NULL');
    }
  } catch (e) {
    console.log('ERROR:', e.response?.status, JSON.stringify(e.response?.data, null, 2));
  }

  // Test 3: Try a known working model for comparison
  console.log('\n--- Test 3: Try with gpt-4 model ---');
  try {
    const r3 = await axios.post(
      'https://api.blackbox.ai/chat/completions',
      { model: 'gpt-4', messages: [{ role: 'user', content: 'Hello' }], max_tokens: 5 },
      { headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
    );
    console.log('STATUS:', r3.status);
    console.log('FULL RESPONSE:', JSON.stringify(r3.data, null, 2));
  } catch (e) {
    console.log('ERROR:', e.response?.status, JSON.stringify(e.response?.data, null, 2));
  }
}

test();
