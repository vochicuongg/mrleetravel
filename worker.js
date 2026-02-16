/**
 * Mr Lee Travel — Cloudflare Worker
 * Nhận thông tin đặt xe từ website và gửi đến Telegram Bot.
 * 
 * SETUP:
 * 1. Vào Cloudflare Dashboard > Workers & Pages > Create Worker
 * 2. Copy toàn bộ code này vào editor
 * 3. Vào Settings > Variables > Add:
 *    - TELEGRAM_BOT_TOKEN = 8312475945:AAGJDDqCG-UV-pxTT7Wfx4UAD4A591IvJBY (đặt là Encrypt)
 *    - TELEGRAM_CHAT_ID = 277626569
 * 4. Deploy và lấy URL worker (VD: https://mrlee-bot.your-subdomain.workers.dev)
 * 5. Cập nhật WORKER_URL trong app.js
 */

export default {
    async fetch(request) {
        // CORS preflight
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
            return jsonResponse({ error: 'Method not allowed' }, 405);
        }

        try {
            const data = await request.json();

            // Format timestamp (UTC+7)
            const now = new Date(Date.now() + 7 * 60 * 60 * 1000);
            const timestamp = `${pad(now.getUTCDate())}/${pad(now.getUTCMonth() + 1)}/${now.getUTCFullYear()} ${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}`;

            const text = [
                `🚀 <b>ĐƠN ĐẶT XE MỚI</b>`,
                `━━━━━━━━━━━━━━━`,
                `👤 <b>Tên KH:</b> ${esc(data.name)}`,
                `📱 <b>SĐT:</b> ${esc(data.phone)}`,
                `🚗 <b>Xe:</b> ${esc(data.vehicle)}`,
                `💰 <b>Giá:</b> ${esc(data.price)}`,
                `📅 <b>Ngày:</b> ${esc(data.date)}`,
                `⏰ <b>Giờ:</b> ${esc(data.time)}`,

                `🚚 <b>Giao xe:</b> ${esc(data.delivery)}`,
                data.notes ? `📝 <b>Ghi chú:</b> ${esc(data.notes)}` : '',
                `━━━━━━━━━━━━━━━`,
                `🕐 ${timestamp}`,
            ].filter(Boolean).join('\n');

            // Send to Telegram
            const BOT_TOKEN = '8312475945:AAGJDDqCG-UV-pxTT7Wfx4UAD4A591IvJBY';
            const CHAT_ID = '277626569';

            const res = await fetch(
                `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: CHAT_ID,
                        text,
                        parse_mode: 'HTML',
                    }),
                }
            );

            const result = await res.json();
            if (!result.ok) {
                return jsonResponse({ success: false, error: result.description }, 500);
            }

            return jsonResponse({ success: true });
        } catch (err) {
            return jsonResponse({ success: false, error: err.message }, 500);
        }
    },
};

function pad(n) { return String(n).padStart(2, '0'); }
function esc(s) { return s ? String(s).replace(/</g, '&lt;').replace(/>/g, '&gt;') : '—'; }

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
    });
}
