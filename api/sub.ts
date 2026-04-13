import { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';
import yaml from 'js-yaml';

import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase Admin for Vercel
if (!admin.apps || admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    } as any),
  });
}

const db = admin.firestore();
// Note: If using a named database, it's better to set it in initializeApp or use the default

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Extract token from query (handled by vercel.json rewrites)
  const token = req.query.token as string;

  console.log(`[Vercel-Sub] Request for token: ${token}`);

  res.setHeader("Content-Type", "text/yaml; charset=utf-8");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Content-Disposition", `attachment; filename="proxymama.yaml"`);

  if (!token) {
    return res.send("# error: Token missing");
  }

  try {
    // 1. Find User Subscription
    const subQuery = await db.collection("userClashSubscriptions")
      .where("token", "==", token)
      .where("status", "==", "active")
      .limit(1)
      .get();

    if (subQuery.empty) {
      return res.send("# error: Subscription not found or inactive");
    }

    const subDoc = subQuery.docs[0];
    const subData = subDoc.data();

    // 2. Check Expiry
    const expiryDate = new Date(subData.expiryDate);
    
    // Add Clash specific headers
    const totalTraffic = 1000 * 1024 * 1024 * 1024;
    const usedTraffic = 0;
    const expiryTimestamp = Math.floor(expiryDate.getTime() / 1000);
    res.setHeader("Subscription-Userinfo", `upload=${usedTraffic}; download=${usedTraffic}; total=${totalTraffic}; expire=${expiryTimestamp}`);

    if (expiryDate < new Date()) {
      await subDoc.ref.update({ status: "expired" });
      return res.send("# error: Subscription expired");
    }

    // 3. Get Plan Details
    const planSnap = await db.collection("clashSubscriptionPlans").doc(subData.planId).get();
    if (!planSnap.exists) {
      return res.send("# error: Plan details not found");
    }

    const planData = planSnap.data();

    // 4. Generate Clash YAML
    const clashConfig: any = {
      port: 7890,
      "socks-port": 7891,
      "redir-port": 7892,
      "mixed-port": 7893,
      "allow-lan": true,
      mode: "rule",
      "log-level": "info",
      "external-controller": "127.0.0.1:9090",
      proxies: (planData.proxies || []).map((p: any) => {
        const proxy: any = {
          name: String(p.name || "Node").trim(),
          type: String(p.type || "socks5").toLowerCase().trim(),
          server: String(p.server || "0.0.0.0").trim(),
          port: Number(p.port || 1080),
          udp: true
        };
        if (p.username && String(p.username).trim()) proxy.username = String(p.username).trim();
        if (p.password && String(p.password).trim()) proxy.password = String(p.password).trim();
        if (p.tls) proxy.tls = true;
        if (p.sni && String(p.sni).trim()) proxy.sni = String(p.sni).trim();
        return proxy;
      }),
      "proxy-groups": [
        {
          name: "ProxyMama-Main",
          type: "select",
          proxies: ["Manual-Select", "Auto-Select"]
        },
        {
          name: "Manual-Select",
          type: "select",
          proxies: (planData.proxies || []).map((p: any) => String(p.name || "Node").trim())
        },
        {
          name: "Auto-Select",
          type: "url-test",
          url: "http://www.gstatic.com/generate_204",
          interval: 300,
          proxies: (planData.proxies || []).map((p: any) => String(p.name || "Node").trim())
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
      quotingType: '"'
    });
    
    res.send(`# ProxyMama Config\n${yamlContent}`);

  } catch (error) {
    console.error("Vercel Sub Error:", error);
    res.send("# error: Internal server error");
  }
}
