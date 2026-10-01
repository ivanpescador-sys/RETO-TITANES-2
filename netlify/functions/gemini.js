// Función de Netlify: recibe { prompt } desde la app y llama a Gemini.
// La llave NO va en el código: se guarda en Netlify como variable de entorno GEMINI_API_KEY.

const MODEL = "gemini-2.5-flash";

const headers = {
  "Content-Type": "application/json"
};

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Método no permitido" }) };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Falta GEMINI_API_KEY en Netlify" }) };
  }

  let prompt = "";
  try {
    prompt = (JSON.parse(event.body || "{}").prompt || "").toString();
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "JSON inválido" }) };
  }

  // Límite para que nadie use tu crédito con textos enormes
  if (!prompt || prompt.length > 600) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Prompt vacío o demasiado largo" }) };
  }

  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 200 }
        })
      }
    );
    const data = await res.json();
    // Se devuelve tal cual: la app lee data.candidates[0].content.parts[0].text
    return { statusCode: res.status, headers, body: JSON.stringify(data) };
  } catch (e) {
    return { statusCode: 502, headers, body: JSON.stringify({ error: "No se pudo contactar a Gemini" }) };
  }
};
