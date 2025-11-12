import { useState } from "react";
import {
  Button,
  Form,
  Row,
  Col,
  Spinner,
  Badge,
  InputGroup,
} from "react-bootstrap";
import ProductMockup from "./ProductMockup";

type GeneratedImage = {
  id: string;
  url: string;
  position: "center" | "left-chest" | "bottom";
  blend: "fade" | "gradient" | "circle" | "square" | "none";
};

const popularTags = [
  "retro",
  "cyberpunk",
  "vintage",
  "abstract",
  "skull",
  "animal",
  "space",
  "nature",
  "japanese",
  "comic",
  "minimalist",
  "psychedelic",
  "typography",
];

const TextToImageGenerator = () => {
  const [subject, setSubject] = useState("");
  const [style, setStyle] = useState("realistic");
  const [mood, setMood] = useState("cool");
  const [position, setPosition] =
    useState<GeneratedImage["position"]>("center");
  const [blend, setBlend] = useState<GeneratedImage["blend"]>("fade");
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

  const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;

  const addTagsFromInput = () => {
    const newTags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && !tags.includes(t));
    setTags((prev) => [...prev, ...newTags]);
    setTagInput("");
  };

  const toggleSuggestedTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags((prev) => [...prev, tag]);
    }
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const refinePrompt = async (prompt: string): Promise<string> => {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a prompt engineer specialized in AI-generated artwork for t-shirt printing. Rewrite the user's idea into a detailed, visually rich prompt for DALL·E 3. The output should be a centered artwork on a white background, suitable for t-shirt printing. Do NOT include any images of t-shirts or garments. Output only the English prompt.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || prompt;
  };

  const generateImage = async () => {
    if (!subject) return;
    setLoading(true);

    const tagString = tags.join(", ");
    const rawPrompt = `A ${style}, ${mood} artwork for t-shirt print, showing ${subject}. Tags: ${tagString}. High resolution, white background, centered composition. Do not include any t-shirt.`;
    const finalPrompt = await refinePrompt(rawPrompt);

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: finalPrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      }),
    });

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url;

    if (imageUrl) {
      setGeneratedImages((prev) => [
        {
          id: crypto.randomUUID(),
          url: imageUrl,
          position,
          blend,
        },
        ...prev,
      ]);
    }

    setLoading(false);
  };

  const handleDelete = (id: string) => {
    setGeneratedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const latestImage = generatedImages.length > 0 ? generatedImages[0].url : "";

  return (
    <div className="container py-5">
  
      <Row>
        <Col md={6}>
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              generateImage();
            }}
          >
            <Form.Group className="mb-3">
              <Form.Label>🎯 Motiv / Idé</Form.Label>
              <Form.Control
                type="text"
                placeholder="F.eks. En drage der flyver over en by i solnedgang"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </Form.Group>

            <Row className="mb-3">
              <Col>
                <Form.Label>🎨 Stil</Form.Label>
                <Form.Select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                >
                  <option value="realistic">Realistisk</option>
                  <option value="cartoon">Tegneserie</option>
                  <option value="minimalist">Minimalistisk</option>
                  <option value="fantasy">Fantasy</option>
                </Form.Select>
              </Col>
              <Col>
                <Form.Label>🌈 Stemning</Form.Label>
                <Form.Select
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                >
                  <option value="cool">Cool</option>
                  <option value="dark">Mørk</option>
                  <option value="happy">Glad</option>
                  <option value="mystical">Mystisk</option>
                </Form.Select>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col>
                <Form.Label>📍 Placering</Form.Label>
                <Form.Select
                  value={position}
                  onChange={(e) =>
                    setPosition(e.target.value as GeneratedImage["position"])
                  }
                >
                  <option value="center">Center</option>
                  <option value="left-chest">Venstre bryst</option>
                  <option value="bottom">Nederst</option>
                </Form.Select>
              </Col>
              <Col>
                <Form.Label>🌀 Overgang</Form.Label>
                <Form.Select
                  value={blend}
                  onChange={(e) =>
                    setBlend(e.target.value as GeneratedImage["blend"])
                  }
                >
                  <option value="fade">Blød fade</option>
                  <option value="gradient">Gradient top-ned</option>
                  <option value="circle">Cirkulær</option>
                  <option value="square">Firkantet fade</option>
                  <option value="none">Ingen</option>
                </Form.Select>
              </Col>
            </Row>

            <Form.Label>🏷️ Tilføj tags</Form.Label>
            <InputGroup className="mb-3">
              <Form.Control
                placeholder="Indtast tags og adskil med komma"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTagsFromInput();
                  }
                }}
              />
              <Button variant="secondary" onClick={addTagsFromInput}>
                Tilføj
              </Button>
            </InputGroup>

            <div className="mb-3 d-flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  bg="dark"
                  pill
                  style={{ cursor: "pointer" }}
                  onClick={() => removeTag(tag)}
                >
                  {tag} ✕
                </Badge>
              ))}
            </div>

            <Form.Label>✨ Foreslåede tags</Form.Label>
            <div className="mb-3 d-flex flex-wrap gap-2">
              {popularTags.map((tag) => (
                <Badge
                  key={tag}
                  bg={tags.includes(tag) ? "primary" : "secondary"}
                  style={{ cursor: "pointer" }}
                  onClick={() => toggleSuggestedTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="d-grid">
              <Button
                variant="success"
                onClick={generateImage}
                disabled={loading || !subject}
              >
                {loading ? (
                  <Spinner size="sm" animation="border" />
                ) : (
                  "⚡ Generér design"
                )}
              </Button>
            </div>
          </Form>
        </Col>

        <Col md={6} className="d-flex align-items-center justify-content-center">
          <ProductMockup
            imageUrl={latestImage}
            product="tshirt"
            position={position}
            blendStyle={blend}
          />
        </Col>
      </Row>

      {generatedImages.length > 1 && (
        <>
          <h5 className="mt-5">🕓 Tidligere designs</h5>
          <div className="row mt-3">
            {generatedImages.slice(1).map((image) => (
              <div className="col-md-4 mb-4" key={image.id}>
                <div className="mockup-card shadow-sm p-3 bg-white rounded position-relative">
                  <ProductMockup
                    imageUrl={image.url}
                    product="tshirt"
                    position={image.position}
                    blendStyle={image.blend}
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    className="position-absolute top-0 end-0 m-2"
                    onClick={() => handleDelete(image.id)}
                  >
                    ✕
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default TextToImageGenerator;


