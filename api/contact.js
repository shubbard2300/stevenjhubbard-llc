/* Contact form -> email, via the Resend HTTP API.
   One fetch, no SDK, so the site keeps its "no dependencies" property.

   Environment (set in Vercel -> Settings -> Environment Variables):
     RESEND_API_KEY  required  starts "re_"
     CONTACT_TO      required  destination inbox; kept out of this public repo
     CONTACT_FROM    optional  defaults to Resend's shared test sender, which
                               only delivers to your own Resend account email.
                               Verify stevenjhubbard.com in Resend and set this
                               to contact@stevenjhubbard.com for a real From. */

var LIMIT = { name: 120, email: 200, message: 4000 };
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  var key  = process.env.RESEND_API_KEY;
  var to   = process.env.CONTACT_TO;
  var from = process.env.CONTACT_FROM || 'onboarding@resend.dev';
  if (!key || !to) {
    console.error('contact: RESEND_API_KEY and CONTACT_TO must both be set');
    return res.status(500).json({ error: 'The form is not configured yet' });
  }

  var b = req.body || {};

  /* Honeypot. A person never sees this field, so anything in it is a bot.
     Answer 200 so the bot records a success and does not retry. */
  if (b.company) return res.status(200).json({ ok: true });

  var name    = String(b.name    || '').trim();
  var email   = String(b.email   || '').trim();
  var message = String(b.message || '').trim();

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }
  if (name.length > LIMIT.name || email.length > LIMIT.email || message.length > LIMIT.message) {
    return res.status(400).json({ error: 'That is longer than the form accepts' });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'That email address does not look right' });
  }

  /* ponytail: honeypot only, no rate limit — a serverless function has no
     shared state to count against. If spam gets through, put Vercel's WAF or
     a KV-backed counter in front rather than growing this file. */

  var r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'stevenjhubbard.com <' + from + '>',
      to: [to],
      reply_to: email,
      subject: 'Site enquiry — ' + name,
      /* Plain text only: nothing a visitor typed is ever parsed as markup. */
      text: 'From: ' + name + ' <' + email + '>\n\n' + message
    })
  });

  if (!r.ok) {
    console.error('resend ' + r.status + ': ' + (await r.text()));
    return res.status(502).json({ error: 'Could not send right now' });
  }
  return res.status(200).json({ ok: true });
};
