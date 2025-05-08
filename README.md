# Kadena Wallet Generator API

A simple API for generating Kadena wallets and signing transactions.

## API Endpoints

### Generate Wallet
```bash
POST /generate-wallet
```
Response:
```json
{
  "message": "Wallet generated successfully",
  "publicKey": "...",
  "privateKey": "..."
}
```

### Sign Transaction
```bash
POST /sign
```
Request Body:
```json
{
  "transaction": {
    "networkId": "mainnet01",
    "payload": {
      "exec": {
        "data": {
          "ks": {
            "pred": "keys-2",
            "keys": ["YOUR_PUBLIC_KEY"]
          }
        },
        "code": "(coin.transfer \"k:account\" \"k:account\" 1.0)"
      }
    }
  },
  "privateKey": "YOUR_PRIVATE_KEY"
}
```

## Deployment to Render.com

1. Fork this repository to your GitHub account
2. Go to [Render.com](https://render.com) and sign up/login
3. Click "New +" and select "Web Service"
4. Connect your GitHub repository
5. Configure the service:
   - Name: kadena-wallet-api
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
6. Click "Create Web Service"

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

The server will run on http://localhost:3000 