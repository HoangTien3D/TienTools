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

    const { file } = req.query;
    if (!file) {
      return res.status(400).json({ error: "Missing 'file' query parameter" });
    }

    const downloadUrl = `https://ambientcg.com/get?file=${file}`;
    console.log(`[Vercel Serverless] Fetching file from ambientCG: ${downloadUrl}`);

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

    // Read arrayBuffer and send as Buffer
    const arrayBuffer = await response.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (error: any) {
    console.error("[Vercel Serverless Error] ambientCG download proxy:", error);
    return res.status(500).json({ error: error.message || "Internal server error during download proxy" });
  }
}
