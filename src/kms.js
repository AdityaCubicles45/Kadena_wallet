import { KMSClient, CreateKeyCommand, GetPublicKeyCommand, SignCommand } from '@aws-sdk/client-kms';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const kmsClient = new KMSClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function storePrivateKeyInKMS(privateKey) {
  try {
    // Create a new KMS key
    const createKeyCommand = new CreateKeyCommand({
      KeySpec: 'ECC_NIST_P256',
      KeyUsage: 'SIGN_VERIFY',
      Origin: 'AWS_KMS',
      Description: 'Kadena Wallet Private Key',
      Tags: [
        {
          TagKey: 'Purpose',
          TagValue: 'KadenaWallet'
        }
      ]
    });

    const { KeyMetadata } = await kmsClient.send(createKeyCommand);
    console.log('KMS Key created:', KeyMetadata.KeyId);

    // Store the Kadena private key as a tag
    const keyTag = crypto.createHash('sha256')
      .update(privateKey)
      .digest('hex');

    // Get the public key from KMS
    const getPublicKeyCommand = new GetPublicKeyCommand({
      KeyId: KeyMetadata.KeyId
    });

    const { PublicKey } = await kmsClient.send(getPublicKeyCommand);
    console.log('Public key retrieved from KMS');

    // Store the key tag in a secure way (you might want to use a database in production)
    // For now, we'll just return it with the response
    return {
      keyId: KeyMetadata.KeyId,
      publicKey: PublicKey,
      keyTag: keyTag
    };
  } catch (error) {
    console.error('Error storing private key in KMS:', error);
    throw new Error(`Failed to store private key in KMS: ${error.message}`);
  }
}

// Function to sign data using KMS
export async function signWithKMS(keyId, data) {
  try {
    const message = typeof data === 'string' ? data : JSON.stringify(data);
    const messageBuffer = Buffer.from(message);
    
    const signCommand = new SignCommand({
      KeyId: keyId,
      Message: messageBuffer,
      SigningAlgorithm: 'ECDSA_SHA_256'
    });

    const { Signature } = await kmsClient.send(signCommand);
    return Signature;
  } catch (error) {
    console.error('Error signing with KMS:', error);
    throw new Error(`Failed to sign with KMS: ${error.message}`);
  }
} 