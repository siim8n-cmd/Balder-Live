import React, { useState } from "react";
import "./ProductMockup.css";

type ProductType = "tshirt";

type Props = {
  product: ProductType;
  imageUrl: string;
  position: "center" | "left-chest" | "bottom";
  blendStyle?: "fade" | "gradient" | "circle" | "square" | "none";
};

const positionDefaults: Record<string, { top: number; left: number }> = {
  center: { top: 38, left: 50 },
  "left-chest": { top: 32, left: 33 },
  bottom: { top: 70, left: 50 },
};

const ProductMockup: React.FC<Props> = ({
  imageUrl,
  position,
  blendStyle = "none",
}) => {
  const [pos, setPos] = useState(positionDefaults[position]);
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setOffset({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const dx = e.clientX - offset.x;
    const dy = e.clientY - offset.y;

    setPos((prev) => ({
      top: prev.top + dy * 0.25,
      left: prev.left + dx * 0.25,
    }));

    setOffset({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setDragging(false);

  return (
    <div
      className="mockup-wrapper"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <img
        src="/balder/tshirt.png"
        alt="T-shirt mockup"
        className="tshirt-base"
      />
      {imageUrl && (
        <div
          className={`mockup-image blend-${blendStyle}`}
          style={{
            backgroundImage: `url(${imageUrl})`,
            top: `${pos.top}%`,
            left: `${pos.left}%`,
            width: "30%",
            transform: "translate(-50%, -50%)",
            position: "absolute",
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            aspectRatio: "1 / 1",
            cursor: "move",
            zIndex: 2,
          }}
          onMouseDown={handleMouseDown}
        />
      )}
    </div>
  );
};

export default ProductMockup;
