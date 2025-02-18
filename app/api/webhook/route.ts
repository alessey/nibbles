import { deleteUserNotificationDetails } from '@/lib/notification';
import { sendFrameNotification } from '@/lib/notification-client';
import { setUserNotificationDetails } from '@/lib/notification';
import { getSSLHubRpcClient } from '@farcaster/hub-nodejs';
import { http } from 'viem';
import { createPublicClient } from 'viem';
import { verifyMessage } from 'viem';
import { optimism } from 'viem/chains';

const appName = process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME;

// ID Registry Contract
const ID_REGISTRY_ADDRESS = '0x00000000Fc6c5F01Fc30151999387Bb99A9f489b';
const ID_REGISTRY_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "fid", "type": "uint256"}],
    "name": "custodyOf",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
];


async function verifyFidOwnership(fid: number, appKey: `0x${string}`) {
  const client = getSSLHubRpcClient('nemes.farcaster.xyz:2283');
  const response = await client.getOnChainSignersByFid({ fid });
  
  if (response.isOk()) {
    const events = response.value.events;
    return events.some(event => {
      const keyBuffer = event.signerEventBody?.key;
      if (!keyBuffer) {
        return false;
      }

      const keyHex = `0x${Buffer.from(keyBuffer).toString('hex')}`;
      return keyHex.toLowerCase() === appKey.toLowerCase();
    });
  }
  
  return false;
}

async function verifyTwo(requestJson: {
  header: string;
  payload: string;
  signature: string;
}) {
  const {
    header: encodedHeader,
    payload: encodedPayload,
    signature: encodedSignature,
  } = requestJson;


  const headerData = decode(encodedHeader);
  const event = decode(encodedPayload);
  const signature = decode(encodedSignature);

  console.log('headerData', headerData);
  console.log('event', event);
  console.log('signature', signature);
  
  const { fid, type, key } = headerData;
  
 
  // Decode and validate payload
  console.log('Payload data:', event);
  
    console.log('\nStep 3: Verifying signature...');
    console.log({
      type,
      key,
      message: `${encodedHeader}.${encodedPayload}`,
      signature: encodedSignature,
    })
    
    // Verify the signature
    const valid = await verifyMessage({
      address: key,
      message: `${encodedHeader}.${encodedPayload}`,
      signature: signature,
    });
  
    if (!valid) {
      throw new Error("Invalid signature");
    }
    console.log('✅ Signature is valid');
  
    console.log('\nStep 4: Verifying custody address from ID Registry...');
    // Create a client to interact with the ID Registry contract
    const client = createPublicClient({
      chain: optimism,
      transport: http(),
    });
  
    // Query the ID Registry contract
    const resolvedCustodyAddress = await client.readContract({
      address: ID_REGISTRY_ADDRESS,
      abi: ID_REGISTRY_ABI,
      functionName: 'custodyOf',
      args: [BigInt(fid)],
    });

    console.log('Resolved custody address:', resolvedCustodyAddress);
    console.log('Signer from header:', key);

}

function decode(encoded: string) {
  return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8'));
}

export async function POST(request: Request) {
  const requestJson = await request.json();
  console.log('requestJson', requestJson);

  await verifyTwo(requestJson);
  
  const {
    header: encodedHeader,
    payload: encodedPayload,
  } = requestJson;

  const headerData = decode(encodedHeader);
  const event = decode(encodedPayload);

  const { fid, type, key } = headerData;
  console.log('fid', fid);
  console.log('type', type);
  console.log('key', key);
  // verify the app key is owned by the fid
  const valid = await verifyFidOwnership(fid, key);
  console.log('valid', valid);

  if (!valid) {
    return Response.json({ success: false, error: 'Invalid FID ownership' }, { status: 401 });
  }

  switch (event.event) {
    case "frame_added":
      if (event.notificationDetails) {
        console.log("frame_added", "event.notificationDetails", event.notificationDetails);
        await setUserNotificationDetails(fid, event.notificationDetails);
        await sendFrameNotification({
          fid,
          title: `Welcome to ${appName}`,
          body: `Thank you for adding ${appName}`,
        });
      } else {
        console.log("frame_added", "event.notificationDetails", event.notificationDetails);
          await deleteUserNotificationDetails(fid);
        }

      break;
    case "frame_removed": {
      console.log("frame_removed");
      await deleteUserNotificationDetails(fid);
      break;
    }
    case "notifications_enabled": {
      console.log("notifications_enabled", event.notificationDetails);
      await setUserNotificationDetails(fid, event.notificationDetails);
      await sendFrameNotification({
        fid,
        title: `Welcome to ${appName}`,
        body: `Thank you for enabling notifications for ${appName}`,
      });

      break;
    }
    case "notifications_disabled": {
      console.log("notifications_disabled");
      await deleteUserNotificationDetails(fid);

      break; 
    }
  }

  return Response.json({ success: true });
}


