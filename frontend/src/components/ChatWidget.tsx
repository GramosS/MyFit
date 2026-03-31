import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getToken } from "../lib/auth";

type ChatMsg = {
  id: string;
  role: "user" | "bot";
  text: string;
};

type FaqItem = {
  id: string;
  label: string;
  answer: (ctx: { isAuthed: boolean; path: string }) => { text: string; navigateTo?: string };
};

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [showFaq, setShowFaq] = useState(true);
  const token = getToken();
  const isAuthed = Boolean(token);
  const location = useLocation();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const faqs: FaqItem[] = useMemo(
    () => [
      {
        id: "what",
        label: "Vad kan jag göra i MyFit?",
        answer: () => ({
          text: "Du kan logga träning (pass + övningar), logga kost (kalorier + valfri maträtt), logga vikt och skriva anteckningar. Allt sparas per användare bakom inloggning.",
        }),
      },
      {
        id: "why-calories",
        label: "Varför ska man räkna kalorier?",
        answer: () => ({
          text: "Kalorier är energin du får i dig. Om ditt mål är gå ner/upp i vikt så är det energibalansen över tid som styr. Att logga gör det enklare att se mönster och hålla en rimlig nivå utan att gissa.",
          navigateTo: "/dashboard/nutrition",
        }),
      },
      {
        id: "how-to-start",
        label: "Hur kommer jag igång på 2 minuter?",
        answer: ({ isAuthed }) =>
          isAuthed
            ? {
                text: "1) Logga ett träningspass eller en måltid. 2) Logga vikt. 3) Kolla dashboarden för överblick. Vill du hoppa dit nu?",
                navigateTo: "/dashboard",
              }
            : {
                text: "Skapa konto, logga in och börja med 1 träningspass eller 1 måltid. Sen får du direkt överblick i dashboarden.",
              },
      },
      {
        id: "foods",
        label: "Hur funkar kostspårningen här?",
        answer: () => ({
          text: "Du loggar måltider som rader (frukost/lunch/middag/mellanmål) med kalorier och valfri maträtt. Du kan även söka livsmedel via Open Food Facts och lägga flera rätter i samma måltid.",
          navigateTo: "/dashboard/nutrition",
        }),
      },
      {
        id: "swedish-foods",
        label: "Varför finns “svenska” i livsmedelssök?",
        answer: () => ({
          text: "Open Food Facts är globalt. Med svenska-filter försöker appen visa produkter som är taggade för Sverige först. Om inga svenska träffar finns visas globala resultat som fallback.",
          navigateTo: "/dashboard/nutrition",
        }),
      },
      {
        id: "training-basics",
        label: "Hur ska jag tänka när jag loggar träning?",
        answer: () => ({
          text: "Logga pass med övningar, vikt, set och reps. För progression: försök höja vikt eller reps över tid på samma övning och följ kurvan i Träning.",
          navigateTo: "/dashboard/training",
        }),
      },
      {
        id: "protein",
        label: "Hur mycket protein behöver man?",
        answer: () => ({
          text: "Det beror på mål och kroppsvikt. En vanlig tumregel för styrketräning är ungefär 1.6–2.2 g protein per kg kroppsvikt och dag. Viktigast är att det funkar i vardagen och att du får i dig tillräckligt över tid.",
        }),
      },
      {
        id: "streak",
        label: "Vad betyder streaken i dashboarden?",
        answer: () => ({
          text: "Streaken räknar hur många dagar i rad bakåt från idag som du har minst ett träningspass loggat. Den bryts första dagen utan pass.",
          navigateTo: "/dashboard",
        }),
      },
      {
        id: "tips",
        label: "Ge mig ett snabbt tips för idag",
        answer: () => ({
          text: "Gör det lätt: logga en sak. Antingen ett träningspass eller en måltid idag. När vanan sitter kan du bygga vidare.",
        }),
      },
    ],
    []
  );

  const initialMessages = useMemo<ChatMsg[]>(
    () => [
      {
        id: uid(),
        role: "bot",
        text: "Hej! Välj en fråga nedan så svarar jag direkt.",
      },
    ],
    []
  );

  const [messages, setMessages] = useState<ChatMsg[]>(() => initialMessages);

  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [open, messages]);

  function ask(item: FaqItem) {
    setShowFaq(false);
    const userMsg: ChatMsg = { id: uid(), role: "user", text: item.label };
    const res = item.answer({ isAuthed, path: location.pathname });
    const botMsg: ChatMsg = { id: uid(), role: "bot", text: res.text };
    setMessages((prev) => [...prev, userMsg, botMsg]);

    if (res.navigateTo) {
      navigate(res.navigateTo);
    }
  }

  function clearChat() {
    setMessages(initialMessages);
    setShowFaq(true);
  }

  return (
    <div className="chat-widget" aria-live="polite">
      {open ? (
        <section className="chat-panel" role="dialog" aria-label="MyFit chat">
          <header className="chat-header">
            <div>
              <strong>MyFit</strong>
              <span className="chat-subtitle">Snabbhjälp</span>
            </div>
            <div className="chat-header-actions">
              <button className="chat-clear" type="button" onClick={clearChat} aria-label="Rensa chatten">
                Rensa
              </button>
              <button
                className="chat-menu"
                type="button"
                onClick={() => setShowFaq((v) => !v)}
                aria-label={showFaq ? "Dölj frågor" : "Visa frågor"}
                aria-expanded={showFaq}
              >
                ☰
              </button>
              <button className="chat-close" type="button" onClick={() => setOpen(false)} aria-label="Stäng chatten">
                ✕
              </button>
            </div>
          </header>

          <div className="chat-messages" ref={scrollRef}>
            {messages.map((m) => (
              <div key={m.id} className={"chat-msg " + (m.role === "user" ? "is-user" : "is-bot")}>
                <span>{m.text}</span>
              </div>
            ))}
          </div>

          {showFaq ? (
            <div className="chat-faq" aria-label="Frågor">
              {faqs.map((f) => (
                <button key={f.id} type="button" className="chat-faq-btn" onClick={() => ask(f)}>
                  {f.label}
                </button>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <button
        type="button"
        className="chat-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Stäng chat" : "Öppna chat"}
      >
        {open ? "–" : "💬"}
      </button>
    </div>
  );
}

