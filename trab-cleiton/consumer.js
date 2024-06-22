require('dotenv').config();
const amqp = require('amqplib');
const express = require('express');
const path = require('path');
const app = express();

const RABBITMQ_URL = process.env.RABBITMQ_URL;
const QUEUE = 'test_queue';
let messages = [];

async function receiveMessages() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(QUEUE, { durable: false });
    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", QUEUE);
    channel.consume(QUEUE, (msg) => {
      const message = JSON.parse(msg.content.toString());
      console.log(" [x] Received '%s'", message);
      messages.push(message);
    }, { noAck: true });
  } catch (error) {
    console.error('Error in receiving message: ', error);
  }
}

app.use(express.static(path.join(__dirname, 'public')));

app.get('/messages', (req, res) => {
  res.json(messages);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'consumer.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Consumer running on port ${PORT}`);
  console.log(`http://localhost:3001/`);
  receiveMessages();
});
