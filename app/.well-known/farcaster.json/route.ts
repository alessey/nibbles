export async function GET() {
  const URL = process.env.NEXT_PUBLIC_URL;

  return Response.json({
    "accountAssociation": {
      "header": process.env.FARCASTER_HEADER,
      "payload": process.env.FARCASTER_PAYLOAD,
      "signature": process.env.FARCASTER_SIGNATURE
    },
    "frame": {
      "version": process.env.NEXT_PUBLIC_VERSION,
      "name": process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
      "homeUrl": URL,
      "iconUrl": "https://onchainkit.xyz/favicon/48x48.png",
      "imageUrl": `${URL}/minikit.png`,
      "buttonTitle": `Launch ${process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME}`,
      "splashImageUrl": `${URL}/minikit.png`,
      "splashBackgroundColor": "#FFFFFF",
      "webhookUrl": `${URL}/api/webhook`
    }
  });
}