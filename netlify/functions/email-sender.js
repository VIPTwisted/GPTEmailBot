
const sgMail = require('@sendgrid/mail');

// Set SendGrid API key from environment variables
sgMail.setApiKey(process.env.EMAIL_API_KEY);

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
    const { alertId, alertData } = JSON.parse(event.body);
    
    // Get admin email from environment variables
    const adminEmail = process.env.ADMIN_EMAIL;
    const fromEmail = process.env.FROM_EMAIL || 'alerts@netlify-dashboard.com';
    
    if (!adminEmail) {
      throw new Error('Admin email not configured');
    }

    if (!process.env.EMAIL_API_KEY) {
      throw new Error('Email API key not configured');
    }

    // Prepare email content based on alert type
    let subject, htmlContent;

    switch (alertData.type) {
      case 'deploy_failed':
        subject = `🚨 Deployment Failed: ${alertData.siteName}`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #dc2626; margin: 0 0 10px 0;">Deployment Failed</h2>
              <p style="margin: 0; font-size: 16px;">Your Netlify site deployment has failed.</p>
            </div>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
              <h3 style="margin: 0 0 15px 0; color: #374151;">Details:</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li><strong>Site:</strong> ${alertData.siteName}</li>
                <li><strong>Deploy ID:</strong> ${alertData.deployId}</li>
                <li><strong>Time:</strong> ${new Date(alertData.timestamp.seconds * 1000).toLocaleString()}</li>
                ${alertData.metadata.branch ? `<li><strong>Branch:</strong> ${alertData.metadata.branch}</li>` : ''}
                ${alertData.metadata.commitRef ? `<li><strong>Commit:</strong> ${alertData.metadata.commitRef.substring(0, 8)}</li>` : ''}
                ${alertData.metadata.errorMessage ? `<li><strong>Error:</strong> ${alertData.metadata.errorMessage}</li>` : ''}
              </ul>
            </div>
            
            <div style="margin-top: 20px; text-align: center;">
              <a href="${process.env.URL}/alerts" 
                 style="background: #3b82f6; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 6px; display: inline-block;">
                View Dashboard
              </a>
            </div>
            
            <div style="margin-top: 20px; font-size: 12px; color: #6b7280; text-align: center;">
              <p>This is an automated alert from your Netlify Dashboard.</p>
            </div>
          </div>
        `;
        break;

      case 'deploy_succeeded':
        subject = `✅ Deployment Successful: ${alertData.siteName}`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #16a34a; margin: 0 0 10px 0;">Deployment Successful</h2>
              <p style="margin: 0; font-size: 16px;">Your Netlify site has been successfully deployed.</p>
            </div>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
              <h3 style="margin: 0 0 15px 0; color: #374151;">Details:</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li><strong>Site:</strong> ${alertData.siteName}</li>
                <li><strong>Deploy ID:</strong> ${alertData.deployId}</li>
                <li><strong>Time:</strong> ${new Date(alertData.timestamp.seconds * 1000).toLocaleString()}</li>
                ${alertData.metadata.branch ? `<li><strong>Branch:</strong> ${alertData.metadata.branch}</li>` : ''}
                ${alertData.metadata.commitRef ? `<li><strong>Commit:</strong> ${alertData.metadata.commitRef.substring(0, 8)}</li>` : ''}
              </ul>
            </div>
          </div>
        `;
        break;

      default:
        // Don't send emails for other alert types
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Email not sent for this alert type' })
        };
    }

    // Prepare email message
    const msg = {
      to: adminEmail,
      from: fromEmail,
      subject: subject,
      html: htmlContent
    };

    // Send email
    await sgMail.send(msg);
    console.log(`Email sent successfully for alert ${alertId}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Email sent successfully'
      })
    };

  } catch (error) {
    console.error('Email sender error:', error);
    
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
