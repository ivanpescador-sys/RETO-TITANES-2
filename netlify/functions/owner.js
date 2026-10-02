// Cloudflare Pages Function: responde en /api/owner
// Verifica el PIN del entrenador. Vive en Cloudflare como secreto OWNER_PIN.

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return new Uint8Array(buf);
}

export async function onRequestPost({ request, env }) {
  if (!env.OWNER_PIN) return json({ ok: false, error: "Falta OWNER_PIN" }, 500);

  let pin = "";
  try {
    pin = String((await request.json()).pin || "");
  } catch (e) {}

  const a = await sha256(pin);
  const b = await sha256(String(env.OWNER_PIN));
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  const ok = diff === 0;

  if (!ok) await new Promise((r) => setTimeout(r, 800)); // frena intentos a lo bruto
  return json({ ok });
}
