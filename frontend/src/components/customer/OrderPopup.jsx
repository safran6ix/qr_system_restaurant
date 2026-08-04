import React, { useState } from 'react';
import NeonButton from '../common/NeonButton';
import './OrderPopup.css';

const OrderPopup = ({ item, onClose, onAddToCart }) => {
    const [quantity, setQuantity] = useState(1);
    const [selectedModifiers, setSelectedModifiers] = useState({});
    const [specialInstructions, setSpecialInstructions] = useState('');

    const handleQuantityChange = (change) => {
        setQuantity(prev => Math.max(1, prev + change));
    };

    const handleModifierSelect = (modifierName, optionName) => {
        setSelectedModifiers(prev => ({
            ...prev,
            [modifierName]: optionName
        }));
    };

    const handleAddToCart = () => {
        const modifiers = Object.entries(selectedModifiers).map(([name, option]) => ({
            name,
            option
        }));

        onAddToCart(item, quantity, modifiers, specialInstructions);
    };

    return (
        <div className="order-popup-overlay" onClick={onClose}>
            <div className="order-popup-content glass-card" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>✕</button>

                <div className="popup-header">
                    <h2 className="neon-text">{item.name}</h2>
                    <p className="item-description">{item.description}</p>
                </div>

                <div className="popup-body">
                    <div className="quantity-section">
                        <label>Quantity</label>
                        <div className="quantity-control">
                            <button onClick={() => handleQuantityChange(-1)}>−</button>
                            <span>{quantity}</span>
                            <button onClick={() => handleQuantityChange(1)}>+</button>
                        </div>
                    </div>

                    {item.modifiers && item.modifiers.length > 0 && (
                        <div className="modifiers-section">
                            <label>Modifiers</label>
                            {item.modifiers.map((modifier, idx) => (
                                <div key={idx} className="modifier-group">
                                    <p className="modifier-name">{modifier.name}</p>
                                    <div className="modifier-options">
                                        {modifier.options.map((option, optIdx) => (
                                            <button
                                                key={optIdx}
                                                className={`modifier-option ${selectedModifiers[modifier.name] === option.name ? 'selected' : ''}`}
                                                onClick={() => handleModifierSelect(modifier.name, option.name)}
                                            >
                                                {option.name} {option.price > 0 && `(+$${option.price})`}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="special-instructions">
                        <label>Special Instructions</label>
                        <textarea
                            value={specialInstructions}
                            onChange={(e) => setSpecialInstructions(e.target.value)}
                            placeholder="Any special requests?"
                            className="neon-input"
                        />
                    </div>
                </div>

                <div className="popup-footer">
                    <div className="total-price">
                        <span>Total:</span>
                        <span className="price neon-text">
                            ${(item.price * quantity).toFixed(2)}
                        </span>
                    </div>
                    <NeonButton onClick={handleAddToCart} className="add-to-cart-btn">
                        Add to Cart
                    </NeonButton>
                </div>
            </div>
        </div>
    );
};

export default OrderPopup;