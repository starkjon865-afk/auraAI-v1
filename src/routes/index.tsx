import { createFileRoute } from "@tanstack/react-router";
import React, { useState } from "react";
import { createServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2, Send } from "lucide-react";

export const Route = createFileRoute("/")({
  component: UserView,
  head: () => ({
    meta: [{ title: "User Workspace · EquiTech" }],
  }),
});

const chatCompletionsServer = createServerFn({ method: "POST" })
  .inputValidator((d: { messages: { role: 'user' | 'assistant'; content: string }[] }) => d)
  .handler(async ({ data }) => {
    // Read the API key from import.meta.env.API_KEY (with process.env.API_KEY fallback for SSR compatibility)
    const apiKey = import.meta.env.API_KEY || process.env.API_KEY;
    if (!apiKey) {
      throw new Error("NVIDIA API key not found. Please set API_KEY in your .env file.");
    }

    const systemPrompt = {
      role: "system",
      content: "You are an expert SDG 5 Tech Equity and Career Empowerment Mentor, specifically engineered to support women navigating the severe socio-cultural constraints and restricted physical mobility landscapes in Pakistan. Your core mission is to provide safe, realistic, and actionable advice to help users achieve complete financial autonomy from home.\n\nWhen a user messages you:\n1. Heavily prioritize 100% remote, work-from-home career tracks (such as freelancing, UI/UX design, AI prompting, remote data management, virtual assistance) that eliminate the need for physical commuting or working in restricted corporate spaces.\n2. Provide concrete guidance on setting up digital independent finances locally (mentioning accessible platforms like digital wallets like Sadapay/Nayapay, global freelance payment routing, and online banking).\n3. Offer empathetic, protective strategies regarding privacy and setting up secure, professional digital pseudonyms or avatar-only freelance profiles if family scrutiny or personal safety is an issue.\n4. Keep your tone intensely encouraging, highly practical, and protective—validating their cultural struggles while delivering clear structural shortcuts to financial self-reliance."
    };

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${import.meta.env.API_KEY || process.env.API_KEY}`,
      },
      body: JSON.stringify({
        model: "nvidia/llama-3.3-nemotron-super-49b-v1.5",
        messages: [systemPrompt, ...data.messages]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`NVIDIA API error (${response.status}): ${errorText}`);
    }

    const json = await response.json();
    return json.choices?.[0]?.message?.content || "";
  });

// Custom lightweight React Markdown parser to render clean structured typography
function parseMarkdown(text: string) {
  if (!text) return null;

  const lines = text.split("\n");
  let inList = false;
  let listItems: React.ReactNode[] = [];
  const elements: React.ReactNode[] = [];

  const parseInline = (str: string) => {
    // Inline code parsing: `code`
    const parts = str.split(/`([^`]+)`/g);
    return parts.map((part, idx) => {
      if (idx % 2 === 1) {
        return (
          <code key={idx} className="bg-muted px-1.5 py-0.5 rounded text-xs text-primary border border-border font-mono font-medium">
            {part}
          </code>
        );
      }
      // Bold parsing: **bold**
      const boldParts = part.split(/\*\*([^*]+)\*\*/g);
      return boldParts.map((bPart, bIdx) => {
        if (bIdx % 2 === 1) {
          return <strong key={bIdx} className="font-semibold text-foreground">{bPart}</strong>;
        }
        return bPart;
      });
    });
  };

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();

    if (!trimmed) {
      if (inList) {
        elements.push(
          <ul key={`list-${lineIdx}`} className="list-disc pl-5 my-4 space-y-2 text-muted-foreground/90">
            {listItems}
          </ul>
        );
        listItems = [];
        inList = false;
      }
      return;
    }

    // Heading level 1: # Header
    if (trimmed.startsWith("# ")) {
      if (inList) {
        elements.push(<ul key={`list-${lineIdx}`} className="list-disc pl-5 my-4 space-y-2">{listItems}</ul>);
        listItems = [];
        inList = false;
      }
      elements.push(
        <h1 key={lineIdx} className="text-2xl font-bold text-foreground mt-6 mb-4 border-b border-border pb-2 tracking-tight">
          {parseInline(trimmed.slice(2))}
        </h1>
      );
    }
    // Heading level 2: ## Header
    else if (trimmed.startsWith("## ")) {
      if (inList) {
        elements.push(<ul key={`list-${lineIdx}`} className="list-disc pl-5 my-4 space-y-2">{listItems}</ul>);
        listItems = [];
        inList = false;
      }
      elements.push(
        <h2 key={lineIdx} className="text-xl font-bold text-foreground mt-5 mb-3 tracking-tight">
          {parseInline(trimmed.slice(3))}
        </h2>
      );
    }
    // Heading level 3: ### Header
    else if (trimmed.startsWith("### ")) {
      if (inList) {
        elements.push(<ul key={`list-${lineIdx}`} className="list-disc pl-5 my-4 space-y-2">{listItems}</ul>);
        listItems = [];
        inList = false;
      }
      elements.push(
        <h3 key={lineIdx} className="text-lg font-bold text-foreground mt-4 mb-2 tracking-tight">
          {parseInline(trimmed.slice(4))}
        </h3>
      );
    }
    // Bullet lists: - item or * item
    else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      inList = true;
      listItems.push(
        <li key={lineIdx} className="leading-relaxed">
          {parseInline(trimmed.slice(2))}
        </li>
      );
    }
    // Numbered lists: 1. item
    else if (/^\d+\.\s/.test(trimmed)) {
      if (inList) {
        elements.push(<ul key={`list-${lineIdx}`} className="list-disc pl-5 my-4 space-y-2">{listItems}</ul>);
        listItems = [];
        inList = false;
      }
      const content = trimmed.replace(/^\d+\.\s/, "");
      elements.push(
        <div key={lineIdx} className="pl-4 border-l-2 border-primary/40 my-3 py-1">
          <p className="text-sm font-medium text-foreground">{parseInline(content)}</p>
        </div>
      );
    }
    // Paragraphs
    else {
      if (inList) {
        elements.push(<ul key={`list-${lineIdx}`} className="list-disc pl-5 my-4 space-y-2">{listItems}</ul>);
        listItems = [];
        inList = false;
      }
      elements.push(
        <p key={lineIdx} className="my-3 leading-relaxed text-muted-foreground/90">
          {parseInline(trimmed)}
        </p>
      );
    }
  });

  if (inList) {
    elements.push(
      <ul key={`list-end`} className="list-disc pl-5 my-4 space-y-2 text-muted-foreground/90">
        {listItems}
      </ul>
    );
  }

  return elements;
}

