/* Runnable check for the contact handler: node api/contact.test.js
   Stubs fetch and the Vercel res object; asserts the validation gates. */
var assert  = require('assert');
var handler = require('./contact.js');

process.env.RESEND_API_KEY = 're_test';
process.env.CONTACT_TO     = 'inbox@example.com';

var sent = null;
global.fetch = function (url, opts) {
  sent = JSON.parse(opts.body);
  return Promise.resolve({ ok: true, status: 200, text: function () { return Promise.resolve(''); } });
};

function mockRes() {
  var r = { code: null, body: null, headers: {} };
  r.status = function (c) { r.code = c; return r; };
  r.json   = function (b) { r.body = b; return r; };
  r.setHeader = function (k, v) { r.headers[k] = v; };
  return r;
}
function call(body, method) {
  var res = mockRes();
  return handler({ method: method || 'POST', body: body }, res).then(function () { return res; });
}

var ok = { name: 'Jane Okafor', email: 'jane@company.com', message: 'AEM migration, Q4.' };

Promise.resolve()
  .then(function () { return call(ok, 'GET'); })
  .then(function (r) { assert.strictEqual(r.code, 405, 'GET must be rejected'); })

  .then(function () { return call({ name: '', email: 'a@b.co', message: 'hi' }); })
  .then(function (r) { assert.strictEqual(r.code, 400, 'missing name must 400'); })

  .then(function () { return call({ name: 'A', email: 'not-an-email', message: 'hi' }); })
  .then(function (r) { assert.strictEqual(r.code, 400, 'bad email must 400'); })

  .then(function () { return call({ name: 'A'.repeat(121), email: 'a@b.co', message: 'hi' }); })
  .then(function (r) { assert.strictEqual(r.code, 400, 'over-length name must 400'); })

  .then(function () { sent = null; return call({ name: 'Bot', email: 'b@b.co', message: 'spam', company: 'ACME' }); })
  .then(function (r) {
    assert.strictEqual(r.code, 200, 'honeypot must look like success');
    assert.strictEqual(sent, null, 'honeypot must NOT send mail');
  })

  .then(function () { sent = null; return call(ok); })
  .then(function (r) {
    assert.strictEqual(r.code, 200, 'valid submission must succeed');
    assert.strictEqual(sent.reply_to, ok.email, 'reply_to must be the visitor');
    assert.deepStrictEqual(sent.to, ['inbox@example.com'], 'must send to CONTACT_TO');
    assert.ok(sent.text.indexOf(ok.message) > -1, 'body must carry the message');
    assert.ok(!sent.html, 'must be plain text only');
  })

  .then(function () { console.log('all contact-handler checks passed'); })
  .catch(function (e) { console.error('FAIL:', e.message); process.exit(1); });
