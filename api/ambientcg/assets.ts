import type { Request, Response } from "express";

export default async function handler(req: Request, res: Response) {
  try {
    // Enable CORS headers explicitly for Vercel
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    const { q = "", sort = "popular", limit = "24" } = req.query;
    const apiUrl = `https://ambientcg.com/api/v3/assets?type=material&q=${encodeURIComponent(q as string)}&sort=${sort}&include=downloads,previews&limit=${limit}`;
    
    console.log(`[Vercel Serverless] Fetching assets from ambientCG: ${apiUrl}`);
    const response = await fetch(apiUrl);
    if (!response.ok) {
      return res.status(response.status).json({ error: `ambientCG API responded with status ${response.status}` });
    }
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error: any) {
    console.error("[Vercel Serverless Error] ambientCG assets proxy:", error);
    return res.status(500).json({ error: error.message || "Internal server error in ambientCG proxy" });
  }
}
