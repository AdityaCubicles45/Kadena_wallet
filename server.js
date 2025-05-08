import express from 'express';
import { handler } from './src/lambda.js';
import { genKeyPair } from '@kadena/cryptography-utils';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS with specific options
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware to parse JSON bodies with better error handling
app.use(express.json({
  verify: (req, res, buf, encoding) => {
    if (buf && buf.length) {
      try {
        JSON.parse(buf.toString());
      } catch (e) {
        res.status(400).json({
          message: 'Invalid JSON format',
          error: e.message
        });
        throw new Error('Invalid JSON');
      }
    }
  }
}));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Generate new wallet endpoint (both GET and POST)
app.all('/generate-wallet', async (req, res) => {
  try {
    console.log('Generating new wallet...');
    const keyPair = genKeyPair();
    console.log('Wallet generated successfully');
    
    // Log the generated keys (first few characters only)
    console.log('Generated public key (first 10 chars):', keyPair.publicKey.substring(0, 10) + '...');
    console.log('Generated private key (first 10 chars):', keyPair.secretKey.substring(0, 10) + '...');
    
    // Create the Kadena address
    const kadenaAddress = `k:${keyPair.publicKey}`;
    
    res.status(200).json({
      message: 'Wallet generated successfully',
      publicKey: keyPair.publicKey,
      privateKey: keyPair.secretKey,
      address: kadenaAddress,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating wallet:', error);
    res.status(500).json({
      message: 'Error generating wallet',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Sign transaction endpoint
app.post('/sign', async (req, res) => {
  try {
    console.log('Received sign request');
    const { transaction, privateKey } = req.body;
    
    // Log request details (safely)
    console.log('Request details:', {
      hasTransaction: !!transaction,
      hasPrivateKey: !!privateKey,
      transactionType: transaction ? typeof transaction : 'none',
      privateKeyLength: privateKey ? privateKey.length : 0,
      privateKeyStart: privateKey ? privateKey.substring(0, 10) + '...' : 'none'
    });
    
    // Validate request body
    if (!transaction || !privateKey) {
      console.log('Missing required fields');
      return res.status(400).json({
        message: 'Both transaction and privateKey are required',
        received: {
          hasTransaction: !!transaction,
          hasPrivateKey: !!privateKey
        },
        timestamp: new Date().toISOString()
      });
    }

    // Convert transaction to string if it's an object
    const transactionStr = typeof transaction === 'string' 
      ? transaction 
      : JSON.stringify(transaction);

    // Validate private key format
    const cleanPrivateKey = privateKey.trim().replace(/['"]/g, '');
    if (!/^[0-9a-f]{64}$/.test(cleanPrivateKey)) {
      return res.status(400).json({
        message: 'Invalid private key format',
        details: {
          length: cleanPrivateKey.length,
          isHex: /^[0-9a-f]+$/i.test(cleanPrivateKey)
        },
        timestamp: new Date().toISOString()
      });
    }

    console.log('Calling handler with transaction and private key');
    const result = await handler({ 
      transaction: transactionStr, 
      privateKey: cleanPrivateKey 
    });
    console.log('Handler response:', result);
    
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error) {
    console.error('Error in sign endpoint:', error);
    res.status(500).json({
      message: 'Error processing request',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: 'Not Found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`Generate wallet: http://localhost:${port}/generate-wallet`);
  console.log(`Sign transaction: http://localhost:${port}/sign`);
}); 