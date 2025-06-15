
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

const db = admin.firestore();

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Parse the webhook payload from Netlify
    const payload = JSON.parse(event.body);
    
    // Extract relevant information
    const {
      site_id: siteId,
      site_name: siteName,
      deploy_id: deployId,
      state,
      error_message: errorMessage,
      commit_ref: commitRef,
      branch
    } = payload;

    // Determine alert type and message based on deploy state
    let alertType;
    let alertMessage;

    switch (state) {
      case 'error':
        alertType = 'deploy_failed';
        alertMessage = `Deployment failed for ${siteName}`;
        break;
      case 'ready':
        alertType = 'deploy_succeeded';
        alertMessage = `Deployment succeeded for ${siteName}`;
        break;
      case 'building':
        alertType = 'build_started';
        alertMessage = `Build started for ${siteName}`;
        break;
      default:
        // Only process specific states
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'State not monitored' })
        };
    }

    // Create alert document in Firestore
    const alertData = {
      siteId,
      siteName,
      deployId,
      type: alertType,
      message: alertMessage,
      timestamp: admin.firestore.Timestamp.now(),
      readStatus: false,
      metadata: {
        state,
        errorMessage,
        commitRef,
        branch
      }
    };

    // Add alert to Firestore
    const alertRef = await db.collection('alerts').add(alertData);
    console.log('Alert created:', alertRef.id);

    // Trigger email notification for failed deployments
    if (alertType === 'deploy_failed') {
      try {
        // Call the email sender function
        const emailResponse = await fetch(`${process.env.URL}/.netlify/functions/email-sender`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alertId: alertRef.id,
            alertData
          })
        });

        if (!emailResponse.ok) {
          console.error('Failed to send email notification');
        }
      } catch (emailError) {
        console.error('Email notification error:', emailError);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        alertId: alertRef.id,
        message: 'Alert processed successfully'
      })
    };

  } catch (error) {
    console.error('Alert processor error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
