# CityFix Admin

A comprehensive admin dashboard for managing municipal services and user accounts. Built with React, TypeScript, and Firebase.

## Features

- **User Management**: Create, edit, delete, and manage user accounts
- **Password Reset**: Secure password reset functionality for admin users
- **Municipal Management**: Manage municipal entities and their details
- **Role-Based Access Control**: Admin and staff role management
- **Audit Logging**: Comprehensive audit trail for all actions
- **Responsive Design**: Modern, mobile-friendly interface

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Firebase Functions, Firestore
- **Authentication**: Firebase Authentication
- **Styling**: CSS-in-JS with React styles
- **Deployment**: Firebase Hosting

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase CLI
- Firebase project with Authentication and Firestore enabled

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/BlaBla-03/CityFix-Admin.git
   cd CityFix-Admin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Firebase Setup**
   ```bash
   # Login to Firebase
   firebase login
   
   # Initialize Firebase (if not already done)
   firebase init
   ```

4. **Environment Configuration**
   - Ensure your Firebase project is properly configured
   - Update Firebase configuration in `src/config/firebase.ts` if needed

## Development

### Start Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Type Checking
```bash
npm run type-check
```

## Deployment

### Deploy Frontend
```bash
npm run build
firebase deploy --only hosting
```

### Deploy Cloud Functions
```bash
firebase deploy --only functions
```

### Deploy Everything
```bash
firebase deploy
```

## Project Structure

```
CityFix-Admin/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Page components
│   ├── contexts/           # React contexts
│   ├── utils/              # Utility functions
│   ├── config/             # Configuration files
│   └── assets/             # Static assets
├── functions/              # Firebase Cloud Functions
├── public/                 # Public assets
└── dist/                   # Build output
```

## Key Features

### User Management
- Create new users with temporary passwords
- Edit user details and roles
- Reset user passwords securely
- Delete users with confirmation

### Authentication
- Firebase Authentication integration
- Role-based access control (Admin/Staff)
- Session management
- Password reset functionality

### Cloud Functions
- `updateUserPassword`: HTTP endpoint for password resets
- `deleteUser`: HTTP endpoint for user deletion
- Proper authentication and authorization checks

## API Endpoints

### updateUserPassword
- **Method**: POST
- **URL**: `https://us-central1-city-fix-62029.cloudfunctions.net/updateUserPassword`
- **Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Bearer <firebase-id-token>`
- **Body**: 
  ```json
  {
    "userId": "user-id",
    "newPassword": "new-password"
  }
  ```

### deleteUser
- **Method**: POST
- **URL**: `https://us-central1-city-fix-62029.cloudfunctions.net/deleteUser`
- **Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Bearer <firebase-id-token>`
- **Body**: 
  ```json
  {
    "userId": "user-id"
  }
  ```

## Security

- All Cloud Functions require Firebase Authentication
- Admin role verification for sensitive operations
- CORS enabled for cross-origin requests
- Input validation and error handling
- Audit logging for all user actions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.
