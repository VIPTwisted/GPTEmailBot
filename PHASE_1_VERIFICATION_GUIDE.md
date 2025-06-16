
# PHASE 1: VERIFICATION & INITIAL DEPLOYMENT GUIDE

## Step 1: Frontend Local Testing

### 1.1 Install Dependencies and Start React App
```bash
# Install all dependencies
npm install

# Start the React development server
npm start
```

### 1.2 Verify Core Components Load
- Open http://0.0.0.0:3000
- Check that the dashboard loads without errors
- Verify navigation between tabs works
- Test responsive design on different screen sizes

### 1.3 Authentication Testing
- Test login/logout flow
- Verify role-based access control
- Check session persistence
- Test unauthorized access handling

### 1.4 UI Element Verification
- Confirm all metrics cards display
- Test real-time updates
- Verify charts and visualizations render
- Check loading states and error handling

## Step 2: Netlify Functions Local Testing

### 2.1 Test netlify-api-proxy.js
```bash
# Test the Netlify API proxy
curl -X GET "http://0.0.0.0:8888/.netlify/functions/netlify-api-proxy?endpoint=sites"
```

### 2.2 Test ai-assistant.js
```bash
# Test AI assistant functionality
curl -X POST "http://0.0.0.0:8888/.netlify/functions/ai-assistant" \
  -H "Content-Type: application/json" \
  -d '{"query": "analyze deployment performance"}'
```

### 2.3 Test alert-processor.js
```bash
# Test alert processing
curl -X POST "http://0.0.0.0:8888/.netlify/functions/alert-processor" \
  -H "Content-Type: application/json" \
  -d '{"type": "deployment_failed", "siteId": "test-site"}'
```

## Step 3: Complete netlify.toml Configuration

See netlify.toml file created below.

## Step 4: GitHub & Netlify Integration

### 4.1 Create GitHub Repository
1. Go to https://github.com/new
2. Create repository named "toyparty-master-orchestrator"
3. Copy the repository URL

### 4.2 Link Replit to GitHub
```bash
# Initialize git if not already done
git init

# Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/toyparty-master-orchestrator.git

# Add all files
git add .

# Commit
git commit -m "Initial Master Deployment Orchestrator commit"

# Push to GitHub
git push -u origin main
```

### 4.3 Connect GitHub to Netlify
1. Go to https://app.netlify.com
2. Click "New site from Git"
3. Choose "GitHub"
4. Select your repository
5. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `build`
   - Functions directory: `netlify/functions`

## Step 5: Environment Variables Setup

### 5.1 Required Environment Variables
In Netlify dashboard → Site settings → Environment variables:

```
NETLIFY_ACCESS_TOKEN=your_netlify_token_here
OPENAI_API_KEY=your_openai_key_here
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
EMAIL_SERVICE_API_KEY=your_email_service_key
WEBHOOK_SECRET=your_webhook_secret
NODE_ENV=production
```

## Step 6: Webhook Configuration

### 6.1 Set Up Netlify Webhooks
In Netlify dashboard → Site settings → Build & deploy → Deploy notifications:

1. Add notification: "Outgoing webhook"
2. Event: "Deploy succeeded"
3. URL: `https://YOUR_SITE.netlify.app/.netlify/functions/alert-webhook-processor`
4. Add notification: "Deploy failed"
5. URL: `https://YOUR_SITE.netlify.app/.netlify/functions/alert-webhook-processor`

### 6.2 Test Webhook
Trigger a deployment and verify webhook calls are received.
