import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { apiReference } from '@scalar/express-api-reference';
import YAML from 'yamljs';
import path from 'path';
import router from './router';

const app = express();

// Load OpenAPI specification
const openapiPath = path.join(__dirname, '..', 'openapi.yaml');
const openapiDocument = YAML.load(openapiPath);

// Configure helmet with CSP that allows Scalar API documentation
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        workerSrc: ["'self'", "blob:"],
      },
    },
  })
);
app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend is running' });
});

// Scalar API documentation
app.use(
  '/api/docs',
  apiReference({
    spec: {
      content: openapiDocument,
    },
  })
);

// Mount API routes
app.use('/api', router);

export default app;
