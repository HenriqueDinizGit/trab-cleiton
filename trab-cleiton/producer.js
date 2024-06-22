require('dotenv').config();
const amqp = require('amqplib');
const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();

const RABBITMQ_URL = process.env.RABBITMQ_URL;
const QUEUE = 'test_queue';
const DOG_API_KEY = 'live_dBmtI2ivC2IiRKyjw8gVEkRNt7DLAoNaHQDX1ONG99cRmdpBr7Cf5Xdq2aSMCwGz'; // Substitua pela sua chave da The Dog API

async function sendMessage(message) {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(QUEUE, { durable: false });
    channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify(message)));
    console.log(" [x] Sent '%s'", message);
    setTimeout(() => {
      connection.close();
    }, 500);
  } catch (error) {
    console.error('Error in sending message: ', error);
  }
}

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/dogs', async (req, res) => {
  try {
    const response = await axios.get('https://api.thedogapi.com/v1/breeds', {
      headers: { 'x-api-key': DOG_API_KEY }
    });
    const breeds = response.data;
    res.json(breeds);
  } catch (error) {
    console.error('Error fetching dog breeds: ', error);
    res.status(500).send('Error fetching dog breeds');
  }
});

app.post('/send', async (req, res) => {
  const { breedId, breedName, breedDetails } = req.body;
  if (!breedId || !breedName) {
    return res.status(400).send('Breed ID and Name are required');
  }
  try {
    const response = await axios.get(`https://api.thedogapi.com/v1/images/search?breed_id=${breedId}`, {
      headers: { 'x-api-key': DOG_API_KEY }
    });
    const imageUrl = response.data[0].url;
    const message = {
      breed: breedName,
      imageUrl: imageUrl,
      details: breedDetails
    };
    await sendMessage(message);
    res.send(`Sent message: ${breedName}`);
  } catch (error) {
    console.error('Error fetching image: ', error);
    res.status(500).send('Error fetching image');
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`http://localhost:3000/`);
});
