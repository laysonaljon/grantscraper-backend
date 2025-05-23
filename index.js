import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';

import connectDB from './mongodb/connect.js';
import scholarships from './routes/scholarships.js';
import users from './routes/users.js';
import initializeCronJobs  from './cronJobs.js';


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));


app.use('/api/v1/scholarships', scholarships);

app.use('/api/v1/users', users);

 initializeCronJobs();

app.get('/', async (req, res) => {
    res.status(200).json({
      message: 'Test Server Grantscraper',
    });
  });

  const startServer = async () => {
    try {
      connectDB(process.env.MONGODB_URL);
      app.listen(8080, () => console.log('Server started on port 8080'));
    } catch (error) {
      console.log(error);
    }
  };

startServer();