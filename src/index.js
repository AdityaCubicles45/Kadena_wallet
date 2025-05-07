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

// Mainnet configuration
const MAINNET = {
  networkId: 'mainnet02',
  chainId: '0',
  accountPrefix: 'k:'
};

async function generateWallet() {
  try {
    // Generate Kadena key pair
    const keyPairs = kadenaKeyPairsFromRandom(1);
    const { publicKey, secretKey } = keyPairs[0];
    const account = `${MAINNET.accountPrefix}${publicKey}`;
    
    console.log('Generated Kadena Wallet (MAINNET):');
    console.log('Network ID:', MAINNET.networkId);
    console.log('Chain ID:', MAINNET.chainId);
    console.log('Public Key:', publicKey);
    console.log('Private Key:', secretKey);
    console.log('Account:', account);

    return { 
      publicKey, 
      privateKey: secretKey, 
      account,
      network: MAINNET
    };
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

async function encryptKeyMaterial(privateKey, publicKey) {
  try {
    // Convert private key to buffer
    const rawKeyMaterial = Buffer.from(privateKey, 'hex');
    console.log('Raw key material length:', rawKeyMaterial.length, 'bytes');

    // Create public key object from KMS public key
    const publicKeyBuffer = Buffer.from(publicKey, 'base64');
    console.log('Public key length:', publicKeyBuffer.length, 'bytes');

    const publicKeyObj = crypto.createPublicKey({
      key: publicKeyBuffer,
      format: 'der',
      type: 'spki'
    });

    // Encrypt directly with RSA-OAEP
    const encryptedKeyMaterial = crypto.publicEncrypt(
      {
        key: publicKeyObj,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha1'
      },
      rawKeyMaterial
    );

    console.log('Encrypted key material length:', encryptedKeyMaterial.length, 'bytes');
    return encryptedKeyMaterial;
  } catch (error) {
    console.error('Error encrypting key material:', error);
    throw error;
  }
}

async function importToKMS(privateKey) {
  try {
    console.log('\nAttempting to import key material to KMS...');

    // Get import parameters
    const params = await kmsClient.send(
      new GetParametersForImportCommand({
        KeyId: process.env.KMS_KEY_ID,
        WrappingAlgorithm: 'RSAES_OAEP_SHA_1',
        WrappingKeySpec: 'RSA_2048'
      })
    );

    console.log('Got import parameters:');
    console.log('- Key ID:', process.env.KMS_KEY_ID);
    console.log('- Import token length:', params.ImportToken.length, 'bytes');
    console.log('- Public key length:', params.PublicKey.length, 'bytes');
    console.log('- Valid until:', params.ParametersValidTo);

    // Encrypt key material
    const encryptedKeyMaterial = await encryptKeyMaterial(privateKey, params.PublicKey);

    // Set expiration date to 364 days from now
    const validTo = new Date();
    validTo.setDate(validTo.getDate() + 364);

    console.log('\nImporting encrypted key material:');
    console.log('- Encrypted key material length:', encryptedKeyMaterial.length, 'bytes');
    console.log('- Valid to:', validTo.toISOString());

    // Store encrypted key material for Lambda
    const encryptedKeyForLambda = encryptedKeyMaterial.toString('base64');
    console.log('\nEncrypted key material (base64 for Lambda):', encryptedKeyForLambda);

    // Import key material
    const importResult = await kmsClient.send(
      new ImportKeyMaterialCommand({
        KeyId: process.env.KMS_KEY_ID,
        ImportToken: params.ImportToken,
        EncryptedKeyMaterial: encryptedKeyMaterial,
        ExpirationModel: 'KEY_MATERIAL_EXPIRES',
        ValidTo: validTo
      })
    );

    console.log('\n✅ Successfully imported key material to KMS');
    return importResult;
  } catch (error) {
    console.error('\n❌ Error importing to KMS:', error);
    if (error.$metadata) {
      console.error('Request ID:', error.$metadata.requestId);
      console.error('HTTP Status Code:', error.$metadata.httpStatusCode);
      if (error.message) {
        console.error('Error message:', error.message);
      }
    }
    throw error;
  }
}

async function main() {
  try {
    const wallet = await generateWallet();
    await importToKMS(wallet.privateKey);

    console.log('\n✅ Wallet generation and KMS import completed successfully!');
    console.log('Network ID:', wallet.network.networkId);
    console.log('Chain ID:', wallet.network.chainId);
    console.log('Account:', wallet.account);
  } catch (error) {
    console.error('🔥 Error in main process:', error);
  }
}

main();
