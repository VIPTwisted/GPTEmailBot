
const { NetlifyAPI } = require('netlify');

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

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Get Netlify access token from environment variables (configured in Netlify site settings)
    const accessToken = process.env.NETLIFY_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error('Netlify access token not configured');
    }

    // Initialize Netlify API client
    const client = new NetlifyAPI(accessToken);
    
    // Parse request body
    const { action, siteId } = JSON.parse(event.body);

    let result;

    switch (action) {
      case 'getSites':
        // Get all sites for the authenticated account
        const sites = await client.listSites();
        result = {
          success: true,
          sites: sites.map(site => ({
            id: site.id,
            name: site.name,
            url: site.url,
            ssl_url: site.ssl_url,
            admin_url: site.admin_url,
            state: site.state,
            created_at: site.created_at,
            updated_at: site.updated_at,
            custom_domain: site.custom_domain,
            domain_aliases: site.domain_aliases
          }))
        };
        break;

      case 'getSiteDetails':
        if (!siteId) throw new Error('Site ID required');
        
        const site = await client.getSite({ siteId });
        result = {
          success: true,
          site: {
            id: site.id,
            name: site.name,
            url: site.url,
            ssl_url: site.ssl_url,
            admin_url: site.admin_url,
            state: site.state,
            created_at: site.created_at,
            updated_at: site.updated_at,
            custom_domain: site.custom_domain,
            build_settings: site.build_settings,
            repo: site.repo
          }
        };
        break;

      case 'getDeployments':
        if (!siteId) throw new Error('Site ID required');
        
        const deployments = await client.listSiteDeploys({ siteId });
        result = {
          success: true,
          deployments: deployments.slice(0, 10).map(deploy => ({
            id: deploy.id,
            state: deploy.state,
            created_at: deploy.created_at,
            updated_at: deploy.updated_at,
            deploy_time: deploy.deploy_time,
            branch: deploy.branch,
            commit_ref: deploy.commit_ref,
            commit_url: deploy.commit_url,
            deploy_url: deploy.deploy_url,
            summary: deploy.summary,
            error_message: deploy.error_message
          }))
        };
        break;

      case 'triggerDeploy':
        if (!siteId) throw new Error('Site ID required');
        
        const deployment = await client.createSiteBuild({ siteId });
        result = {
          success: true,
          deployment: {
            id: deployment.id,
            state: deployment.state,
            created_at: deployment.created_at
          }
        };
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Netlify API Proxy Error:', error);
    
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
