# Bus Tracking API Documentation

## Public Endpoints
- `GET /buses` - Get all buses
- `GET /buses/search?source=city&destination=city` - Search buses
- `GET /buses/:id` - Get bus by ID

## Admin Endpoints
- `POST /admin/login` - Admin login
- `POST /buses/add` - Add new bus

## Driver Endpoints
- `POST /drivers/login` - Driver login
- `PUT /buses/location` - Update bus location