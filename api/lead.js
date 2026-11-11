// Vercel serverless function: receives the landing page forms and emails each lead to the studio.
//
// Environment variables (Vercel > Project > Settings > Environment Variables):
//   GMAIL_USER          Gmail address that sends the email, e.g. cncstudio45@gmail.com
//   GMAIL_APP_PASSWORD  16-character Google App Password for that account (not the normal password)
//   LEAD_TO             Where leads go. Defaults to cncstudio45@gmail.com
//   ALLOWED_ORIGINS     Optional. Comma-separated origins allowed to post from other domains

const nodemailer = require('nodemailer');

const LEAD_TO = process.env.LEAD_TO || 'cncstudio45@gmail.com';

const clean = (v, max = 300) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
const esc = (v) => clean(v, 2000).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function cors(req, res) {
  const origin = req.headers.origin || '';
  const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
}

module.exports = async (req, res) => {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  // Spam trap: real visitors never fill the hidden "company" field
  if (clean(body.company)) return res.status(200).json({ ok: true });

  const lead = {
    form: clean(body.form_type, 60) || 'Enquiry',
    name: clean(body.name, 80),
    email: clean(body.email, 120),
    phone: clean(body.phone, 24),
    page: clean(body.page, 500),
    title: clean(body.page_title, 200),
    referrer: clean(body.referrer, 500),
    tracking: body.tracking && typeof body.tracking === 'object' ? body.tracking : {},
    at: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }),
  };

  const digits = lead.phone.replace(/\D/g, '');
  if (lead.name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(lead.email) || digits.length < 7 || digits.length > 18) {
    return res.status(400).json({ ok: false, error: 'Please check your name, email and phone.' });
  }

  const tracking = Object.entries(lead.tracking).slice(0, 10).map(([k, v]) => [clean(k, 40), clean(v, 200)]);
  const rows = [
    ['Form', lead.form], ['Name', lead.name], ['Email', lead.email], ['Phone', lead.phone],
    ['Page', lead.page], ['Referrer', lead.referrer || 'Direct'], ['Received', lead.at + ' IST'],
    ...tracking,
  ];

  const html = `<div style="font-family:Arial,sans-serif;max-width:560px">
  <h2 style="margin:0 0 4px;color:#9B2D2D">New lead: ${esc(lead.form)}</h2>
  <p style="margin:0 0 16px;color:#555">From the ${esc(lead.title || 'landing page')}</p>
  <table cellpadding="8" style="border-collapse:collapse;width:100%;font-size:14px">
    ${rows.map(([k, v]) => `<tr><td style="border-bottom:1px solid #eee;color:#777;width:120px">${esc(k)}</td><td style="border-bottom:1px solid #eee;color:#111"><b>${esc(v)}</b></td></tr>`).join('')}
  </table>
  <p style="margin-top:16px"><a href="tel:${esc(digits ? '+' + digits : '')}" style="background:#AE1717;color:#fff;padding:10px 16px;border-radius:999px;text-decoration:none">Call ${esc(lead.name)}</a></p>
</div>`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n');

  try {
    const dry = process.env.LEAD_DRY_RUN === '1'; // local testing only: builds the email without sending it
    if (!dry && (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD)) throw new Error('Email is not configured');
    const transport = dry
      ? nodemailer.createTransport({ jsonTransport: true })
      : nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD } });
    const info = await transport.sendMail({
      from: `"CNC Website Leads" <${process.env.GMAIL_USER || LEAD_TO}>`,
      to: LEAD_TO,
      replyTo: `"${lead.name.replace(/"/g, '')}" <${lead.email}>`,
      subject: `New lead: ${lead.form} - ${lead.name} (${lead.phone})`,
      text,
      html,
    });
    if (dry) console.log('DRY RUN email', info.message);
  } catch (e) {
    console.error('Lead email failed', e && e.message);
    return res.status(500).json({ ok: false, error: 'Could not send right now' });
  }

  return res.status(200).json({ ok: true });
};
