import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import assetsHandler from "./api/ambientcg/assets";
import downloadHandler from "./api/ambientcg/download";

const app = express();

// 1. ambientCG Assets Proxy
app.get("/api/ambientcg/assets", assetsHandler);

// 2. ambientCG ZIP Download Proxy (completely avoids CORS for three.js loads)
app.get("/api/ambientcg/download", downloadHandler);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

export default app;

async function startServer() {
  const PORT = 3000;

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

if (!process.env.VERCEL) {
  startServer();
}
