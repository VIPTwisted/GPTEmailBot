
const { NetlifyAPI } = require('netlify');
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
  try {
    console.log('Starting scheduled monitoring...');

    // Get Netlify access token
    const accessToken = process.env.NETLIFY_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error('Netlify access token not configured');
    }

    // Initialize Netlify API client
    const client = new NetlifyAPI(accessToken);

    // Get all sites
    const sites = await client.listSites();
    console.log(`Monitoring ${sites.length} sites`);

    // Check each site for recent deployments
    for (const site of sites) {
      try {
        // Get recent deployments for the site
        const deployments = await client.listSiteDeploys({ 
          siteId: site.id,
          per_page: 5 
        });

        if (deployments.length === 0) continue;

        const latestDeploy = deployments[0];
        
        // Check if this deployment needs attention
        if (latestDeploy.state === 'error') {
          // Check if we already have an alert for this deployment
          const existingAlert = await db.collection('alerts')
            .where('deployId', '==', latestDeploy.id)
            .where('type', '==', 'deploy_failed')
            .get();

          if (existingAlert.empty) {
            // Create new alert for failed deployment
            const alertData = {
              siteId: site.id,
              siteName: site.name,
              deployId: latestDeploy.id,
              type: 'deploy_failed',
              message: `Deployment failed for ${site.name}`,
              timestamp: admin.firestore.Timestamp.now(),
              readStatus: false,
              metadata: {
                state: latestDeploy.state,
                errorMessage: latestDeploy.error_message,
                commitRef: latestDeploy.commit_ref,
                branch: latestDeploy.branch
              }
            };

            await db.collection('alerts').add(alertData);
            console.log(`Created alert for failed deployment: ${site.name}`);

            // Trigger email notification
            try {
              await fetch(`${process.env.URL}/.netlify/functions/email-sender`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  alertId: 'scheduled-monitor',
                  alertData
                })
              });
            } catch (emailError) {
              console.error('Failed to send email:', emailError);
            }
          }
        }

        // Check for long-running builds (building for more than 15 minutes)
        if (latestDeploy.state === 'building') {
          const deployTime = new Date(latestDeploy.created_at);
          const now = new Date();
          const minutesElapsed = (now - deployTime) / (1000 * 60);

          if (minutesElapsed > 15) {
            // Check if we already have an alert for this long-running build
            const existingAlert = await db.collection('alerts')
              .where('deployId', '==', latestDeploy.id)
              .where('type', '==', 'build_timeout')
              .get();

            if (existingAlert.empty) {
              const alertData = {
                siteId: site.id,
                siteName: site.name,
                deployId: latestDeploy.id,
                type: 'build_timeout',
                message: `Build running for ${Math.round(minutesElapsed)} minutes: ${site.name}`,
                timestamp: admin.firestore.Timestamp.now(),
                readStatus: false,
                metadata: {
                  state: latestDeploy.state,
                  minutesElapsed: Math.round(minutesElapsed),
                  commitRef: latestDeploy.commit_ref,
                  branch: latestDeploy.branch
                }
              };

              await db.collection('alerts').add(alertData);
              console.log(`Created timeout alert for: ${site.name}`);
            }
          }
        }

      } catch (siteError) {
        console.error(`Error checking site ${site.name}:`, siteError);
      }
    }

    console.log('Scheduled monitoring completed');

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Monitoring completed',
        sitesChecked: sites.length
      })
    };

  } catch (error) {
    console.error('Scheduled monitor error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
