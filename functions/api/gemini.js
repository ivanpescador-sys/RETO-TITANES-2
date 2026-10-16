// Cloudflare Pages Function: responde en /api/gemini
// La llave vive en Cloudflare como secreto GEMINI_API_KEY, no en el código.

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });

// Modelos a probar en orden: el configurado y dos de respaldo
function modelList(env) {
  const list = [env.GEMINI_MODEL, "gemini-3.5-flash",]
    .map((m) => String(m || "").trim())
    .filter(Boolean);
  return [...new Set(list)];
}

export async function onRequestPost({ request, env }) {
  if (!env.GEMINI_API_KEY) return json({ error: "Falta GEMINI_API_KEY" }, 500);

  let prompt = "";
  try {
    prompt = String((await request.json()).prompt || "");
  } catch (e) {
    return json({ error: "JSON inválido" }, 400);
  }
  // Límite para que nadie gaste tu crédito con textos enormes
  if (!prompt || prompt.length > 600) return json({ error: "Prompt vacío o demasiado largo" }, 400);

  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json", maxOutputTokens: 1000 },
  });

  let lastStatus = 0;
  let lastDetail = "";

  for (const model of modelList(env)) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
          body,
        }
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.candidates) {
        // Misma forma que espera la app
        return json(data, 200);
      }
      lastStatus = res.status;
      lastDetail = `${model}: ${(data && data.error && data.error.message) || res.statusText}`;
      // 404 (modelo no existe), 429 (cuota) o 503 (saturado): probar el siguiente modelo
      if ([404, 429, 503].includes(res.status)) continue;
      break; // otro error (clave inválida, etc.): no tiene caso seguir
    } catch (e) {
      lastDetail = `${model}: ${e.message}`;
    }
  }

  return json({ error: "Gemini no respondió", status: lastStatus, detail: lastDetail }, 502);
}
