import { KMSClient, CreateKeyCommand, GetPublicKeyCommand, GetParametersForImportCommand, ImportKeyMaterialCommand } from '@aws-sdk/client-kms';
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
      Origin: 'EXTERNAL', // Changed to EXTERNAL since we're importing our own key
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

    // Get import parameters
    const importParams = await kmsClient.send(
      new GetParametersForImportCommand({
        KeyId: KeyMetadata.KeyId,
        WrappingAlgorithm: 'RSAES_OAEP_SHA_1',
        WrappingKeySpec: 'RSA_2048'
      })
    );

    // Convert private key to buffer
    const privateKeyBuffer = Buffer.from(privateKey, 'hex');

    // Encrypt the private key using the KMS public key
    const encryptedKey = crypto.publicEncrypt(
      {
        key: importParams.PublicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha1'
      },
      privateKeyBuffer
    );

    // Import the encrypted key material
    await kmsClient.send(
      new ImportKeyMaterialCommand({
        KeyId: KeyMetadata.KeyId,
        ImportToken: importParams.ImportToken,
        EncryptedKeyMaterial: encryptedKey,
        ExpirationModel: 'KEY_MATERIAL_EXPIRES',
        ValidTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
      })
    );

    console.log('Private key successfully imported to KMS');

    // Get the public key from KMS
    const getPublicKeyCommand = new GetPublicKeyCommand({
      KeyId: KeyMetadata.KeyId
    });

    const { PublicKey } = await kmsClient.send(getPublicKeyCommand);
    console.log('Public key retrieved from KMS');

    return {
      keyId: KeyMetadata.KeyId,
      publicKey: PublicKey
    };
  } catch (error) {
    console.error('Error storing private key in KMS:', error);
    throw new Error(`Failed to store private key in KMS: ${error.message}`);
  }
} 