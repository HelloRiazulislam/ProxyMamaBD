import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import cron from "node-cron";
import admin from "firebase-admin";
import { RouterOSAPI } from "node-routeros";
import yaml from "js-yaml";

dotenv.config();

// Initialize Firebase Admin
let db: any = null;
const initFirebase = () => {
  try {
    if (!admin.apps || admin.apps.length === 0) {
      admin.initializeApp();
    }
    db = admin.firestore();
    console.log("Firebase Admin initialized successfully.");
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
};

initFirebase();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Clash Subscription Handler
  const handleSub = async (req: express.Request, res: express.Response) => {
    // Re-init if db is lost for some reason
    if (!db) {
      initFirebase();
    }
    
    // Extract token from params or path as a fallback
    let token = req.params.token;
    if (!token || token === 'sub' || token === 'clash' || token === 'api') {
      const parts = req.path.split('/').filter(Boolean);
      token = parts[parts.length - 1];
    }

    console.log(`[Subscription] Request for token: ${token} from ${req.ip} (Path: ${req.path}, UA: ${req.get('User-Agent')})`);
    
    // Force YAML content type immediately and prevent sniffing
    res.setHeader("Content-Type", "text/yaml; charset=utf-8");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Content-Disposition", `attachment; filename="proxymama.yaml"`);
    res.setHeader("Access-Control-Allow-Origin", "*"); // Allow cross-origin for Clash clients

    if (!db) {
      return res.status(200).send("# error: Database not initialized\n# Please try again in a few seconds.");
    }

    if (!token || token === 'api' || token === 'sub' || token === 'clash') {
      return res.status(200).send("# error: Token missing or invalid path");
    }

    try {
      // 1. Find User Subscription
      const subQuery = await db.collection("userClashSubscriptions")
        .where("token", "==", token)
        .where("status", "==", "active")
        .limit(1)
        .get();

      if (subQuery.empty) {
        return res.status(200).send("# error: Subscription not found or inactive");
      }

      const subDoc = subQuery.docs[0];
      const subData = subDoc.data();

      // 2. Check Expiry
      const expiryDate = new Date(subData.expiryDate);
      
      // Add Clash specific headers for usage info
      const totalTraffic = 1000 * 1024 * 1024 * 1024; // 1TB dummy
      const usedTraffic = 0;
      const expiryTimestamp = Math.floor(expiryDate.getTime() / 1000);
      res.setHeader("Subscription-Userinfo", `upload=${usedTraffic}; download=${usedTraffic}; total=${totalTraffic}; expire=${expiryTimestamp}`);

      if (expiryDate < new Date()) {
        await subDoc.ref.update({ status: "expired" });
        return res.status(200).send("# error: Subscription expired");
      }

      // 3. Get Plan Details
      const planSnap = await db.collection("clashSubscriptionPlans").doc(subData.planId).get();
      if (!planSnap.exists) {
        return res.status(200).send("# error: Plan details not found");
      }

      const planData = planSnap.data();

      // 4. Check for Structured Proxy List (Primary)
      if (planData.proxies && Array.isArray(planData.proxies) && planData.proxies.length > 0) {
        try {
          const proxies = planData.proxies
            .filter((p: any) => p && p.server && p.port)
            .map((p: any, idx: number) => {
              const name = String(p.name || `Node-${idx + 1}`).trim().replace(/[":]/g, '').replace(/[^\x20-\x7E]/g, '');
              const type = String(p.type || "socks5").toLowerCase().trim();
              const server = String(p.server).trim();
              const port = parseInt(String(p.port)) || 1080;
              
              let block = `- name: "${name}"\n`;
              block += `  type: ${type}\n`;
              block += `  server: ${server}\n`;
              block += `  port: ${port}\n`;
              if (p.username) block += `  username: ${String(p.username).trim()}\n`;
              if (p.password) block += `  password: ${String(p.password).trim()}\n`;
              if (p.uuid) block += `  uuid: ${String(p.uuid).trim()}\n`;
              if (p.alterId) block += `  alterId: ${parseInt(String(p.alterId))}\n`;
              if (p.cipher) block += `  cipher: ${String(p.cipher).trim()}\n`;
              if (p.tls) block += `  tls: true\n`;
              block += `  udp: true`;
              
              return { name, block };
            });

          const proxyLines = proxies.map(p => p.block).join('\n');
          const proxyListForGroups = proxies.map(p => `  - "${p.name}"`).join('\n');

          const finalYaml = `proxies:
${proxyLines}

proxy-groups:
- name: ProxyMama-Main
  type: select
  proxies:
  - Auto-Select
${proxyListForGroups}

- name: Auto-Select
  type: url-test
  url: http://www.gstatic.com/generate_204
  interval: 300
  proxies:
${proxyListForGroups}

rules:
- MATCH,ProxyMama-Main`;

          console.log(`[YAML Debug] Generated Flat YAML for token ${token}`);

          res.setHeader('Content-Type', 'text/yaml; charset=utf-8');
          res.setHeader('Subscription-Userinfo', `upload=0; download=0; total=${(planData.bandwidthLimit || 1000) * 1024 * 1024 * 1024}; expire=${expiryTimestamp}`);
          
          return res.status(200).send(Buffer.from(finalYaml.replace(/\t/g, '  '), 'utf-8'));
        } catch (error) {
          console.error("Clash YAML Generation Error:", error);
        }
      }

      // 5. Check for V2Ray Links (Secondary)
      if (planData.v2rayLinks && planData.v2rayLinks.trim()) {
        try {
          const links = planData.v2rayLinks
            .split('\n')
            .map((l: string) => l.trim())
            .filter((l: string) => l.length > 0)
            .join('\n');
          
          const base64Sub = Buffer.from(links).toString('base64');

          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.setHeader('Subscription-Userinfo', `upload=0; download=0; total=${(planData.bandwidthLimit || 1000) * 1024 * 1024 * 1024}; expire=${expiryTimestamp}`);
          
          return res.status(200).send(base64Sub);
        } catch (error) {
          console.error("V2Ray Sub Generation Error:", error);
          return res.status(200).send("# error: V2Ray subscription generation failed");
        }
      }

      // 5. Check for Legacy Custom Raw YAML Config (Fallback if still exists in DB)
      const rawConfig = planData.rawConfig || planData.v2rayLinks; // Fallback to v2rayLinks if rawConfig is missing but it's actually YAML
      if (rawConfig && rawConfig.trim() && (rawConfig.includes('proxies:') || rawConfig.includes('proxy-groups:'))) {
        try {
          // Pre-process: Replace tabs with spaces and remove common invisible characters
          let raw = rawConfig
            .replace(/\t/g, '  ') // Replace tabs with 2 spaces
            .replace(/\r\n/g, '\n') // Normalize line endings
            .replace(/\r/g, '\n')
            .replace(/[\u200B-\u200D\uFEFF]/g, ''); // Remove zero-width spaces
          
          // Normalize the YAML to fix indentation, tabs, or hidden characters
          const parsedConfig = yaml.load(raw);
          
          if (typeof parsedConfig !== 'object' || parsedConfig === null) {
            throw new Error("Invalid YAML structure: Root must be an object");
          }

          const normalizedYaml = yaml.dump(parsedConfig, {
            indent: 2,
            lineWidth: -1,
            noRefs: true,
            quotingType: '"',
            forceQuotes: false,
            noCompatMode: true,
            sortKeys: false
          });

          res.setHeader('Content-Type', 'text/yaml; charset=utf-8');
          res.setHeader('Subscription-Userinfo', `upload=0; download=0; total=${(planData.bandwidthLimit || 1000) * 1024 * 1024 * 1024}; expire=${expiryTimestamp}`);
          
          const header = `# Clash Config Generated by ProxyMama\n# Token: ${token}\n# Expiry: ${expiryDate.toISOString()}\n\n`;
          // Send as buffer to ensure no encoding issues
          return res.status(200).send(Buffer.from(header + normalizedYaml, 'utf-8'));
        } catch (yamlError: any) {
          console.error("Raw YAML Parsing Error:", yamlError);
          return res.status(200).send(Buffer.from(rawConfig.trim(), 'utf-8'));
        }
      }

      // 6. Generate Clash YAML (Default Fallback)
      try {
        const proxies = (planData.proxies || [])
          .filter((p: any) => p && p.server && p.port)
          .map((p: any, idx: number) => {
            const proxy: any = {
              name: String(p.name || `Node-${idx + 1}`).trim().replace(/:/g, '-').replace(/["']/g, ''),
              type: String(p.type || "socks5").toLowerCase().trim(),
              server: String(p.server).trim(),
              port: parseInt(String(p.port)),
            };

            // Add optional fields carefully
            if (p.username) proxy.username = String(p.username).trim();
            if (p.password) proxy.password = String(p.password).trim();
            if (p.uuid) proxy.uuid = String(p.uuid).trim();
            if (p.alterId !== undefined) proxy.alterId = parseInt(String(p.alterId));
            if (p.cipher) proxy.cipher = String(p.cipher).trim();
            if (p.sni) proxy.sni = String(p.sni).trim();
            
            // Boolean fields
            if (p.tls === true || p.tls === "true") proxy.tls = true;
            if (p.udp === true || p.udp === "true" || p.udp === undefined) proxy.udp = true;
            
            return proxy;
          });

        if (proxies.length === 0) {
          proxies.push({
            name: "No-Proxies-Available",
            type: "socks5",
            server: "127.0.0.1",
            port: 1080
          });
        }

        const proxyNames = proxies.map(p => p.name);

        const clashConfig: any = {
          port: 7890,
          "socks-port": 7891,
          "redir-port": 7892,
          "mixed-port": 7893,
          "allow-lan": true,
          mode: "rule",
          "log-level": "info",
          "external-controller": "127.0.0.1:9090",
          proxies: proxies,
          "proxy-groups": [
            {
              name: "ProxyMama-Main",
              type: "select",
              proxies: ["Auto-Select", "Manual-Select", ...proxyNames]
            },
            {
              name: "Manual-Select",
              type: "select",
              proxies: proxyNames
            },
            {
              name: "Auto-Select",
              type: "url-test",
              url: "http://www.gstatic.com/generate_204",
              interval: 300,
              proxies: proxyNames
            }
          ],
          rules: [
            "MATCH,ProxyMama-Main"
          ]
        };

        const yamlContent = yaml.dump(clashConfig, {
          indent: 2,
          lineWidth: -1,
          noRefs: true,
          sortKeys: false, // Keep our order
          quotingType: '"'
        });
        
        res.setHeader('Content-Type', 'text/yaml; charset=utf-8');
        res.setHeader('Subscription-Userinfo', `upload=0; download=0; total=${planData.bandwidthLimit * 1024 * 1024 * 1024}; expire=${planData.expiresAt?.seconds || 0}`);
        
        res.status(200).send(`# ProxyMama Config\n# Generated: ${new Date().toISOString()}\n${yamlContent}`);
      } catch (yamlError) {
        console.error("YAML Generation Error:", yamlError);
        res.status(200).send("# error: YAML generation failed");
      }

    } catch (error) {
      console.error("Subscription Error:", error);
      res.status(200).send("# error: Internal server error");
    }
  };

  // 2. Subscription Middleware - ABSOLUTE TOP
  app.use((req, res, next) => {
    const path = req.path;
    // Match /sub/TOKEN, /api/sub/TOKEN, /clash/TOKEN
    const match = path.match(/^\/(?:api\/)?(?:sub|clash)\/([^\/]+)/);
    if (match) {
      const token = match[1];
      if (token !== 'api' && token !== 'sub' && token !== 'clash') {
        req.params = { token };
        return handleSub(req, res);
      }
    }
    next();
  });

  app.use(express.json());

  // MikroTik API Helper
  const mikrotikRequest = async (config: any, method: string, path: string, data?: any) => {
    const { host, port, username, password, useSsl } = config;
    const protocol = useSsl ? "https" : "http";
    const url = `${protocol}://${host}:${port}/rest${path}`;
    
    console.log(`MikroTik Request: ${method.toUpperCase()} ${url}`);

    return axios({
      method,
      url,
      auth: { username, password },
      data,
      timeout: 15000,
      httpsAgent: new (await import("https")).Agent({ rejectUnauthorized: false })
    });
  };

  // Legacy API Helper (for v6)
  const mikrotikLegacyRequest = async (config: any, command: string, params: any = {}) => {
    const { host, apiPort, username, password } = config;
    const port = apiPort || 8728;
    
    console.log(`[MikroTik] Legacy Request: ${command} on ${host}:${port}`);

    const api = new RouterOSAPI({
      host,
      port,
      user: username,
      password,
      timeout: 10
    });

    try {
      await api.connect();
      
      // Build command array for node-routeros to handle queries (?) and parameters (=) correctly
      const cmdArray = [command];
      for (const [key, value] of Object.entries(params)) {
        if (key.startsWith('?')) {
          cmdArray.push(`${key}=${value}`);
        } else if (key.startsWith('.')) {
          cmdArray.push(`=${key}=${value}`);
        } else {
          cmdArray.push(`=${key}=${value}`);
        }
      }

      const result = await api.write(cmdArray);
      await api.close();
      return result;
    } catch (err) {
      await api.close();
      throw err;
    }
  };

  // Helper to find the correct SOCKS user path (plural vs singular)
  const findSocksUserPath = async (config: any) => {
    const paths = ["/ip/socks/users", "/ip/socks/user"];
    for (const path of paths) {
      try {
        await mikrotikRequest(config, "get", path);
        return path;
      } catch (err: any) {
        const status = err.response?.status;
        if (status === 404 || status === 405) {
          continue;
        }
        if (status === 401 || status === 403) {
          return path;
        }
      }
    }
    return "/ip/socks/users"; // Default fallback
  };

  // Activity Logs Search & Filter
  app.get("/api/activity-logs", async (req, res) => {
    if (!db) return res.status(500).send("Database not initialized");
    try {
      const { search, action, limit: limitVal = 100 } = req.query;
      let q = db.collection("activityLogs").orderBy("createdAt", "desc").limit(Number(limitVal));
      
      if (action && action !== 'all') {
        q = q.where("action", "==", action);
      }
      
      const snap = await q.get();
      let logs = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      
      if (search) {
        const term = String(search).toLowerCase();
        logs = logs.filter((l: any) => 
          (l.userEmail && l.userEmail.toLowerCase().includes(term)) ||
          (l.details && l.details.toLowerCase().includes(term)) ||
          (l.action && l.action.toLowerCase().includes(term))
        );
      }
      
      res.json(logs);
    } catch (error) {
      res.status(500).send("Error fetching logs");
    }
  });

  // Health check for MikroTik API
  app.get("/api/mikrotik/ping", (req, res) => {
    res.json({ success: true, message: "MikroTik API is alive" });
  });

  app.get("/api/server-ip", async (req, res) => {
    try {
      const response = await axios.get('https://api.ipify.org?format=json');
      res.json({ ip: response.data.ip });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch server IP" });
    }
  });

  // API to test MikroTik connection
  app.post("/api/mikrotik/test", async (req, res) => {
    const config = req.body;
    console.log(`[MikroTik] Testing connection to ${config.host}:${config.port}`);
    try {
      // Try REST API first (v7)
      try {
        const identity = await mikrotikRequest(config, "get", "/system/identity");
        const resource = await mikrotikRequest(config, "get", "/system/resource");
        
        return res.json({ 
          success: true, 
          isLegacy: false,
          data: {
            identity: identity.data,
            resource: resource.data
          }
        });
      } catch (restErr: any) {
        console.log(`[MikroTik] REST API test failed: ${restErr.message}`);
        // If 404, 501, connection refused, or timeout, it's likely v6 or legacy API needed
        if (
          restErr.response?.status === 404 || 
          restErr.response?.status === 501 || 
          restErr.response?.status === 405 ||
          (restErr.response?.status === 400 && restErr.response?.data?.message === "no such command") ||
          restErr.code === 'ECONNREFUSED' || 
          restErr.code === 'ETIMEDOUT' || 
          restErr.message.includes('timeout') ||
          restErr.message.includes('no such command')
        ) {
          console.log("[MikroTik] Trying legacy API test...");
          const identity = await mikrotikLegacyRequest(config, "/system/identity/print");
          const resource = await mikrotikLegacyRequest(config, "/system/resource/print");
          
          return res.json({
            success: true,
            isLegacy: true,
            data: {
              identity: identity[0],
              resource: resource[0]
            }
          });
        }
        throw restErr;
      }
    } catch (error: any) {
      console.error("[MikroTik] Test Connection Error:", error.message);
      res.status(500).json({ success: false, error: error.response?.data?.message || error.message || "Connection failed" });
    }
  });

  // Helper to verify if a user exists on MikroTik
  const verifyUserExists = async (config: any, username: string, userPath: string) => {
    try {
      console.log(`[MikroTik] Verifying user ${username} on path ${userPath}...`);
      const response = await mikrotikRequest(config, "get", userPath);
      const users = Array.isArray(response.data) ? response.data : [response.data];
      const found = users.find((u: any) => u && u.name === username);
      if (found) {
        console.log(`[MikroTik] Verification SUCCESS: User ${username} found.`);
        return true;
      }
      console.log(`[MikroTik] Verification FAILED: User ${username} not found in list.`, JSON.stringify(users));
      return false;
    } catch (err: any) {
      console.error(`[MikroTik] Verification error for ${username}:`, err.message);
      return false;
    }
  };

  // Helper to verify if a user exists via Legacy API
  const verifyUserExistsLegacy = async (config: any, username: string) => {
    try {
      console.log(`[MikroTik] Legacy: Verifying user ${username}...`);
      let users = [];
      try {
        users = await mikrotikLegacyRequest(config, "/ip/socks/users/print", { "?name": username });
      } catch (e) {
        users = await mikrotikLegacyRequest(config, "/ip/socks/user/print", { "?name": username });
      }
      const found = Array.isArray(users) && users.length > 0;
      if (found) {
        console.log(`[MikroTik] Legacy Verification SUCCESS: User ${username} found.`);
        return true;
      }
      console.log(`[MikroTik] Legacy Verification FAILED: User ${username} not found.`);
      return false;
    } catch (err: any) {
      console.error(`[MikroTik] Legacy Verification error for ${username}:`, err.message);
      return false;
    }
  };

  // API to create/update SOCKS5 proxy on MikroTik
  app.post("/api/mikrotik/create-proxy", async (req, res) => {
    const { config, proxyData } = req.body;
    // Use user-provided credentials for the SOCKS user
    // But use config (admin) credentials for the MikroTik API connection (handled in mikrotikRequest)
    const { username: targetUsername, password: targetPassword, speedLimit } = proxyData;

    if (!targetUsername || !targetPassword) {
      return res.status(400).json({ success: false, error: "Username and Password are required for SOCKS5 proxy." });
    }

    console.log(`[MikroTik] Create Proxy Request for ${targetUsername} on ${config.host}`);

    try {
      // Try REST API first
      try {
        // 1. Discover paths
        const userPath = await findSocksUserPath(config);
        console.log(`[MikroTik] Using user path: ${userPath}`);

        // 2. Ensure SOCKS service is enabled and configured
        try {
          let settingsPath = "/ip/socks";
          let socksData = null;
          
          try {
            const res = await mikrotikRequest(config, "get", "/ip/socks");
            socksData = Array.isArray(res.data) ? res.data[0] : res.data;
          } catch (e: any) {
            if (e.response?.data?.message === "no such command" || e.response?.status === 404) {
              const res = await mikrotikRequest(config, "get", "/ip/socks/settings");
              socksData = Array.isArray(res.data) ? res.data[0] : res.data;
              settingsPath = "/ip/socks/settings";
            } else {
              throw e;
            }
          }

          console.log(`[MikroTik] SOCKS settings path: ${settingsPath}`);
          
          if (!socksData?.enabled || socksData?.port !== (config.socksPort || "1080") || socksData?.["auth-method"] !== "password") {
            const patchData = {
              enabled: "yes",
              port: config.socksPort || "1080",
              "auth-method": "password"
            };
            
            console.log(`[MikroTik] Updating SOCKS settings...`);
            try {
              await mikrotikRequest(config, "patch", settingsPath, patchData);
            } catch (patchErr: any) {
              if (patchErr.response?.status === 405) {
                await mikrotikRequest(config, "put", settingsPath, patchData);
              } else {
                throw patchErr;
              }
            }
          }
        } catch (err: any) {
          console.warn("[MikroTik] SOCKS service configuration warning (skipping):", err.response?.data || err.message);
        }

        // 3. Check if user already exists
        let existingUser = null;
        try {
          const usersList = await mikrotikRequest(config, "get", userPath);
          if (usersList.data && Array.isArray(usersList.data)) {
            existingUser = usersList.data.find((u: any) => u.name === targetUsername);
          }
        } catch (err: any) {
          const status = err.response?.status;
          const message = err.response?.data?.message || "";
          console.warn(`[MikroTik] Could not fetch SOCKS users list from ${userPath}:`, status, message);
          
          if (message === "no such command" || status === 404 || status === 405) {
            const error: any = new Error(`SOCKS users menu not found at ${userPath}.`);
            error.isMenuNotFound = true;
            throw error;
          }
          throw err;
        }

        const payload: any = {
          name: targetUsername,
          password: targetPassword,
          comment: `user:${targetUsername}`
        };

        if (speedLimit) {
          payload["rate-limit"] = speedLimit;
        }

        try {
          if (existingUser) {
            console.log(`[MikroTik] Updating existing user ${targetUsername} via REST...`);
            const updatePath = `${userPath}/${existingUser[".id"]}`;
            try {
              await mikrotikRequest(config, "patch", updatePath, payload);
            } catch (patchErr: any) {
              if (patchErr.response?.status === 405) {
                await mikrotikRequest(config, "put", updatePath, payload);
              } else {
                throw patchErr;
              }
            }
          } else {
            console.log(`[MikroTik] Creating new user ${targetUsername} via REST...`);
            await mikrotikRequest(config, "post", userPath, payload);
          }
        } catch (err: any) {
          // Fallback: If rate-limit is not supported, try without it
          if (speedLimit && (err.response?.status === 400 || err.message.includes("400"))) {
            console.warn(`[MikroTik] Rate-limit not supported, retrying without it...`);
            delete payload["rate-limit"];
            if (existingUser) {
              const updatePath = `${userPath}/${existingUser[".id"]}`;
              try {
                await mikrotikRequest(config, "patch", updatePath, payload);
              } catch (pErr: any) {
                await mikrotikRequest(config, "put", updatePath, payload);
              }
            } else {
              await mikrotikRequest(config, "post", userPath, payload);
            }
          } else {
            throw err;
          }
        }

        // 4. VERIFICATION: Check if user actually exists now
        await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5s delay
        const isVerified = await verifyUserExists(config, targetUsername, userPath);
        
        if (!isVerified) {
          throw new Error(`Verification failed: User ${targetUsername} was not found on MikroTik after creation attempt. Please check your router settings.`);
        }

        console.log(`[MikroTik] Proxy created and verified successfully via REST`);
        return res.json({ success: true });
      } catch (restErr: any) {
        // If it's an auth error, don't fallback, just throw
        if (restErr.response?.status === 401) {
          return res.status(401).json({ success: false, error: "MikroTik Authentication Failed. Please check your credentials." });
        }

        // Fallback to legacy API if REST fails (404, 501, connection refused, or timeout)
        const isFallbackError = 
          restErr.isMenuNotFound ||
          restErr.response?.status === 404 || 
          restErr.response?.status === 501 || 
          restErr.response?.status === 405 ||
          (restErr.response?.status === 400 && restErr.response?.data?.message === "no such command") ||
          restErr.code === 'ECONNREFUSED' || 
          restErr.code === 'ETIMEDOUT' || 
          restErr.message.includes('timeout') ||
          restErr.message.includes('no such command');

        if (isFallbackError) {
          console.log(`[MikroTik] Info: REST API not available (${restErr.message}), using legacy API...`);
          
          try {
            // 1. Enable SOCKS
            console.log(`[MikroTik] Legacy: Enabling SOCKS...`);
            await mikrotikLegacyRequest(config, "/ip/socks/set", {
              enabled: "yes",
              port: config.socksPort || "1080",
              "auth-method": "password"
            });

            // 2. Check user
            console.log(`[MikroTik] Legacy: Checking for existing user ${targetUsername}...`);
            let users = [];
            try {
              users = await mikrotikLegacyRequest(config, "/ip/socks/users/print", {
                "?name": targetUsername
              });
            } catch (printErr: any) {
              if (printErr.message.includes("no such command")) {
                users = await mikrotikLegacyRequest(config, "/ip/socks/user/print", {
                  "?name": targetUsername
                });
              } else {
                throw printErr;
              }
            }

            const payload: any = {
              name: targetUsername,
              password: targetPassword,
              comment: `user:${targetUsername}`
            };

            if (speedLimit) {
              payload["rate-limit"] = speedLimit;
            }

            const tryLegacyWrite = async (cmd: string, params: any) => {
              try {
                return await mikrotikLegacyRequest(config, cmd, params);
              } catch (err: any) {
                if (err.message.includes("unknown parameter")) {
                  const newParams = { ...params };
                  if ("rate-limit" in newParams) {
                    console.warn(`[MikroTik] Legacy: rate-limit not supported on ${cmd}, retrying without it...`);
                    delete newParams["rate-limit"];
                    return await tryLegacyWrite(cmd, newParams);
                  }
                  if ("comment" in newParams) {
                    console.warn(`[MikroTik] Legacy: comment not supported on ${cmd}, retrying without it...`);
                    delete newParams["comment"];
                    return await tryLegacyWrite(cmd, newParams);
                  }
                }
                throw err;
              }
            };

            if (users && users.length > 0) {
              // Update
              console.log(`[MikroTik] Legacy: Updating user ${targetUsername}...`);
              const updateCmd = users[0].name ? "/ip/socks/users/set" : "/ip/socks/user/set";
              const updateParams: any = {
                ".id": users[0][".id"],
                name: targetUsername,
                password: targetPassword,
                comment: `user:${targetUsername}`
              };
              if (speedLimit) updateParams["rate-limit"] = speedLimit;
              await tryLegacyWrite(updateCmd, updateParams);
            } else {
              // Add
              console.log(`[MikroTik] Legacy: Adding new user ${targetUsername}...`);
              const addParams: any = {
                name: targetUsername,
                password: targetPassword,
                comment: `user:${targetUsername}`
              };
              if (speedLimit) addParams["rate-limit"] = speedLimit;

              try {
                await tryLegacyWrite("/ip/socks/users/add", addParams);
              } catch (addErr: any) {
                if (addErr.message.includes("no such command")) {
                  await tryLegacyWrite("/ip/socks/user/add", addParams);
                } else {
                  throw addErr;
                }
              }
            }

            // 3. VERIFICATION: Check if user actually exists now
            await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5s delay
            const isVerifiedLegacy = await verifyUserExistsLegacy(config, targetUsername);
            
            if (!isVerifiedLegacy) {
              throw new Error(`Legacy Verification failed: User ${targetUsername} was not found on MikroTik after creation attempt. Please check your router settings.`);
            }

            console.log(`[MikroTik] Proxy created and verified successfully via Legacy API`);
            return res.json({ success: true });
          } catch (legacyErr: any) {
            console.error("[MikroTik] Legacy API Error:", legacyErr.message);
            throw legacyErr;
          }
        }
        throw restErr;
      }
    } catch (error: any) {
      const mikrotikError = error.response?.data;
      console.error("MikroTik Create Error Details:", JSON.stringify(mikrotikError || error.message));
      
      let errorMsg = mikrotikError?.message || error.message || "Failed to create proxy on MikroTik";
      if (mikrotikError?.detail) {
        errorMsg += `: ${mikrotikError.detail}`;
      }

      res.status(500).json({ 
        success: false, 
        error: errorMsg,
        debug: mikrotikError 
      });
    }
  });

  // Cron job to check for expired proxies (every hour)
  cron.schedule("0 * * * *", async () => {
    if (!db) return;
    console.log("Running expiry check...");
    
    try {
      const now = new Date().toISOString();
      const expiredProxies = await db.collection("autoProxies")
        .where("status", "==", "active")
        .where("expiryDate", "<", now)
        .get();

      if (expiredProxies.empty) return;

      // Get MikroTik config from proxy data (routerId)
      for (const doc of expiredProxies.docs) {
        const proxy = doc.data();
        try {
          // Get router config
          const routerSnap = await db.collection("mikrotikRouters").doc(proxy.routerId).get();
          const config = routerSnap.data();

          if (!config) {
            console.error(`Router config not found for ID: ${proxy.routerId}`);
            continue;
          }

          // Disable on MikroTik only if no other active proxies are using this router and username
          const otherActiveProxies = await db.collection("autoProxies")
            .where("routerId", "==", proxy.routerId)
            .where("username", "==", proxy.username)
            .where("status", "==", "active")
            .get();

          if (otherActiveProxies.empty) {
            console.log(`[Expiry] Last active proxy for ${proxy.username} on router ${proxy.routerId} expired. Disabling on MikroTik.`);
            const userPath = await findSocksUserPath(config);
            try {
              const userList = await mikrotikRequest(config, "get", userPath);
              const user = userList.data.find((u: any) => u.name === proxy.username);
              if (user) {
                await mikrotikRequest(config, "delete", `${userPath}/${user[".id"]}`);
              }
            } catch (err: any) {
              // Fallback to legacy if REST fails
              try {
                let users = [];
                try {
                  users = await mikrotikLegacyRequest(config, "/ip/socks/users/print", { "?name": proxy.username });
                } catch (e) {
                  users = await mikrotikLegacyRequest(config, "/ip/socks/user/print", { "?name": proxy.username });
                }
                
                if (users && users.length > 0) {
                  const deleteCmd = users[0].name ? "/ip/socks/users/remove" : "/ip/socks/user/remove";
                  await mikrotikLegacyRequest(config, deleteCmd, { ".id": users[0][".id"] });
                }
              } catch (legacyErr) {
                console.error(`[Expiry] Failed to disable proxy via legacy API:`, legacyErr.message);
              }
            }
          } else {
            console.log(`[Expiry] Proxy for ${proxy.username} expired, but other active proxies still exist. Skipping MikroTik deletion.`);
          }

          // Update Firestore
          await doc.ref.update({ status: "expired" });
          console.log(`Disabled expired proxy for user: ${proxy.username}`);
        } catch (err) {
          console.error(`Failed to disable proxy for ${proxy.username}:`, err);
        }
      }
    } catch (error) {
      console.error("Cron job error:", error);
    }
  });

  // Proxy Checker API
  app.post("/api/check-proxy", async (req, res) => {
    const { host, port, username, password } = req.body;
    if (!host || !port) return res.status(400).json({ error: "Host and Port are required" });

    const proxyUrl = username && password 
      ? `http://${username}:${password}@${host}:${port}`
      : `http://${host}:${port}`;

    try {
      const agent = new HttpsProxyAgent(proxyUrl);
      const startTime = Date.now();
      
      // Test against a reliable endpoint
      const response = await axios.get("https://api.ipify.org?format=json", {
        httpsAgent: agent,
        timeout: 10000, // 10s timeout
      });

      const latency = Date.now() - startTime;
      res.json({
        success: true,
        status: "Live",
        latency: `${latency}ms`,
        ip: response.data.ip
      });
    } catch (error: any) {
      res.json({
        success: false,
        status: "Dead",
        error: error.message || "Connection failed"
      });
    }
  });

  // In-memory store for verification codes (expires in 10 mins)
  const verificationCodes = new Map<string, { code: string; expires: number }>();

  // API to send verification code
  app.post("/api/send-verification", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes.set(email, { code, expires: Date.now() + 10 * 60 * 1000 });

    const user = process.env.SMTP_USER || process.env.SNTP_USER;
    const pass = process.env.SMTP_PASS || process.env.SNTP_PASS;

    try {
      // If SMTP is not configured, log to console for debugging
      if (!user || !pass) {
        console.log("-----------------------------------------");
        console.log(`DEBUG MODE: VERIFICATION CODE FOR ${email}: ${code}`);
        console.log("-----------------------------------------");
        return res.json({ 
          success: true, 
          debug: true,
          message: "Debug Mode: Code logged to console. Please configure SMTP for real emails." 
        });
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail', // Optimized for Gmail
        auth: {
          user: user,
          pass: pass,
        },
      });

      const mailOptions = {
        from: `"ProxyMamaBD Support" <${user}>`,
        to: email,
        subject: "🔒 Your Verification Code - ProxyMamaBD",
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 24px; background-color: #ffffff; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 28px; letter-spacing: -1px;">ProxyMamaBD</h1>
              <p style="color: #6b7280; font-size: 14px; margin-top: 5px;">Bangladesh BDIX Speed Bypass Solution</p>
            </div>
            
            <div style="background-color: #f8fafc; border-radius: 20px; padding: 30px; text-align: center; border: 1px solid #e2e8f0;">
              <p style="font-size: 16px; color: #475569; margin-bottom: 20px;">Use the following code to complete your registration:</p>
              <div style="font-size: 42px; font-weight: 800; color: #1e293b; letter-spacing: 8px; margin: 20px 0; font-family: monospace;">
                ${code}
              </div>
              <p style="font-size: 13px; color: #94a3b8;">This code is valid for 10 minutes.</p>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="font-size: 12px; color: #94a3b8; line-height: 1.5;">
                If you didn't request this code, you can safely ignore this email.<br>
                &copy; 2024 ProxyMamaBD Team. All rights reserved.
              </p>
            </div>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${email}`);
      res.json({ success: true, message: "Verification code sent!" });
    } catch (error: any) {
      console.error("Email error details:", error);
      res.status(500).json({ 
        error: "Failed to send email", 
        details: error.message || "Unknown error",
        hint: "Make sure you are using a Gmail App Password, not your regular password."
      });
    }
  });

  // API to verify code
  app.post("/api/verify-code", (req, res) => {
    const { email, code } = req.body;
    const stored = verificationCodes.get(email);

    if (!stored) return res.status(400).json({ error: "No code found for this email" });
    if (Date.now() > stored.expires) {
      verificationCodes.delete(email);
      return res.status(400).json({ error: "Code expired" });
    }
    if (stored.code !== code) return res.status(400).json({ error: "Invalid code" });

    // Code is valid
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    // Catch-all for SPA in development
    app.get("*", async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) return next();
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
