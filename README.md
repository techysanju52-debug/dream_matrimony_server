# Dream Matrimony - Backend API

The backend server for the Dream Matrimony platform, built with Node.js, Express, and MongoDB.

## 🚀 Features
- **Authentication**: JWT-based auth with OTP verification.
- **Role Management**: Admin and Visitor roles.
- **Profile Management**: Full CRUD for profiles (Admins only).
- **Filtering & Search**: Advanced profile filtering (Age, Religion, Gender, etc.).
- **Cloudinary Integration**: Image uploads for profile pictures.
- **Email Service**: Automated OTP delivery via Nodemailer.

## 🛠️ Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Auth**: JSON Web Tokens (JWT) & BcryptJS
- **Media**: Cloudinary API
- **Email**: Nodemailer

## 📦 Installation

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (see below).

4. Start the development server:
   ```bash
   npm run dev
   ```

## 🔑 Environment Variables
Create a `.env` file in the root of the `/server` folder and add the following:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 🏗️ Project Structure
- `/models`: Mongoose schemas (Profile, Admin, Visitor, PendingVisitor).
- `/routes`: API endpoints (Auth, Profiles).
- `/middleware`: Auth and role-based access control.
- `/utils`: Helper functions (Email service, OTP generation).
- `index.js`: Main entry point.

## 🧪 Database Seeding
To populate the database with sample profiles:
```bash
node seed.js
```

To create a default admin account:
```bash
node adminSeed.js
```

## 🛣️ API Endpoints

### Auth
- `POST /api/auth/register`: Register as a visitor (sends OTP).
- `POST /api/auth/verify-otp`: Verify OTP and finalize registration.
- `POST /api/auth/login`: Admin/Visitor login.
- `GET /api/auth/me`: Get current logged-in user.

### Profiles
- `GET /api/profiles`: List profiles (paginated & filtered).
- `GET /api/profiles/:id`: Get detailed profile info.
- `POST /api/profiles`: Add a new profile (Admin only).
- `DELETE /api/profiles/:id`: Delete a profile (Admin only).
