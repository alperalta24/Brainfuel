import { useState, useCallback } from "react";

const TOPICS = [
  { id: "quantum", label: "⚛️ Quantum Mechanics", color: "#7C3AED" },
  { id: "ai_usage", label: "🤖 How to Use AI", color: "#2563EB" },
  { id: "history", label: "🏛️ Greek & Roman History", color: "#B45309" },
  { id: "mythology", label: "🐉 Mythology", color: "#065F46" },
  { id: "religion_origins", label: "✝️ Origins of Religion", color: "#9D174D" },
  { id: "pre_christ", label: "📜 Ideas Before Christ", color: "#7F1D1D" },
  { id: "science", label: "🔬 Science", color: "#1D4ED8" },
  { id: "politics", label: "🗳️ Current Politics", color: "#DC2626" },
  { id: "investing", label: "📈 Investing", color: "#166534" },
  { id: "entrepreneurship", label: "🚀 Entrepreneurship", color: "#D97706" },
];

const DIFFICULTIES = ["Easy", "Medium", "Hard"];

const SYSTEM_PROMPT = `You are a trivia question generator. Return ONLY a valid JSON object with no markdown, no backticks, no explanation.

Format:
{
  "question": "...",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "correct": "A",
  "explanation": "2-3 sentence explanation of the answer and why it matters."
}

Rules:
- Make questions engaging and intellectually interesting
- Current Politics: focus on US 2025-2026, Trump administration, world events
- Origins of Religion: secular/anthropological angle - how beliefs evolved, pre-Christian parallels, comparative religion
- How to Use AI: practical tools, prompting strategies, building apps, use cases
- Investing: 2025-2026 market trends, strategies, opportunities, concepts
- Quantum Mechanics: real science, thought experiments, implications
- Vary styles: factual, conceptual, which is true, cause-and-effect
- correct field = just the letter: A, B, C, or D`;

