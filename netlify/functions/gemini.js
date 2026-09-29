export default async (req, context) => {
  try {
    const { prompt } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Falta API key" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      }
    );

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const config = { path: "/api/gemini" };
