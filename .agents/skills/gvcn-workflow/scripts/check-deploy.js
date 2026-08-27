#!/usr/bin/env node

/**
 * Script to check the latest Vercel deployment status for GVCN Pro
 */
const https = require('https');

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || process.env.VERCEL_ACCESS_TOKEN || '';
const PROJECT_ID = 'prj_WRY7j9gepdqOFQPN3ygnmwD60Mz2';
const TEAM_ID = 'team_2yh3CpurkFhBq4AK3croKlxd';

if (!VERCEL_TOKEN) {
  console.log('=== VERCEL DEPLOYMENT INFO ===');
  console.log('Project ID : ' + PROJECT_ID);
  console.log('Team ID    : ' + TEAM_ID);
  console.log('Prod URL   : https://gvcn-eta.vercel.app');
  console.log('To query live status via API, set VERCEL_TOKEN environment variable or use the Vercel MCP list_deployments tool.');
  console.log('==============================');
  process.exit(0);
}

const req = https.request(
  'https://mcp.vercel.com',
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    },
  },
  (res) => {
    let raw = '';
    res.on('data', (chunk) => (raw += chunk));
    res.on('end', () => {
      const lines = raw.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const json = JSON.parse(line.slice(6));
            if (json.result && json.result.content) {
              const data = JSON.parse(json.result.content[0].text);
              const latest = data.deployments.deployments[0];
              console.log('=== VERCEL DEPLOYMENT STATUS ===');
              console.log('Commit   :', latest.meta?.githubCommitMessage || 'N/A');
              console.log('State    :', latest.state);
              console.log('Branch   :', latest.meta?.githubCommitRef || 'main');
              console.log('Preview  :', `https://${latest.url}`);
              console.log('Prod URL :', 'https://gvcn-eta.vercel.app');
              console.log('================================');
              process.exit(latest.state === 'READY' ? 0 : latest.state === 'ERROR' ? 1 : 2);
            }
          } catch (e) {}
        }
      }
    });
  }
);

req.on('error', (e) => {
  console.error('Error contacting Vercel MCP:', e.message);
  process.exit(1);
});

req.write(
  JSON.stringify({
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'list_deployments',
      arguments: {
        projectId: PROJECT_ID,
        teamId: TEAM_ID,
        limit: 1,
      },
    },
    id: 1,
  })
);
req.end();
