import { createHash } from 'crypto';
import pkg from '@kadena/cryptography-utils';
const { sign, genKeyPair } = pkg;
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Debug: Check if environment variables are loaded
console.log('Environment variables loaded:');
console.log('ENCRYPTED_PRIVATE_KEY:', process.env.ENCRYPTED_PRIVATE_KEY ? 'Set' : 'Not set');

async function getPrivateKey(privateKey) {
  try {
    // Log the actual private key (first few characters only for security)
    console.log('Private key received (first 10 chars):', privateKey ? privateKey.substring(0, 10) + '...' : 'null');
    console.log('Private key length:', privateKey ? privateKey.length : 0);
    
    if (!privateKey) {
      throw new Error('Private key is required');
    }

    // Remove any whitespace or quotes that might have been added
    privateKey = privateKey.trim().replace(/['"]/g, '');
    console.log('Cleaned private key length:', privateKey.length);

    // Validate the private key format (should be 64 hex characters)
    if (!/^[0-9a-f]{64}$/.test(privateKey)) {
      console.log('Invalid private key format details:');
      console.log('- Length:', privateKey.length);
      console.log('- Contains only hex chars:', /^[0-9a-f]+$/i.test(privateKey));
      console.log('- First 10 chars:', privateKey.substring(0, 10));
      throw new Error(`Invalid private key format - should be 64 hex characters, got length ${privateKey.length}`);
    }

    // Return the key pair
    const keyPair = {
      secretKey: privateKey,
      publicKey: '38c0944b62d06a1c16fde2556a5e2ee3872efe9095e0050c8d16819f7306d382'
    };
    
    console.log('Key pair created successfully');
    return keyPair;
  } catch (error) {
    console.error('Detailed error in getPrivateKey:', error);
    throw new Error(`Failed to process private key: ${error.message}`);
  }
}

async function signTransaction(transaction, keyPair) {
  try {
    console.log('Starting transaction signing process');
    
    // Convert transaction to string if it's not already
    const txString = typeof transaction === 'string' ? transaction : JSON.stringify(transaction);
    console.log('Transaction string length:', txString.length);
    
    // Create a hash of the transaction
    const hash = createHash('sha256')
      .update(txString)
      .digest('hex');
    
    console.log('Transaction hash generated:', hash);
    console.log('Using key pair:', {
      publicKey: keyPair.publicKey,
      secretKeyLength: keyPair.secretKey ? keyPair.secretKey.length : 0
    });

    // Sign the hash with the key pair
    const signature = sign(hash, keyPair);
    console.log('Signature generated successfully');
    
    return signature;
  } catch (error) {
    console.error('Detailed error in signTransaction:', error);
    throw new Error(`Failed to sign transaction: ${error.message}`);
  }
}

export const handler = async (event) => {
  try {
    console.log('Handler received event:', JSON.stringify(event, null, 2));
    
    // Get the transaction and private key from the event
    const { transaction, privateKey } = event;
    
    if (!transaction) {
      throw new Error('No transaction provided in the event');
    }
    if (!privateKey) {
      throw new Error('No private key provided in the event');
    }

    console.log('Transaction and private key received');
    console.log('Transaction type:', typeof transaction);
    console.log('Private key type:', typeof privateKey);

    // Get the key pair
    const keyPair = await getPrivateKey(privateKey);
    console.log('Key pair retrieved successfully');

    // Sign the transaction
    const signature = await signTransaction(transaction, keyPair);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Transaction signed successfully',
        ...signature
      })
    };
  } catch (error) {
    console.error('Detailed error in Lambda handler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error signing transaction',
        error: error.message
      })
    };
  }
}; 