function UserView() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    {
      role: 'assistant',
      content: "Welcome! I am your SDG 5 Equity Mentor powered by NVIDIA. Let's start building your custom upskilling roadmap together."
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Auto-scroll to bottom of chat
  const chatEndRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const updatedMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const result = await chatCompletionsServer({
        data: { messages: updatedMessages }
      });

      if (result) {
        setMessages([...updatedMessages, { role: 'assistant' as const, content: result }]);
      } else {
        setMessages([
          ...updatedMessages,
          { role: 'assistant' as const, content: "I'm sorry, I encountered an issue generating a response. Please try sending your message again." }
        ]);
      }
    } catch (err) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setMessages([
        ...updatedMessages,
        {
          role: 'assistant' as const,
          content: `An error occurred: ${errMsg}. Please verify that API_KEY is set correctly in your .env file and restart the development server.`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto flex flex-col h-[calc(100vh-80px)]">
      <header className="mb-6 shrink-0">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary mb-2">
          <Sparkles className="h-3.5 w-3.5" />
          SDG 5 Equity Workspace
        </div>
        <h1 className="text-3xl lg:text-4xl font-semibold">Your upskilling mentor.</h1>
        <p className="mt-1 text-muted-foreground text-sm max-w-2xl">
          Powered by DeepSeek. Work with your mentor to calibrate a week-by-week upskilling path that aggressively closes representation gaps in high-paying tech domains.
        </p>
      </header>

      {/* Chat Window */}
      <div className="flex-1 min-h-0 border border-border bg-card/60 backdrop-blur-md rounded-2xl relative overflow-hidden shadow-2xl flex flex-col mb-4">
        {/* Background Grid Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, var(--primary) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Message area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-primary/20">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 animate-fade-in ${msg.role === "user" ? "justify-end text-right" : "justify-start text-left"
                }`}
            >
              {msg.role === "assistant" && (
                <div className="h-8 w-8 rounded-lg bg-[image:var(--gradient-primary)] flex items-center justify-center shadow-[var(--shadow-glow)] shrink-0 mt-0.5">
                  <Sparkles className="h-4 w-4 text-primary-foreground animate-pulse" />
                </div>
              )}
              <div
                className={`rounded-2xl px-4 py-3 shadow-lg max-w-[80%] text-sm leading-relaxed ${msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-none font-medium ml-auto"
                    : "bg-muted/90 border border-border/40 text-foreground/90 rounded-tl-none mr-auto prose prose-invert max-w-none"
                  }`}
              >
                {msg.role === "assistant" ? parseMarkdown(msg.content) : msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-3 animate-fade-in">
              <div className="h-8 w-8 rounded-lg bg-[image:var(--gradient-primary)] flex items-center justify-center shadow-[var(--shadow-glow)] shrink-0 mt-0.5 animate-spin">
                <Loader2 className="h-4 w-4 text-primary-foreground animate-spin" />
              </div>
              <div className="rounded-2xl rounded-tl-none px-4 py-3 bg-muted/90 border border-border/40 text-muted-foreground text-sm shadow-lg flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                <span className="h-2 w-2 rounded-full bg-primary animate-bounce" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input box */}
        <form onSubmit={handleSend} className="p-4 border-t border-border bg-card/80 backdrop-blur-md flex items-center gap-3 shrink-0">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your DeepSeek mentor anything about breaking into tech..."
            disabled={isLoading}
            className="flex-1 bg-background/60 border-border/60 focus-visible:ring-primary focus-visible:ring-1 placeholder:text-muted-foreground/50 rounded-xl px-4 py-3 text-sm h-12 transition"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="h-12 w-12 rounded-xl bg-primary text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center shrink-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
