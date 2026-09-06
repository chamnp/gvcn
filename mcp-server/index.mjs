#!/usr/bin/env node

/**
 * GVCN Pro - Official Model Context Protocol (MCP) Stdio Server
 * 
 * Standalone stdio connector for Claude Desktop, Cursor, Windsurf, OpenCode,
 * and any other MCP-compliant client.
 * 
 * Usage:
 *   GVCN_API_KEY="gvcn_pat_..." node mcp-server/index.mjs
 */

import readline from 'readline';

const API_URL = process.env.GVCN_API_URL || 'https://www.gvcn.pro.vn/api/mcp';
const API_KEY = process.env.GVCN_API_KEY || '';

if (!API_KEY) {
  process.stderr.write(`[gvcn-mcp] LỖI: Thiếu biến môi trường GVCN_API_KEY. Vui lòng cung cấp khóa Personal Access Token hợp lệ.\n`);
  process.stderr.write(`[gvcn-mcp] Hướng dẫn: Tạo khóa tại Cài Đặt > Khóa API (MCP) trên https://www.gvcn.pro.vn\n`);
  process.exit(1);
}

process.stderr.write(`[gvcn-mcp] Server starting...\n`);
process.stderr.write(`[gvcn-mcp] Connecting to upstream: ${API_URL}\n`);

async function forwardToUpstream(body) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        jsonrpc: '2.0',
        id: body.id,
        error: {
          code: -32000,
          message: `Upstream error (${res.status}): ${errText}`,
        },
      };
    }

    return await res.json();
  } catch (err) {
    return {
      jsonrpc: '2.0',
      id: body.id,
      error: {
        code: -32603,
        message: `Failed to communicate with GVCN API: ${err.message}`,
      },
    };
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on('line', async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  try {
    const request = JSON.parse(trimmed);

    // Ignore notifications without id
    if (request.id === undefined && request.method) {
      if (request.method === 'notifications/initialized') {
        process.stderr.write('[gvcn-mcp] Client initialized notification received.\n');
      }
      return;
    }

    // Forward JSON-RPC request to GVCN Pro MCP API
    const response = await forwardToUpstream(request);

    // Send single-line JSON response back to stdout
    process.stdout.write(JSON.stringify(response) + '\n');
  } catch (err) {
    process.stderr.write(`[gvcn-mcp] Error processing request: ${err.message}\n`);
    const errorResponse = {
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32700,
        message: 'Parse error: invalid JSON input',
      },
    };
    process.stdout.write(JSON.stringify(errorResponse) + '\n');
  }
});

process.on('SIGINT', () => {
  process.stderr.write('[gvcn-mcp] Shutting down...\n');
  process.exit(0);
});
