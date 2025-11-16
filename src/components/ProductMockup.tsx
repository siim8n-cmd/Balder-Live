import React from 'react';
import './ProductMockup.css';

type ProductMockupProps = {
  imageUrl?: string;
  product: 'tshirt';
  position: 'center' | 'left-chest' | 'bottom';
  blendStyle: 'fade' | 'gradient' | 'circle' | 'square' | 'none';
  variant?: 'White' | 'Black';
};

const ProductMockup: React.FC<ProductMockupProps> = ({
  imageUrl,
  variant = 'White',
}) => {
  const mockupSrc = variant === 'Black' 
    ? '/black-tshirt-mockup.png' 
    : '/white-tshirt-mockup.png';

  return (
    <div className="mockup-container">
      <div className="tshirt-mockup-wrapper">
        <img
          src={mockupSrc}
          alt={`${variant} t-shirt mockup`}
          className="tshirt-base-image"
        />
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Generated AI design"
            className="generated-design-overlay"
          />
        )}
      </div>
    </div>
  );
};

export default ProductMockup;
