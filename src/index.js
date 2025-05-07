import { kadenaKeyPairsFromRandom } from '@kadena/hd-wallet';
import { KMSClient, ImportKeyMaterialCommand, GetParametersForImportCommand } from '@aws-sdk/client-kms';
import dotenv from 'dotenv';
import crypto from 'crypto';

// Load environment variables
dotenv.config();

// Initialize AWS KMS client
const kmsClient = new KMSClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function generateWallet() {
  try {
    // Generate Kadena key pair
    const keyPairs = kadenaKeyPairsFromRandom(1);
    const { publicKey, secretKey } = keyPairs[0];
    const account = `k:${publicKey}`;
    
    console.log('Generated Kadena Wallet:');
    console.log('Public Key:', publicKey);
    console.log('Private Key:', secretKey);
    console.log('Kadena Account:', account);

    return { publicKey, privateKey: secretKey, account };
  } catch (error) {
    console.error('Error generating wallet:', error);
    throw error;
  }
}

async function getImportParameters() {
  const command = new GetParametersForImportCommand({
    KeyId: process.env.KMS_KEY_ID,
    WrappingAlgorithm: 'RSAES_OAEP_SHA_1',
    WrappingKeySpec: 'RSA_2048'
  });

  const response = await kmsClient.send(command);
  return {
    importToken: response.ImportToken,
    publicKey: response.PublicKey,
    parametersValidTo: response.ParametersValidTo
  };
}

async function encryptKeyMaterial(keyMaterial, kmsPublicKey) {
  const publicKeyObject = crypto.createPublicKey({
    key: kmsPublicKey,
    format: 'der',
    type: 'spki'
  });

  const encryptedData = crypto.publicEncrypt(
    {
      key: publicKeyObject,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha1'
    },
    Buffer.from(keyMaterial, 'hex')
  );

  return encryptedData;
}

async function importToKMS(privateKey, publicKey) {
  try {
    // Get import parameters from KMS
    const { importToken, publicKey: kmsPublicKey, parametersValidTo } = await getImportParameters();
    
    // Encrypt the private key with KMS public key
    const encryptedKeyMaterial = await encryptKeyMaterial(privateKey, kmsPublicKey);
    
    // Set expiration date to 1 year from now
    const validTo = new Date();
    validTo.setFullYear(validTo.getFullYear() + 1);
    
    // Create a custom key in KMS
    const importCommand = new ImportKeyMaterialCommand({
      KeyId: process.env.KMS_KEY_ID,
      ImportToken: importToken,
      EncryptedKeyMaterial: encryptedKeyMaterial,
      ValidTo: validTo,
      ExpirationModel: 'KEY_MATERIAL_EXPIRES'
    });

    const result = await kmsClient.send(importCommand);
    console.log('Successfully imported key to KMS:', result);
    return result;
  } catch (error) {
    console.error('Error importing to KMS:', error);
    throw error;
  }
}

async function main() {
  try {
    // Generate wallet
    const wallet = await generateWallet();
    
    // Import to KMS
    await importToKMS(wallet.privateKey, wallet.publicKey);
    
    console.log('Wallet generation and KMS import completed successfully!');
  } catch (error) {
    console.error('Error in main process:', error);
  }
}

main(); 