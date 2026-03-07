# Cooperative Management System

A modern web application for managing cooperative members, loans, shares, and savings with authentication and admin role management.

## 🌐 Live Deployment

This application is configured for production deployment. When you run `npm start`, it serves both the backend API and the frontend React app from a single server.

### Running in Production Mode

```bash
# Install all dependencies (if not already installed)
npm install

# Start the production server
npm start
```

The application will be available at: **http://localhost:3001**

## Features

- **Authentication System**: Secure login/register with JWT tokens
- **Admin Role Management**: Role-based access control
- **Citizenship Management**: Store and manage citizenship details with photo uploads
- **Members Management**: Full CRUD operations for members
- **Loan Management**: Track loans with interest, guarantors, collateral, and repayment tracking
- **Share Management**: Manage share purchases and tracking
- **Savings Management**: Handle savings accounts with monthly contributions tracking
- **Monthly Savings**: Track monthly savings in Bikram Sambat (BS) calendar
- **Dashboard**: Overview statistics and quick actions
- **Modern UI**: Beautiful, responsive design with smooth animations

## Tech Stack

- **Frontend**: React 18 with React Router
- **Backend**: Node.js with Express
- **Database**: SQLite with Better-SQLite3
- **Authentication**: JWT (JSON Web Tokens)
- **Styling**: Custom CSS with modern design principles

## Getting Started (Development)

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   cd client && npm install
   cd ..
   ```

2. **Start the backend server**:
   ```bash
   npm start
   ```
   The server will run on `http://localhost:3001`

3. **Start the frontend development server**:
   ```bash
   cd client && npm start
   ```
   The app will open at `http://localhost:3000`

### Default Login

- **Username**: admin
- **Password**: admin123

## Project Structure

```
cooperative-management/
├── package.json
├── server.js                 # Backend server (also serves frontend in production)
├── cooperative.db            # SQLite database
├── uploads/                  # Uploaded files
├── client/
│   ├── package.json
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── index.js
│       ├── App.js           # Main React application
│       └── App.css          # Styles
└── README.md
```

## Deployment Options

### Option 1: Simple Node.js Server (Current)
Run `npm start` - serves both API and frontend from port 3001

### Option 2: Static Hosting
Build the React app with `npm run build` and deploy the `client/build` folder to any static hosting service (Netlify, Vercel, AWS S3, etc.)

### Option 3: Docker
Create a Dockerfile to containerize the application

## License

MIT License

## Support

For issues and questions, please open a GitHub issue.
