// Cloudflare Pages Function: responde en /api/gemini
// La llave vive en Cloudflare como secreto GEMINI_API_KEY, no en el código.

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });

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

  const model = env.GEMINI_MODEL || "gemini-2.5-flash";
  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 200 }
        })
      }
    );
    // Se devuelve tal cual: la app lee data.candidates[0].content.parts[0].text
    return json(await res.json(), res.status);
  } catch (e) {
    return json({ error: "No se pudo contactar a Gemini" }, 502);
  }
}