export default function BrainFuel() {
  const [screen, setScreen] = useState("home");
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [difficulty, setDifficulty] = useState("Medium");
  const [question, setQuestion] = useState(null);
  const [chosen, setChosen] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [currentTopic, setCurrentTopic] = useState(null);
  const [showExp, setShowExp] = useState(false);
  const [history, setHistory] = useState([]);

  const toggleTopic = (id) =>
    setSelectedTopics((p) => p.includes(id) ? p.filter((t) => t !== id) : [...p, id]);

  const pickTopic = useCallback(() => {
    const pool = selectedTopics.length > 0 ? selectedTopics : TOPICS.map((t) => t.id);
    return pool[Math.floor(Math.random() * pool.length)];
  }, [selectedTopics]);

  const fetchQ = useCallback(async (topicId) => {
    setLoading(true);
    setError(null);
    setChosen(null);
    setShowExp(false);
    setQuestion(null);
    const topic = TOPICS.find((t) => t.id === topicId);
    const recent = history.slice(-4).map((h) => h.q).join(" | ");
    const prompt = `Generate a ${difficulty} trivia question about: ${topic.label.replace(/^\S+\s/, "")}.${recent ? ` Avoid repeating themes from: ${recent}` : ""} Return ONLY valid JSON.`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const raw = data.content?.find((b) => b.type === "text")?.text || "";
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      setQuestion(parsed);
      setCurrentTopic(topic);
    } catch {
      setError("Couldn't load a question. Tap retry.");
    } finally {
      setLoading(false);
    }
  }, [difficulty, history]);

  const startGame = () => {
    setScore(0); setStreak(0); setTotal(0); setHistory([]);
    const t = pickTopic();
    setScreen("quiz");
    fetchQ(t);
  };

  const answer = (letter) => {
    if (chosen) return;
    setChosen(letter);
    setShowExp(true);
    const ok = letter === question.correct;
    setStreak((s) => ok ? s + 1 : 0);
    setScore((s) => ok ? s + (difficulty === "Easy" ? 1 : difficulty === "Medium" ? 2 : 3) : s);
    setTotal((t) => t + 1);
    setHistory((h) => [...h, { q: question.question, ok }]);
  };

  const next = () => fetchQ(pickTopic());

  const btnStyle = (letter) => {
    const base = {
      width: "100%", padding: "14px 16px", borderRadius: "12px",
      border: "2px solid #2a2a3e", cursor: chosen ? "default" : "pointer",
      fontSize: "15px", textAlign: "left", marginBottom: "10px",
      background: "#1a1a2e", color: "#ccc", transition: "all 0.15s",
    };
    if (!chosen) return base;
    if (letter === question.correct) return { ...base, background: "#14532d", borderColor: "#22c55e", color: "#fff" };
    if (letter === chosen) return { ...base, background: "#7f1d1d", borderColor: "#ef4444", color: "#fff" };
    return { ...base, opacity: 0.4 };
  };

  const s = { fontFamily: "system-ui,sans-serif", background: "#08080f", minHeight: "100vh", color: "#e0e0e0", padding: "20px" };

  if (screen === "home") return (
    <div style={s}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ textAlign: "center", padding: "20px 0 32px" }}>
          <div style={{ fontSize: 56 }}>🧠</div>
          <h1 style={{ color: "#fff", fontSize: 30, fontWeight: 800, margin: "8px 0 4px" }}>BrainFuel</h1>
          <p style={{ color: "#555", fontSize: 15, margin: 0 }}>AI trivia that actually teaches you something</p>
        </div>

        {total > 0 && (
          <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
            {[["🔥", streak, "Streak"], ["⭐", score, "Score"], ["✅", total, "Answered"]].map(([icon, val, label]) => (
              <div key={label} style={{ flex: 1, background: "#1a1a2e", borderRadius: 12, padding: 14, textAlign: "center", border: "1px solid #2a2a3e" }}>
                <div style={{ fontSize: 22 }}>{icon}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#fff" }}>{val}</div>
                <div style={{ fontSize: 11, color: "#444", marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: "#444", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 10 }}>Difficulty</div>
          <div style={{ display: "flex", gap: 10 }}>
            {DIFFICULTIES.map((d) => (
              <button key={d} onClick={() => setDifficulty(d)} style={{
                flex: 1, padding: "10px 0", borderRadius: 10, border: `2px solid ${difficulty === d ? "#7C3AED" : "#2a2a3e"}`,
                background: difficulty === d ? "#7C3AED" : "#1a1a2e", color: difficulty === d ? "#fff" : "#555",
                cursor: "pointer", fontWeight: 700, fontSize: 14,
              }}>{d}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, color: "#444", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 10 }}>
            Topics {selectedTopics.length === 0 ? "(all)" : `(${selectedTopics.length} selected)`}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {TOPICS.map((t) => {
              const sel = selectedTopics.includes(t.id);
              return (
                <button key={t.id} onClick={() => toggleTopic(t.id)} style={{
                  background: sel ? t.color : "#1a1a2e", border: `2px solid ${sel ? t.color : "#2a2a3e"}`,
                  borderRadius: 12, padding: "12px 14px", color: sel ? "#fff" : "#666",
                  cursor: "pointer", fontSize: 13, fontWeight: sel ? 700 : 400, textAlign: "left",
                }}>{t.label}</button>
              );
            })}
          </div>
          {selectedTopics.length > 0 && (
            <button onClick={() => setSelectedTopics([])} style={{ marginTop: 8, background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 13 }}>
              Clear selection
            </button>
          )}
        </div>

        <button onClick={startGame} style={{
          width: "100%", padding: 18, borderRadius: 14,
          background: "linear-gradient(135deg,#7C3AED,#2563EB)",
          border: "none", color: "#fff", fontSize: 18, fontWeight: 800, cursor: "pointer",
        }}>
          {total > 0 ? "Play Again 🔄" : "Start Playing 🚀"}
        </button>
      </div>
    </div>
  );

  return (
    <div style={s}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <button onClick={() => setScreen("home")} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 14 }}>← Home</button>
          <div style={{ display: "flex", gap: 18, fontSize: 14 }}>
            <span>🔥 <strong style={{ color: "#fff" }}>{streak}</strong></span>
            <span>⭐ <strong style={{ color: "#fff" }}>{score}</strong></span>
            <span style={{ color: "#333" }}>Q{total + 1}</span>
          </div>
        </div>

        {currentTopic && (
          <div style={{
            display: "inline-block", marginBottom: 16,
            background: currentTopic.color + "22", border: `1px solid ${currentTopic.color}55`,
            borderRadius: 999, padding: "4px 14px", fontSize: 13, color: currentTopic.color, fontWeight: 700,
          }}>{currentTopic.label}</div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "100px 0" }}>
            <div style={{ fontSize: 44, marginBottom: 16 }}>⚙️</div>
            <p style={{ color: "#444" }}>Generating question...</p>
          </div>
        )}

        {error && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ color: "#ef4444", marginBottom: 16 }}>{error}</p>
            <button onClick={() => fetchQ(currentTopic?.id || pickTopic())} style={{
              padding: "12px 28px", borderRadius: 10, background: "#7C3AED", border: "none", color: "#fff", cursor: "pointer", fontWeight: 700,
            }}>Retry</button>
          </div>
        )}

        {!loading && !error && question && (
          <>
            <div style={{ background: "#1a1a2e", borderRadius: 16, padding: "20px 22px", marginBottom: 20, border: "1px solid #2a2a3e" }}>
              <p style={{ fontSize: 17, lineHeight: 1.65, color: "#fff", margin: 0, fontWeight: 500 }}>{question.question}</p>
            </div>

            {question.options.map((opt) => (
              <button key={opt[0]} onClick={() => answer(opt[0])} style={btnStyle(opt[0])}>{opt}</button>
            ))}

            {showExp && (
              <div style={{
                marginTop: 4, marginBottom: 20, borderRadius: 12, padding: 16,
                background: chosen === question.correct ? "#14532d33" : "#7f1d1d33",
                border: `1px solid ${chosen === question.correct ? "#22c55e55" : "#ef444455"}`,
              }}>
                <p style={{ fontWeight: 700, fontSize: 14, margin: "0 0 8px", color: chosen === question.correct ? "#22c55e" : "#ef4444" }}>
                  {chosen === question.correct ? `✅ Correct!${streak >= 3 ? ` 🔥 ${streak} in a row!` : ""}` : `❌ Answer: ${question.correct}`}
                </p>
                <p style={{ color: "#bbb", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{question.explanation}</p>
              </div>
            )}

            {chosen && (
              <button onClick={next} style={{
                width: "100%", padding: 16, borderRadius: 12,
                background: "linear-gradient(135deg,#7C3AED,#2563EB)",
                border: "none", color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer",
              }}>Next Question →</button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
