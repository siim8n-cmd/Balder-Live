import React, { useState, useEffect } from 'react';
import './ProductMockup.css';

type Props = {
  generatedImageUrl: string | null;
  loading: boolean;
};

const ProductMockup: React.FC<Props> = ({ generatedImageUrl, loading }) => {
  const [mockupColor, setMockupColor] = useState<'White' | 'Black'>('White');

  useEffect(() => {
    const handleColorChange = (event: any) => {
      const newColor = event.detail;
      if (newColor === 'White' || newColor === 'Black') {
        setMockupColor(newColor);
      }
    };

    window.addEventListener('generator_color_changed', handleColorChange);

    return () => {
      window.removeEventListener('generator_color_changed', handleColorChange);
    };
  }, []);

  const mockupImageSrc = mockupColor === 'Black' 
    ? '/black-tshirt-mockup.png' 
    : '/white-tshirt-mockup.png';

  return (
    <div className="product-mockup-container">
      <img src={mockupImageSrc} alt={`T-shirt mockup ${mockupColor}`} className="product-mockup-background" />
      {loading && (
        <div className="mockup-overlay">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
      {generatedImageUrl && !loading && (
        <img src={generatedImageUrl} alt="Generated design" className="generated-design-on-mockup" />
      )}
    </div>
  );
};

export default ProductMockup;
