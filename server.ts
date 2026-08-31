import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini AI lazily
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

// Health Check API
app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    system: "GameHost Deployer & Subdomain Routing Engine",
    version: "2.5.0",
    timestamp: new Date().toISOString(),
  });
});

// AI Server Log & Proxy Assistant Endpoint
app.post("/api/ai/analyze", async (req, res) => {
  try {
    const { prompt, context, type } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(200).json({
        response: "AI features are active in client fallback mode. (GEMINI_API_KEY not provided). Here is standard advice:\n\n1. Ensure ports are opened on firewall (UFW / Cloud Security Groups).\n2. For Minecraft proxying, use Velocity or mc-router with SNI routing.\n3. For UDP game traffic (Satisfactory, Valheim), ensure stream {} block is configured in Nginx or UDP proxying in Traefik/Cloudflare Tunnel.",
        simulated: true,
      });
    }

    const systemInstruction = `You are an expert Game Server Administrator & Network Systems Engineer specializing in game server deployment (Minecraft, Satisfactory, Valheim, Palworld, Rust, etc.), Docker containers, and reverse proxies (NGINX, Caddy, Traefik, Cloudflare Tunnels, Velocity, Playit.gg, and DNS CNAME/A records).
Provide concise, actionable, expert instructions, troubleshooting steps, or configuration snippets based on user queries. Formatting should be clear markdown with code blocks where appropriate.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemInstruction}\n\nTask Type: ${type || "general"}\nContext: ${JSON.stringify(context || {})}\n\nUser Question: ${prompt}` }],
        },
      ],
    });

    res.json({ response: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error.message || "Failed to contact AI engine" });
  }
});

// DNS / Domain Proxy Verification Endpoint
app.post("/api/proxy/verify-dns", (req, res) => {
  const { domain, targetIp, port, protocol } = req.body;
  
  // Simulated DNS and port reachability check
  const isDomainValid = Boolean(domain && domain.includes("."));
  const pingMs = Math.floor(Math.random() * 25) + 12;
  
  res.json({
    domain: domain || "unknown",
    resolvedIp: targetIp || "192.168.1.100",
    status: isDomainValid ? "ACTIVE" : "DNS_PENDING",
    sslStatus: "CERT_ISSUED",
    latencyMs: pingMs,
    protocol: protocol || "TCP/UDP",
    targetPort: port || 25565,
    message: isDomainValid
      ? `Successfully routed ${domain} to target server on port ${port}. Proxy latency: ${pingMs}ms.`
      : `Subdomain ${domain} DNS record propagation pending or misconfigured. Ensure A record points to ${targetIp}.`,
  });
});

async function startServer() {
  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
