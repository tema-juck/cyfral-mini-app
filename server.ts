import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API routes FIRST
  app.post("/api/check-balance", async (req, res) => {
    try {
      const { accountNumber, telegramId } = req.body;
      
      console.log(`Sending request to n8n for account: ${accountNumber}, telegramId: ${telegramId}`);
      
      const response = await fetch('https://temajuck.app.n8n.cloud/webhook/cyfral-check-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountNumber,
          telegramId,
        }),
      });

      console.log(`n8n response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`n8n error response: ${errorText}`);
        return res.status(response.status).json({ error: 'Failed to fetch from n8n', details: errorText });
      }

      const text = await response.text();
      console.log(`n8n response body: ${text}`);
      
      try {
        const data = JSON.parse(text);
        res.json(data);
      } catch (e) {
        console.error('Failed to parse n8n response as JSON:', e);
        res.status(500).json({ error: 'Invalid JSON from n8n', details: text });
      }
    } catch (error) {
      console.error('Proxy error:', error);
      res.status(500).json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
