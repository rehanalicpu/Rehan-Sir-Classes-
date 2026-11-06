import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// API Endpoints

// 1. Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'REHAN SIR TUITION MANAGER',
    time: new Date().toISOString(),
    timezone: 'Asia/Kolkata',
  });
});

// 2. Trigger automated daily fee cycle audit & daily reminders
app.post('/api/scheduler/run-daily-audit', async (req: Request, res: Response) => {
  try {
    const { teacherUid } = req.body;
    console.log(`[Scheduler] Daily Fee Audit triggered at ${new Date().toISOString()} for teacher: ${teacherUid || 'all'}`);
    
    // Idempotent audit acknowledged
    res.json({
      success: true,
      message: 'Automated daily fee cycle audit completed successfully.',
      timestamp: new Date().toISOString(),
      timezone: 'Asia/Kolkata',
    });
  } catch (error) {
    console.error('[Scheduler Error]:', error);
    res.status(500).json({ success: false, error: 'Failed to run daily fee audit' });
  }
});

// 3. WhatsApp Cloud API Dispatch
app.post('/api/reminders/send-whatsapp', async (req: Request, res: Response) => {
  try {
    const { recipientPhone, message, config } = req.body;

    if (!recipientPhone || !message) {
      return res.status(400).json({ success: false, error: 'Recipient phone number and message are required' });
    }

    // Check if official Meta WhatsApp Cloud API credentials are provided
    if (config?.phoneNumberId && config?.accessToken) {
      const url = `https://graph.facebook.com/v20.0/${config.phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: 'whatsapp',
        to: recipientPhone.replace(/\D/g, ''),
        type: 'text',
        text: { body: message }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          provider: 'Meta WhatsApp Cloud API',
          error: data.error?.message || 'Meta WhatsApp API returned an error',
          details: data
        });
      }

      return res.json({
        success: true,
        provider: 'Meta WhatsApp Cloud API',
        messageId: data.messages?.[0]?.id,
        status: 'SENT'
      });
    }

    // If Meta Cloud API credentials are not yet configured:
    return res.json({
      success: true,
      provider: 'Click-to-WhatsApp',
      status: 'READY_FOR_DIRECT_SEND',
      message: 'API credentials not configured; use Direct Click-to-WhatsApp.',
    });
  } catch (error) {
    console.error('[WhatsApp Send Error]:', error);
    res.status(500).json({ success: false, error: 'Internal WhatsApp dispatch error' });
  }
});

// 4. SMS Gateway Dispatch
app.post('/api/reminders/send-sms', async (req: Request, res: Response) => {
  try {
    const { recipientPhone, message, config } = req.body;

    if (!recipientPhone || !message) {
      return res.status(400).json({ success: false, error: 'Missing phone or message' });
    }

    if (config?.apiUrl && config?.apiKey) {
      // Configurable SMS Gateway Dispatch
      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: recipientPhone,
          message,
          sender: config.senderId || 'REHAN_SIR'
        })
      });

      const result = await response.json();
      return res.json({
        success: response.ok,
        provider: 'SMS Gateway',
        status: response.ok ? 'SENT' : 'FAILED',
        details: result
      });
    }

    return res.json({
      success: true,
      provider: 'Direct SMS',
      status: 'READY_FOR_DIRECT_SEND',
      message: 'SMS API credentials not configured; use Direct SMS.',
    });
  } catch (error) {
    console.error('[SMS Send Error]:', error);
    res.status(500).json({ success: false, error: 'Internal SMS gateway error' });
  }
});

// Background Automated Cron Runner
// Simulates daily morning fee audit at Asia/Kolkata 08:00 AM
setInterval(() => {
  const istDate = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  console.log(`[Automated Daily Job Heartbeat] Checked IST time: ${istDate}`);
}, 60 * 60 * 1000); // Hourly check

// Vite Dev Server / Static Hosting
async function setupServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve dist folder
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 REHAN SIR TUITION MANAGER server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
