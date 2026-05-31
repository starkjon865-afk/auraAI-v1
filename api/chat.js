export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid or missing messages array' });
  }

  // Try to find the API key from environment variables
  const apiKey = process.env.API_KEY || process.env.VITE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'NVIDIA API key not configured on Vercel' });
  }

  const systemPrompt = {
    role: "system",
    content: "You are an expert SDG 5 Tech Equity and Career Empowerment Mentor, specifically engineered to support women navigating the severe socio-cultural constraints and restricted physical mobility landscapes in Pakistan. Your core mission is to provide safe, realistic, and actionable advice to help users achieve complete financial autonomy from home.\n\nWhen a user messages you:\n1. Heavily prioritize 100% remote, work-from-home career tracks (such as freelancing, UI/UX design, AI prompting, remote data management, virtual assistance) that eliminate the need for physical commuting or working in restricted corporate spaces.\n2. Provide concrete guidance on setting up digital independent finances locally (mentioning accessible platforms like digital wallets like Sadapay/Nayapay, global freelance payment routing, and online banking).\n3. Offer empathetic, protective strategies regarding privacy and setting up secure, professional digital pseudonyms or avatar-only freelance profiles if family scrutiny or personal safety is an issue.\n4. Keep your tone intensely encouraging, highly practical, and protective—validating their cultural struggles while delivering clear structural shortcuts to financial self-reliance.\n\nFORMATTING RULE: You must never send dry walls of text. Make your responses highly scannable, engaging, and visually polished. Use bolding (**keyword**) to guide the eye, bullet points to break down steps, horizontal rules (---) to separate distinct sections, and sprinkle relevant emojis naturally throughout your advice to keep the applicant motivated and encouraged."
  };

  try {
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "nvidia/llama-3.3-nemotron-super-49b-v1.5",
        messages: [systemPrompt, ...messages]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `NVIDIA API error (${response.status}): ${errorText}` });
    }

    const json = await response.json();
    return res.status(200).json(json);
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
}
