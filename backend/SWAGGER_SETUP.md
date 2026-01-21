# Wakef Alik API - OpenAPI Documentation

## Overview

The Wakef Alik API is now fully documented with OpenAPI 3.0.3 specification and includes an interactive Swagger UI for testing and exploration.

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

New dependencies installed:

- `swagger-ui-express` - Serves Swagger UI
- `yamljs` - Parses OpenAPI YAML file
- `@types/swagger-ui-express` - TypeScript types
- `@types/yamljs` - TypeScript types

### 2. Start the Server

```bash
npm run dev
# or
npm start
```

### 3. Access API Documentation

Open your browser and navigate to:

```
http://localhost:3000/api/docs
```

## API Documentation Features

### Interactive Swagger UI

- **Try it out**: Execute API calls directly from the browser
- **Request/Response Examples**: See sample data for all endpoints
- **Authentication**: Use the "Authorize" button to add your JWT token
- **Schema Viewer**: Inspect request and response data structures

### Using Authentication in Swagger UI

1. First, register or login through the API:

   ```bash
   POST /api/auth/register
   # or
   POST /api/auth/login
   ```

2. Copy the `accessToken` from the response

3. Click the **"Authorize"** button at the top of Swagger UI

4. Enter: `Bearer <your-token>`

   ```
   Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

5. Click "Authorize" - Now all authenticated endpoints will include your token

## API Endpoints Summary

### 📋 Complete Routes Table

| Method                 | Path                        | Access           | Description               |
| ---------------------- | --------------------------- | ---------------- | ------------------------- |
| **Authentication**     |
| POST                   | /api/auth/register          | Public           | Register new user         |
| POST                   | /api/auth/login             | Public           | Login user                |
| POST                   | /api/auth/refresh           | Public           | Refresh access token      |
| POST                   | /api/auth/logout            | Public           | Logout user               |
| **Driver Profile**     |
| POST                   | /api/driver/profile         | DRIVER           | Create driver profile     |
| GET                    | /api/driver/profile         | DRIVER           | Get driver profile        |
| PATCH                  | /api/driver/profile         | DRIVER           | Update driver profile     |
| GET                    | /api/driver/available       | ADMIN/RESTAURANT | Get available drivers     |
| **Driver Operations**  |
| PATCH                  | /api/driver/location        | DRIVER           | Update location           |
| GET                    | /api/driver/deliveries      | DRIVER           | Get active deliveries     |
| **Restaurant Profile** |
| POST                   | /api/restaurant/profile     | RESTAURANT       | Create restaurant profile |
| GET                    | /api/restaurant/profile     | RESTAURANT       | Get restaurant profile    |
| PATCH                  | /api/restaurant/profile     | RESTAURANT       | Update restaurant profile |
| GET                    | /api/restaurant/verified    | Public           | Get verified restaurants  |
| **Delivery Requests**  |
| POST                   | /api/requests               | RESTAURANT       | Create delivery request   |
| GET                    | /api/requests/my            | RESTAURANT       | Get my requests           |
| GET                    | /api/requests/:id           | RESTAURANT       | Get request by ID         |
| PATCH                  | /api/requests/:id/cancel    | RESTAURANT       | Cancel request            |
| PATCH                  | /api/requests/:id/status    | DRIVER           | Update request status     |
| **Offers**             |
| GET                    | /api/offers/inbox           | DRIVER           | Get driver inbox          |
| POST                   | /api/offers/:offerId/accept | DRIVER           | Accept offer              |
| POST                   | /api/offers/:offerId/reject | DRIVER           | Reject offer              |

**Total: 23 endpoints**

## OpenAPI Specification Details

### File Location

```
backend/openapi.yaml
```

### Key Features

#### 1. Complete Schema Definitions

- `User` - User account information
- `DriverProfile` - Driver profile with vehicle info
- `RestaurantProfile` - Restaurant profile with location
- `DeliveryRequest` - Delivery request with status tracking
- `RequestOffer` - Driver offer management
- `GeoJSONPoint` - Geospatial location format

#### 2. Security Configuration

- JWT Bearer authentication
- Role-based access control (DRIVER, RESTAURANT, ADMIN)
- Security requirements per endpoint

#### 3. Response Schemas

- Success responses with data
- Error responses with descriptive messages
- Consistent response structure across all endpoints

#### 4. Request Validation

- Required fields marked
- Field types and formats specified
- Enum values for status fields
- GeoJSON coordinate validation

## GeoJSON Location Format

All location fields use GeoJSON Point format:

```json
{
  "type": "Point",
  "coordinates": [longitude, latitude]
}
```

**⚠️ Important**: Coordinates are `[longitude, latitude]`, not `[latitude, longitude]`

Example:

```json
{
  "type": "Point",
  "coordinates": [-73.935242, 40.73061]
}
```

## Testing Workflows in Swagger UI

### 1. Restaurant Creates Delivery Request

**Steps:**

1. Register as RESTAURANT: `POST /api/auth/register`
2. Authorize with the token
3. Create restaurant profile: `POST /api/restaurant/profile`
4. Create delivery request: `POST /api/requests`
5. Check request status: `GET /api/requests/my`

### 2. Driver Accepts Delivery

**Steps:**

1. Register as DRIVER: `POST /api/auth/register`
2. Authorize with the token
3. Create driver profile: `POST /api/driver/profile`
4. Update location: `PATCH /api/driver/location`
5. Check inbox: `GET /api/offers/inbox?state=SENT`
6. Accept offer: `POST /api/offers/{offerId}/accept`
7. Update status: `PATCH /api/requests/{id}/status`

## Code Changes Made

### 1. Added Dependencies (`package.json`)

```json
{
  "dependencies": {
    "swagger-ui-express": "^5.0.0",
    "yamljs": "^0.3.0"
  },
  "devDependencies": {
    "@types/swagger-ui-express": "^4.1.6",
    "@types/yamljs": "^0.2.34"
  }
}
```

### 2. Updated App Configuration (`src/app.ts`)

```typescript
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

