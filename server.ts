import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. ambientCG Assets Proxy
  app.get("/api/ambientcg/assets", async (req, res) => {
    try {
      const { q = "", sort = "popular", limit = "24" } = req.query;
      const apiUrl = `https://ambientcg.com/api/v3/assets?type=material&q=${encodeURIComponent(q as string)}&sort=${sort}&include=downloads&limit=${limit}`;
      
      console.log(`[Proxy] Fetching assets from ambientCG: ${apiUrl}`);
      const response = await fetch(apiUrl);
      if (!response.ok) {
        return res.status(response.status).json({ error: `ambientCG API responded with status ${response.status}` });
      }
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("[Proxy Error] ambientCG assets proxy:", error);
      res.status(500).json({ error: error.message || "Internal server error in ambientCG proxy" });
    }
  });

  // 2. ambientCG ZIP Download Proxy (completely avoids CORS for three.js loads)
  app.get("/api/ambientcg/download", async (req, res) => {
    try {
      const { file } = req.query;
      if (!file) {
        return res.status(400).json({ error: "Missing 'file' query parameter" });
      }

      const downloadUrl = `https://ambientcg.com/get?file=${file}`;
      console.log(`[Proxy] Fetching file from ambientCG: ${downloadUrl}`);

      const response = await fetch(downloadUrl);
      if (!response.ok) {
        return res.status(response.status).json({ error: `Failed to fetch file from ambientCG: ${response.statusText}` });
      }

      // Set headers
      res.setHeader("Content-Type", response.headers.get("Content-Type") || "application/octet-stream");
      const contentLength = response.headers.get("Content-Length");
      if (contentLength) {
        res.setHeader("Content-Length", contentLength);
      }
      res.setHeader("Content-Disposition", response.headers.get("Content-Disposition") || `attachment; filename="${file}"`);

      // Read arrayBuffer and send as Buffer to avoid any node-stream vs web-stream typing conflicts
      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (error: any) {
      console.error("[Proxy Error] ambientCG download proxy:", error);
      res.status(500).json({ error: error.message || "Internal server error during download proxy" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
