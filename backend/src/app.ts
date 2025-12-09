import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Import routes (we will create this later)
// import rootRouter from './routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend is running' });
});



export default app;