// Load OpenAPI specification
const openapiPath = path.join(__dirname, '..', 'openapi.yaml');
const swaggerDocument = YAML.load(openapiPath);

// Swagger UI documentation
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Wakef Alik API Documentation',
  }),
);
```

### 3. Created OpenAPI Specification (`openapi.yaml`)

- Complete API documentation
- All 23 endpoints documented
- Schema definitions for all models
- Security schemes and role-based access
- Request/response examples

## Customization Options

### Swagger UI Theme

To customize the Swagger UI appearance, edit the options in `app.ts`:

```typescript
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Wakef Alik API Documentation',
    customfavIcon: '/path/to/favicon.ico', // Optional
    swaggerOptions: {
      persistAuthorization: true, // Keep auth between page refreshes
      displayRequestDuration: true, // Show request timing
      filter: true, // Enable endpoint filtering
    },
  }),
);
```

### Server URLs

Update the `servers` section in `openapi.yaml` to match your deployment:

```yaml
servers:
  - url: http://localhost:3000/api
    description: Local development server
  - url: https://api.wakef-alik.com/api
    description: Production server
  - url: https://staging.wakef-alik.com/api
    description: Staging server
```

## Validation & Testing

### Validate OpenAPI Spec

Use online validators:

- [Swagger Editor](https://editor.swagger.io/) - Paste your YAML
- [OpenAPI.tools](https://openapi.tools/#validators) - Various validators

### Generate API Clients

The OpenAPI spec can be used to generate client SDKs:

```bash
# Install OpenAPI Generator
npm install -g @openapitools/openapi-generator-cli

# Generate TypeScript client
openapi-generator-cli generate \
  -i backend/openapi.yaml \
  -g typescript-axios \
  -o client/
```

## Maintenance

### Keeping Documentation in Sync

When adding new endpoints:

1. **Update route file** (e.g., `src/router/*.routes.ts`)
2. **Update OpenAPI spec** (`openapi.yaml`):
   - Add new path definition
   - Add request/response schemas if needed
   - Document security requirements
   - Add examples
3. **Test in Swagger UI** to ensure it works

### Auto-Generation (Optional)

For automatic documentation generation, consider tools like:

- `swagger-jsdoc` - Generate from JSDoc comments
- `tsoa` - Generate from TypeScript decorators
- `nestjs/swagger` - If migrating to NestJS

## Troubleshooting

### Swagger UI Not Loading

**Check:**

1. OpenAPI file exists: `backend/openapi.yaml`
2. File has valid YAML syntax
3. Server is running on port 3000
4. Path is accessible: `http://localhost:3000/api/docs`

### Authentication Not Working

**Solutions:**

1. Get fresh token from `/api/auth/login`
2. Click "Authorize" button in Swagger UI
3. Enter: `Bearer <token>` (with space after "Bearer")
4. Token should be valid (check expiration)

### YAML Parse Errors

**Common issues:**

- Incorrect indentation (use 2 spaces, not tabs)
- Missing colons or hyphens
- Unescaped special characters in strings
- Use [YAML Lint](http://www.yamllint.com/) to validate

## Additional Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [OpenAPI Best Practices](https://swagger.io/resources/articles/best-practices-in-api-documentation/)

## Benefits of API Documentation

✅ **Developer Experience**: Easy to understand and test endpoints  
✅ **Client Generation**: Auto-generate client SDKs  
✅ **API Testing**: Interactive testing without external tools  
✅ **Team Collaboration**: Shared understanding of API contracts  
✅ **Version Control**: Documentation tracked with code  
✅ **Standards Compliance**: OpenAPI 3.0.3 standard

## Next Steps

1. **Install dependencies**: `npm install`
2. **Start server**: `npm run dev`
3. **Open docs**: http://localhost:3000/api/docs
4. **Test endpoints**: Use the "Try it out" button
5. **Integrate with frontend**: Use the spec for client generation

---

**🎉 Your API is now fully documented and ready to use!**
