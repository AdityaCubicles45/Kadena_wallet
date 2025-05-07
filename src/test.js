import { handler } from './lambda.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const testTransaction = {
  transaction: "{\"networkId\":\"mainnet01\",\"payload\":{\"exec\":{\"data\":{\"user-ks\":{\"pred\":\"keys-all\",\"keys\":[\"f4453e9aa6c5dbf7d1b3095f0164c68a81996ecb1c6830e932e1db293b2fc9c0\"]},\"token0Amount\":\"0.500000000000\",\"token1Amount\":\"0.000452376606\",\"token0AmountWithSlippage\":\"0.500000000000\",\"token1AmountWithSlippage\":\"0.000450114722\"},\"code\":\"(kaddex.exchange.swap-exact-in \\n          (read-decimal 'token0Amount) \\n          (read-decimal 'token1AmountWithSlippage) \\n          [coin n_582fed11af00dc626812cd7890bb88e72067f28c.bro] \\n          \\\"k:f4453e9aa6c5dbf7d1b3095f0164c68a81996ecb1c6830e932e1db293b2fc9c0\\\" \\n          \\\"k:f4453e9aa6c5dbf7d1b3095f0164c68a81996ecb1c6830e932e1db293b2fc9c0\\\" \\n          (read-keyset 'user-ks))\"}},\"signers\":[{\"pubKey\":\"f4453e9aa6c5dbf7d1b3095f0164c68a81996ecb1c6830e932e1db293b2fc9c0\",\"scheme\":\"ED25519\",\"clist\":[{\"name\":\"coin.GAS\",\"args\":[]},{\"name\":\"coin.TRANSFER\",\"args\":[\"k:f4453e9aa6c5dbf7d1b3095f0164c68a81996ecb1c6830e932e1db293b2fc9c0\",\"P1J6eqZteaU19umFecSjpEuc7Pea79SdDzz2Vp9LOpc\",0.5]}]}],\"meta\":{\"chainId\":\"2\",\"sender\":\"k:f4453e9aa6c5dbf7d1b3095f0164c68a81996ecb1c6830e932e1db293b2fc9c0\",\"gasLimit\":10000,\"gasPrice\":0.000001,\"ttl\":28800,\"creationTime\":1746633884},\"nonce\":\"swap:1746633893674:k87wbloq83s\"}"
};

async function test() {
  try {
    console.log('Testing Lambda function with transaction...');
    const result = await handler(testTransaction);
    console.log('Lambda response:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Test failed:', error);
  }
}

test(); 