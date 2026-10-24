require('dotenv').config();

async function listModels() {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    });
    const data = await response.json();

    if (!response.ok) {
      console.log('Error:', data.error ? data.error.message : data);
      return;
    }

    console.log('Available models:');
    data.data.forEach((m) => console.log('-', m.id));
  } catch (error) {
    console.log('Error:', error.message);
  }
}

listModels();