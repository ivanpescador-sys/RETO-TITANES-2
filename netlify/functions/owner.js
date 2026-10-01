// Verifica el PIN del entrenador en el servidor.
// El PIN vive en Netlify como variable de entorno OWNER_PIN, no en el código.
const crypto = require("crypto");

const headers = { "Content-Type": "application/json" };

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ ok: false }) };
  }
  const real = process.env.OWNER_PIN;
  if (!real) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: "Falta OWNER_PIN en Netlify" }) };
  }
  let pin = "";
  try { pin = String(JSON.parse(event.body || "{}").pin || ""); } catch (e) {}

  const a = crypto.createHash("sha256").update(pin).digest();
  const b = crypto.createHash("sha256").update(real).digest();
  const ok = crypto.timingSafeEqual(a, b);

  if (!ok) await new Promise((r) => setTimeout(r, 800)); // frena intentos a lo bruto
  return { statusCode: 200, headers, body: JSON.stringify({ ok }) };
};
