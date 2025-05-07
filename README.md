# Kadena Wallet Generator with AWS KMS Integration

This project generates a Kadena wallet and securely stores the private key in AWS KMS (Key Management Service). It provides a secure way to manage Kadena wallet keys using AWS's managed key service.

## Features

- Generate Kadena wallet with public and private keys
- Create Kadena account address
- Securely store private key in AWS KMS
- Automatic key encryption and import
- Key material expiration management

## Prerequisites

- Node.js (v16+)
- AWS Account with KMS access
- AWS CLI configured with appropriate credentials

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd kadena-wallet-kms
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with your AWS credentials:
```
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=your_region
KMS_KEY_ID=your_kms_key_id
```

## AWS KMS Setup

1. Create a KMS key:
   - Go to AWS KMS Console
   - Click "Create key"
   - Choose "Symmetric" key type
   - Set key alias (e.g., "kadena-wallet-key")
   - Set key administrative permissions
   - Set key usage permissions
   - Note down the Key ID

2. Configure IAM permissions:
   - Ensure your IAM user/role has these permissions:
     - `kms:CreateKey`
     - `kms:ImportKeyMaterial`
     - `kms:GetParametersForImport`
     - `kms:DescribeKey`
     - `kms:ListKeys`
     - `kms:ListAliases`

## Usage

Run the application:
```bash
npm start
```

The script will:
1. Generate a new Kadena wallet
2. Display the public key, private key, and account address
3. Import the private key into AWS KMS
4. Show the KMS import confirmation

Example output:
```
Generated Kadena Wallet:
Public Key: 059b0a13a8ea6dea90cd1d215669ea6b0c67cd07d3e0249092bbd794ed1bfc03
Private Key: 059e481475469373224a5abce161cbbe1f0917e855882d82573a67e246fc703d
Kadena Account: k:059b0a13a8ea6dea90cd1d215669ea6b0c67cd07d3e0249092bbd794ed1bfc03
Successfully imported key to KMS: {
  KeyMaterialId: '6cf8e0664ce209b3b3a2cd1257ccbb581d87708c9bf5a2396e7e2177bea53145'
}
```

## Security Features

1. **Key Generation**:
   - Uses `@kadena/hd-wallet` for secure key generation
   - Generates cryptographically secure random keys

2. **KMS Integration**:
   - Private key is encrypted before transmission
   - Uses RSA-OAEP encryption for key material
   - Sets key material expiration (1 year by default)
   - Leverages AWS KMS for secure key storage

3. **Best Practices**:
   - Never stores private keys in plain text
   - Uses environment variables for sensitive data
   - Implements proper error handling
   - Follows AWS KMS security best practices

## Project Structure

```
kadena-wallet-kms/
├── src/
│   └── index.js      # Main application code
├── .env              # Environment variables (create this)
├── package.json      # Project dependencies
└── README.md         # This file
```

## Dependencies

- `@kadena/hd-wallet`: For Kadena wallet generation
- `@aws-sdk/client-kms`: For AWS KMS integration
- `dotenv`: For environment variable management
- `crypto`: For key encryption (Node.js built-in)

## Error Handling

The application includes error handling for:
- Wallet generation failures
- KMS import failures
- Environment variable validation
- Key encryption errors

## Security Notes

- Never commit your `.env` file
- Store your private keys securely
- Use AWS KMS for production environments
- Consider using AWS IAM roles instead of access keys
- Regularly rotate your AWS access keys
- Monitor KMS usage through AWS CloudTrail

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT

## Support

For issues and feature requests, please create an issue in the repository. 