import { createHash } from 'crypto';
import pkg from '@kadena/cryptography-utils';
const { sign, genKeyPair } = pkg;
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Debug: Check if environment variables are loaded
console.log('Environment variables loaded:');
console.log('ENCRYPTED_PRIVATE_KEY:', process.env.ENCRYPTED_PRIVATE_KEY ? 'Set' : 'Not set');

async function getPrivateKey() {
  try {
    // Get the private key from environment variable
    const privateKey = process.env.ENCRYPTED_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('ENCRYPTED_PRIVATE_KEY environment variable is not set');
    }

    // Validate the private key format (should be 64 hex characters)
    if (!/^[0-9a-f]{64}$/.test(privateKey)) {
      throw new Error('Invalid private key format - should be 64 hex characters');
    }

    // Return the key pair
    return {
      secretKey: privateKey,
      publicKey: '38c0944b62d06a1c16fde2556a5e2ee3872efe9095e0050c8d16819f7306d382' // This is the public key we generated earlier
    };
  } catch (error) {
    // Log error without exposing sensitive data
    console.error('Error in getPrivateKey:', error.message);
    throw new Error('Failed to process private key');
  }
}

async function signTransaction(transaction, keyPair) {
  try {
    // Convert transaction to string if it's not already
    const txString = typeof transaction === 'string' ? transaction : JSON.stringify(transaction);
    
    // Create a hash of the transaction
    const hash = createHash('sha256')
      .update(txString)
      .digest('hex');
    
    console.log('Transaction hash:', hash);
    console.log('Using key pair:', {
      publicKey: keyPair.publicKey,
      secretKey: keyPair.secretKey ? 'Set' : 'Not set'
    });

    // Sign the hash with the key pair
    const signature = sign(hash, keyPair);
    console.log('Signature generated:', signature);
    
    return signature;
  } catch (error) {
    // Log error without exposing sensitive data
    console.error('Error in signTransaction:', error.message);
    throw new Error('Failed to sign transaction: ' + error.message);
  }
}

export const handler = async (event) => {
  try {
    // Get the transaction from the event
    const transactionStr = event.transaction;
    if (!transactionStr) {
      throw new Error('No transaction provided in the event');
    }

    console.log('Received transaction:', transactionStr);

    // Get the key pair
    const keyPair = await getPrivateKey();
    console.log('Key pair retrieved successfully');

    // Sign the transaction
    const signature = await signTransaction(transactionStr, keyPair);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Transaction signed successfully',
        ...signature
      })
    };
  } catch (error) {
    console.error('Error in Lambda handler:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error signing transaction',
        error: error.message
      })
    };
  }
}; 