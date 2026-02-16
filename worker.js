// Cloudflare Worker - Telegram Booking Proxy
// Token and Chat ID must be set in Cloudflare Settings > Variables and Secrets

export default {
    async fetch(request, env) {
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
            });
        }

        if (request.method !== 'POST') {
            return new Response('Method not allowed', { status: 405 });
        }

        try {
            const data = await request.json();
            const { message } = data;

            if (!message) {
                return new Response(JSON.stringify({ error: 'Missing message' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                });
            }

            const telegramUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
            const telegramResponse = await fetch(telegramUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: env.TELEGRAM_CHAT_ID,
                    text: message,
                    parse_mode: 'HTML',
                }),
            });

            const result = await telegramResponse.json();

            return new Response(JSON.stringify({ success: result.ok }), {
                status: result.ok ? 200 : 500,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            });
        } catch (error) {
            return new Response(JSON.stringify({ error: 'Internal error' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            });
        }
    },
};
