require('dotenv').config();
const amqp = require('amqplib');
const express = require('express');
const path = require('path');
const app = express();

const RABBITMQ_URL = process.env.RABBITMQ_URL;
const QUEUE = 'test_queue';

async function sendMessage(message) {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(QUEUE, { durable: false });
    channel.sendToQueue(QUEUE, Buffer.from(message));
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

app.post('/send', (req, res) => {
  const message = req.body.message;
  sendMessage(message);
  res.send(`Sent message: ${message}`);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
