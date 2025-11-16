import React from "react";
import ProductMockup from "./ProductMockup";
import { Button } from "react-bootstrap";

type Props = {
  images: { 
    id: string; 
    url: string; 
    position: "center" | "left-chest" | "bottom";
    blend: "fade" | "gradient" | "circle" | "square" | "none";
  }[];
  onDelete: (id: string) => void;
};

const GeneratedImagesGallery: React.FC<Props> = ({ images, onDelete }) => {
  if (images.length === 0) return null;

  return (
    <div className="container mt-5">
      <h4 className="mb-3">Dine genererede designs</h4>
      <div className="row">
        {images.map((image) => (
          <div className="col-md-4 mb-4" key={image.id}>
            <div className="card shadow-sm">
              <div className="card-body p-3 text-center">
                <ProductMockup
                  product="tshirt"
                  imageUrl={image.url}
                  position={image.position}
                  blendStyle={image.blend}
                  variant="White"
                />
              </div>
              <div className="card-footer text-center">
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => onDelete(image.id)}
                >
                  Slet billede
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GeneratedImagesGallery;
