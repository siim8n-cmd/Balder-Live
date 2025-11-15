import { useState } from "react";
import axios from "axios";

type Props = {
  onApply: (prompt: string) => void;
};

const PromptBuilder: React.FC<Props> = ({ onApply }) => {
  const [subject, setSubject] = useState("");
  const [finalPrompt, setFinalPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [color, setColor] = useState<'White' | 'Black'>('White');

  const buildOptimizedPrompt = async () => {
    if (!subject.trim()) return;
    setLoading(true);
    setError("");
    setFinalPrompt("");

    const systemPrompt = `
Du er ekspert i at skrive DALL·E prompts til printdesign.
Lav en kort, præcis prompt på ENGELSK, der genererer en centered, flat 2D vector-style illustration baseret på motivet: "${subject.trim()}".
Prompten SKAL inkludere: 
- "vector illustration"
- "flat 2D design"
- "white background"
- "centered"
- "front-facing"
- "bold outlines"
- "sharp edges"
- "no text"
- "vibrant colors"
- "print-ready"
- "professional t-shirt design"
Undgå alle ekstra ord eller forklaringer. Returnér kun selve prompten.`;

    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: systemPrompt },
          ],
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const aiPrompt = response.data.choices[0].message.content.trim();
      setFinalPrompt(aiPrompt);
      onApply(aiPrompt);
    } catch (err) {
      console.error(err);
      setError("Kunne ikke generere prompt. Tjek din API-nøgle og beskrivelsen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4 border rounded p-3 bg-light">
      <h5 className="mb-3 text-primary">🎯 Skriv dit motiv til T-shirt</h5>

      <label className="form-label">Hvad skal trykkes?</label>
      <input
        type="text"
        className="form-control mb-3"
        placeholder='F.eks. "En giraf der kører på skateboard"'
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        disabled={loading}
      />

      <div className="mb-3">
        <label htmlFor="color" className="form-label">Farve</label>
        <select
          id="color"
          value={color}
          onChange={(e) => {
            const newColor = e.target.value as 'White' | 'Black';
            setColor(newColor);
      
            if (window.parent !== window) {
              window.parent.postMessage(
                { type: 'variant_change', option: 'Color', value: newColor },
                '*'
              );
            }
            
            window.dispatchEvent(new CustomEvent('generator_color_changed', { detail: newColor }));
          }}
          className="form-control"
        >
          <option value="White">Hvid</option>
          <option value="Black">Sort</option>
        </select>
      </div>

      <button
        className="btn btn-success w-100"
        onClick={buildOptimizedPrompt}
        disabled={loading || !subject.trim()}
      >
        {loading ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" />
            Genererer printklar prompt…
          </>
        ) : (
          "Generér stærk prompt"
        )}
      </button>

      {error && <div className="alert alert-danger mt-3">{error}</div>}

      {finalPrompt && (
        <div className="alert alert-secondary mt-3">
          <strong>Genereret prompt:</strong>
          <div className="mt-2 small">{finalPrompt}</div>
        </div>
      )}
    </div>
  );
};

export default PromptBuilder;
