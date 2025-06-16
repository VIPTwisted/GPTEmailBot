
# Autonomous Netlify Dashboard

A fully autonomous, real-time dashboard for managing Netlify sites with advanced alerting, email notifications, and Firestore integration.

## Features

- 🚀 **Real-time Site Monitoring** - Live updates for all your Netlify sites
- 🔔 **Smart Alerting System** - Instant notifications for deployment failures and long-running builds
- 📧 **Email Notifications** - Automated email alerts sent to administrators
- 🔥 **Firestore Integration** - Persistent alert storage and real-time synchronization
- 📱 **Responsive Design** - Beautiful, mobile-friendly interface built with Tailwind CSS
- 🛡️ **Secure API Proxy** - Secure Netlify API access through serverless functions
- ⚡ **Autonomous Operations** - Scheduled monitoring and automatic alert generation

## Architecture

### Frontend (React)
- React 18 with modern hooks and context
- React Router for navigation
- Firestore real-time listeners
- Tailwind CSS for styling
- Lucide React for icons

### Backend (Netlify Functions)
- `netlify-api-proxy` - Secure API proxy for Netlify operations
- `alert-processor` - Webhook handler for processing Netlify events
- `email-sender` - Email notification service using SendGrid
- `scheduled-monitor` - Autonomous monitoring service

### Database (Firestore)
- Real-time alert storage
- Scalable and secure
- Automatic synchronization

## Setup Instructions

### 1. Environment Variables

Set the following environment variables in both Replit Secrets and Netlify site settings:

#### Required for Netlify Functions:
```
NETLIFY_ACCESS_TOKEN=your_netlify_personal_access_token
EMAIL_API_KEY=your_sendgrid_api_key
ADMIN_EMAIL=admin@yourdomain.com
FROM_EMAIL=alerts@yourdomain.com
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_service_account_email
FIREBASE_PRIVATE_KEY=your_firebase_private_key
```

#### Required for React App:
```
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### 2. Netlify Setup

1. **Get Netlify Access Token:**
   - Go to Netlify User Settings > Applications
   - Create a new personal access token
   - Copy the token to `NETLIFY_ACCESS_TOKEN`

2. **Configure SendGrid:**
   - Sign up for SendGrid
   - Create an API key with email sending permissions
   - Copy the API key to `EMAIL_API_KEY`

### 3. Firebase Setup

1. **Create Firebase Project:**
   - Go to Firebase Console
   - Create a new project
   - Enable Firestore Database

2. **Generate Service Account:**
   - Go to Project Settings > Service Accounts
   - Generate a new private key
   - Copy the credentials to environment variables

3. **Configure Firestore Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /alerts/{document} {
      allow read, write: if true; // Adjust based on your security needs
    }
  }
}
```

### 4. Deployment

1. **Deploy to Netlify:**
   ```bash
   npm run build
   # Deploy the build folder to Netlify
   ```

2. **Configure Webhooks:**
   - In each Netlify site you want to monitor
   - Go to Site Settings > Build & Deploy > Deploy notifications
   - Add webhook: `https://your-dashboard.netlify.app/.netlify/functions/alert-processor`
   - Select events: `Deploy started`, `Deploy succeeded`, `Deploy failed`

3. **Set up Scheduled Monitoring:**
   - The `scheduled-monitor` function runs automatically
   - Configure frequency in Netlify Functions dashboard

## Usage

### Global Dashboard
- View all alerts across all sites
- Mark alerts as read
- Filter and sort alerts
- Real-time updates via Firestore

### Site Management
- View individual site details
- Trigger manual deployments
- View deployment history
- Site-specific alerts

### Alert Types
- `deploy_failed` - Deployment failures
- `deploy_succeeded` - Successful deployments
- `build_started` - Build initiation
- `build_timeout` - Long-running builds (15+ minutes)

## Development

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

### Testing Functions Locally
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Start local development
netlify dev
```

## Security Considerations

- All sensitive credentials are stored as environment variables
- API proxy functions validate requests
- Firestore rules can be configured for additional security
- CORS headers properly configured

## Troubleshooting

### Common Issues

1. **Firebase Connection Issues**
   - Verify all Firebase environment variables are set
   - Check Firestore rules allow read/write access
   - Ensure service account has proper permissions

2. **Netlify API Errors**
   - Verify `NETLIFY_ACCESS_TOKEN` is valid
   - Check token has proper scopes
   - Ensure site IDs are correct

3. **Email Delivery Issues**
   - Verify SendGrid API key is valid
   - Check sender email is verified in SendGrid
   - Review SendGrid activity logs

### Logs and Monitoring

- Check Netlify function logs in dashboard
- Monitor Firestore usage in Firebase console
- Review email delivery in SendGrid dashboard

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review environment variable configuration
3. Check function logs in Netlify dashboard
4. Verify Firebase setup in console

## License

MIT License - see LICENSE file for details
