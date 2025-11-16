import React, { useState, useEffect } from 'react';
import './ProductMockup.css';

type Variant = 'White' | 'Black';

const ProductMockup: React.FC = () => {
  const [selectedVariant, setSelectedVariant] = useState<Variant>('White');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleVariantChange = (variant: Variant) => {
    setSelectedVariant(variant);
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'variant_change',
        option: 'Color',
        value: variant,
      }, '*');
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'design_generated' && event.data.imageUrl) {
        setGeneratedImage(event.data.imageUrl);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return (
    <div className="mockup-container">
      <div className="variant-selectors">
        <button
          className={selectedVariant === 'White' ? 'active' : ''}
          onClick={() => handleVariantChange('White')}
        >
          White
        </button>
        <button
          className={selectedVariant === 'Black' ? 'active' : ''}
          onClick={() => handleVariantChange('Black')}
        >
          Black
        </button>
      </div>

      <div className="tshirt-mockup-wrapper">
        <img
          src={selectedVariant === 'Black' ? '/black-tshirt-mockup.png' : '/white-tshirt-mockup.png'}
          alt="T-shirt mockup"
          className="tshirt-base-image"
        />
        {generatedImage && (
          <img
            src={generatedImage}
            alt="Generated AI design"
            className="generated-design-overlay"
          />
        )}
      </div>
    </div>
  );
};

export default ProductMockup;
