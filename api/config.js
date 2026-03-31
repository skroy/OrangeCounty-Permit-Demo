export const config = { runtime: 'edge' };

export default function handler() {
  return new Response(
    JSON.stringify({ apiKey: process.env.GEMINI_API_KEY || '' }),
    { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
  );
}
