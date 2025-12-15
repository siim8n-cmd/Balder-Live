import { useState, useEffect, useRef } from "react";
import {
  Button,
  Form,
  Row,
  Col,
  Badge,
  InputGroup,
} from "react-bootstrap";
import ProductMockup from "./ProductMockup";

const STORE_ORIGIN = "https://coolshirts.dk";

type GeneratedImage = {
  id: string;
  url: string;
  prompt: string;
  position: "center" | "left-chest" | "bottom";
  blend: "fade" | "gradient" | "circle" | "square" | "none";
};

type TShirtVariant = "White" | "Black";

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
  const [selectedVariant, setSelectedVariant] = useState<TShirtVariant>("White");
  const [currentSize, setCurrentSize] = useState<string>("");
  const [shopifyVariants, setShopifyVariants] = useState<any[]>([]);
  
  const [position, setPosition] = useState<GeneratedImage["position"]>("center");
  const [blend] = useState<GeneratedImage["blend"]>("fade");
  
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [currentDesignUrl, setCurrentDesignUrl] = useState("");
  const [currentPrompt, setCurrentPrompt] = useState("");

  // Ref to manage focus/blur for mobile keyboard
  const inputRef = useRef<HTMLInputElement>(null);

  const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== STORE_ORIGIN) return;
      
      if (event.data.type === 'shopify:variants' && event.data.variants) {
        console.log("Received variants from Shopify:", event.data.variants);
        setShopifyVariants(event.data.variants);
      }
    };

    window.addEventListener('message', handleMessage);

    if (typeof window !== "undefined") {
      window.parent?.postMessage({ type: "balder:ready" }, STORE_ORIGIN);
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const getVariantId = (color: TShirtVariant, size: string) => {
    const colorMap: { [key: string]: string } = {
      "White": "Hvid",
      "Black": "Sort"
    };
    
    const shopifyColor = colorMap[color];
    
    const variant = shopifyVariants.find((v: any) => 
      v.option1 === shopifyColor && v.option2 === size
    );
    
    console.log(`Looking for: ${shopifyColor} + ${size}`, variant);
    return variant?.id || null;
  };

  const addToCart = () => {
    if (!currentSize || !currentDesignUrl) {
      alert("Generer først et design og vælg en størrelse!");
      return;
    }

    const variantId = getVariantId(selectedVariant, currentSize);
    
    if (!variantId) {
      alert("Kunne ikke finde variant. Prøv igen.");
      return;
    }

    const params = new URLSearchParams({
      id: String(variantId),
      quantity: "1",
      "properties[Design URL]": currentDesignUrl,
      "properties[Prompt]": currentPrompt,
      "properties[Placering]": position === 'left-chest' ? 'Venstre Bryst (Logo)' : 'Midt på Brystet (Stort)',
    });

    window.parent.location.href = `${STORE_ORIGIN}/cart/add?${params.toString()}`;
  };

  const handleVariantChange = (variant: TShirtVariant) => {
    setSelectedVariant(variant);
  };

  const handleSizeChange = (size: string) => {
    setCurrentSize(size);
  };

  const handleSelectDesign = (image: GeneratedImage) => {
    setCurrentDesignUrl(image.url);
    setCurrentPrompt(image.prompt);
    setPosition(image.position);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
    try {
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

      if (!response.ok) {
        console.warn("Prompt refinement failed, using raw prompt");
        return prompt;
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || prompt;
    } catch (e) {
      console.warn("Prompt refinement error:", e);
      return prompt;
    }
  };

  const generateImage = async () => {
    if (!subject) return;
    
    // Dismiss mobile keyboard to show loading state
    if (inputRef.current) {
        inputRef.current.blur();
    }

    if (!currentSize) {
      alert("Vælg venligst en størrelse først!");
      return;
    }

    setLoading(true);

    try {
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
        
        if (!response.ok) {
            throw new Error(`OpenAI API Error: ${response.statusText}`);
        }

        const data = await response.json();
        const imageUrl = data.data?.[0]?.url;

        if (imageUrl) {
          setCurrentDesignUrl(imageUrl);
          setCurrentPrompt(finalPrompt);
          
          setGeneratedImages((prev) => [
            {
              id: crypto.randomUUID(),
              url: imageUrl,
              prompt: finalPrompt,
              position,
              blend,
            },
            ...prev,
          ]);

          if (window.parent !== window) {
            window.parent.postMessage({ type: 'design_generated' }, STORE_ORIGIN);
          }
        }
    } catch (error) {
        console.error("Genereringsfejl:", error);
        alert("Der skete en fejl under genereringen. Prøv igen senere.");
    } finally {
        setLoading(false);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setGeneratedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const latestImage = currentDesignUrl;

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
            <Form.Group className="mb-4">
              <Form.Label style={{ fontWeight: "600" }}>👕 Vælg T-shirt farve</Form.Label>
              <div className="d-flex gap-2">
                <Button
                  variant={selectedVariant === "White" ? "dark" : "outline-secondary"}
                  onClick={() => handleVariantChange("White")}
                  style={{ flex: 1, borderWidth: "2px" }}
                >
                  ⚪ Hvid
                </Button>
                <Button
                  variant={selectedVariant === "Black" ? "dark" : "outline-secondary"}
                  onClick={() => handleVariantChange("Black")}
                  style={{ flex: 1, borderWidth: "2px" }}
                >
                  ⚫ Sort
                </Button>
              </div>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label style={{ fontWeight: "600" }}>📏 Vælg størrelse</Form.Label>
              <Form.Select
                value={currentSize}
                onChange={(e) => handleSizeChange(e.target.value)}
                style={{ fontWeight: "500" }}
              >
                <option value="">Vælg størrelse...</option>
                <option value="3/4 år">3/4 år</option>
                <option value="5/6 år">5/6 år</option>
                <option value="7/8 år">7/8 år</option>
                <option value="9/11 år">9/11 år</option>
                <option value="12/14 år">12/14 år</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="2XL">2XL</option>
                <option value="3XL">3XL</option>
                <option value="4XL">4XL</option>
                <option value="5XL">5XL</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>🎯 Motiv / Idé</Form.Label>
              <Form.Control
                ref={inputRef}
                type="text"
                placeholder="F.eks. En drage der flyver over en by i solnedgang"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                enterKeyHint="go"
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

            <div className="d-grid gap-2">
              <Button
                variant="success"
                type="submit"
                disabled={loading || !subject || !currentSize}
                size="lg"
                style={{ fontWeight: "600" }}
              >
                {loading ? "Genererer... (Vent venligst)" : "⚡ Generér design"}
              </Button>
              
               <Button
                variant="primary"
                onClick={addToCart}
                disabled={!currentDesignUrl || !currentSize}
                size="lg"
                style={{ fontWeight: "600" }}
              >
                🛒 Læg i indkøbskurv
              </Button>
            </div>
          </Form>
        </Col>

        <Col md={6} className="d-flex flex-column align-items-center">
          <div className="sticky-top" style={{ top: "20px", zIndex: 100 }}>
            <ProductMockup
              imageUrl={latestImage}
              variant={selectedVariant}
              position={position}
              blendStyle={blend}
              product="tshirt" 
            />
             {loading && (
                <div className="mt-3 text-center">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted">AI'en tryller... det kan tage op til 30 sekunder 🎨</p>
                </div>
              )}
          </div>
        </Col>
      </Row>

      {generatedImages.length > 0 && (
        <div className="mt-5">
          <h3>Dine designs</h3>
          <div className="d-flex gap-3 overflow-auto py-3">
            {generatedImages.map((img) => (
              <div 
                key={img.id} 
                className="position-relative" 
                style={{ 
                    minWidth: "150px", 
                    cursor: "pointer",
                    border: currentDesignUrl === img.url ? "3px solid #0d6efd" : "1px solid #dee2e6",
                    borderRadius: "8px",
                    padding: "4px"
                }}
                onClick={() => handleSelectDesign(img)}
              >
                <img
                  src={img.url}
                  alt="Generated design"
                  className="img-fluid rounded"
                  style={{ width: "150px", height: "150px", objectFit: "cover" }}
                />
                <Button
                  variant="danger"
                  size="sm"
                  className="position-absolute top-0 end-0 m-1 rounded-circle"
                  style={{ width: "24px", height: "24px", padding: 0, lineHeight: "1" }}
                  onClick={(e) => handleDelete(img.id, e)}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TextToImageGenerator;
