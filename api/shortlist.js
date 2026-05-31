export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { jobDescription, candidates } = req.body;
  if (!jobDescription || !candidates || !Array.isArray(candidates)) {
    return res.status(400).json({ error: 'Invalid or missing jobDescription or candidates' });
  }

  const apiKey = process.env.API_KEY || process.env.VITE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'NVIDIA API key not configured on Vercel' });
  }

  const systemPrompt = {
    role: "system",
    content: "You are an AI Recruitment Assistant for an SDG-5 tech equity platform. Analyze the employer's job description, cross-reference it with our anonymous candidate database, and return a clean, styled markdown list shortlisting the best matches. Explain briefly why their skills fit the job requirements perfectly, emphasizing remote capability."
  };

  const userPrompt = `Employer Job Description:\n${jobDescription}\n\nAnonymous Candidate Database:\n${candidates.map((c, i) => `Candidate #${i + 1}: ${c}`).join("\n")}`;

  try {
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "nvidia/llama-3.3-nemotron-super-49b-v1.5",
        messages: [
          systemPrompt,
          { role: "user", content: userPrompt }
        ]
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
