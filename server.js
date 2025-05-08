import express from 'express';
import { handler } from './src/lambda.js';
import { genKeyPair } from '@kadena/cryptography-utils';

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies with better error handling
app.use(express.json({
  verify: (req, res, buf, encoding) => {
    if (buf && buf.length) {
      try {
        JSON.parse(buf.toString());
      } catch (e) {
        res.status(400).json({
          message: 'Invalid JSON format',
          error: e.message,
          position: e.message.match(/position (\d+)/)?.[1] || 'unknown'
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
  res.status(200).json({ status: 'healthy' });
});

// Generate new wallet endpoint
app.post('/generate-wallet', async (req, res) => {
  try {
    console.log('Generating new wallet...');
    const keyPair = genKeyPair();
    console.log('Wallet generated successfully');
    res.status(200).json({
      message: 'Wallet generated successfully',
      publicKey: keyPair.publicKey,
      privateKey: keyPair.secretKey
    });
  } catch (error) {
    console.error('Error generating wallet:', error);
    res.status(500).json({
      message: 'Error generating wallet',
      error: error.message
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
        }
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
        }
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
      error: error.message
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 