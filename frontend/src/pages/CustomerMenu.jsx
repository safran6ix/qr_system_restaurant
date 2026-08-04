import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import NeonButton from '../components/common/NeonButton';
import OrderPopup from '../components/customer/OrderPopup';
import CartSummary from '../components/customer/CartSummary';
import AnimatedBackground from '../components/common/AnimatedBackground';
import { useWebSocket } from '../hooks/useWebSocket';
import '../styles/customerMenu.css';

const CustomerMenu = () => {
    const { tableNumber } = useParams();
    const [menuItems, setMenuItems] = useState([]);
    const [cart, setCart] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showOrderPopup, setShowOrderPopup] = useState(false);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState('all');
    const { sendMessage, lastMessage } = useWebSocket();

    useEffect(() => {
        fetchMenu();

        // Real-time order status updates
        if (lastMessage) {
            const data = JSON.parse(lastMessage);
            if (data.type === 'order-status-updated') {
                // Update cart status
                setCart(prevCart =>
                    prevCart.map(item =>
                        item.orderId === data.orderId
                            ? { ...item, status: data.status }
                            : item
                    )
                );
            }
        }
    }, [lastMessage]);

    const fetchMenu = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/menu`);
            setMenuItems(response.data.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching menu:', error);
            setLoading(false);
        }
    };

    const handleAddToCart = (item, quantity, modifiers, specialInstructions) => {
        const orderItem = {
            menuItemId: item._id,
            name: item.name,
            price: item.price,
            quantity,
            modifiers,
            specialInstructions,
            total: item.price * quantity
        };

        setCart(prevCart => [...prevCart, orderItem]);
        setShowOrderPopup(false);

        // Animate cart update
        const cartElement = document.querySelector('.cart-summary');
        cartElement.classList.add('pulse-animation');
        setTimeout(() => cartElement.classList.remove('pulse-animation'), 1000);
    };

    const handlePlaceOrder = async (customerName, customerPhone, specialRequests) => {
        const orderData = {
            tableNumber: parseInt(tableNumber),
            items: cart.map(item => ({
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                specialInstructions: item.specialInstructions,
                modifiers: item.modifiers
            })),
            customerName,
            customerPhone,
            specialRequests
        };

        try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/orders`,
                orderData
            );

            // Send via WebSocket for real-time notification
            sendMessage({
                type: 'new-order',
                order: response.data.data
            });

            // Clear cart
            setCart([]);
            alert('Order placed successfully! 🎉');
        } catch (error) {
            console.error('Error placing order:', error);
            alert('Failed to place order. Please try again.');
        }
    };

    const filteredItems = category === 'all'
        ? menuItems
        : menuItems.filter(item => item.category === category);

    return (
        <div className="customer-menu-container">
            <AnimatedBackground />

            <header className="menu-header">
                <h1 className="neon-text">🍽️ NEON BITES</h1>
                <div className="table-info glass-card">
                    <span>Table #{tableNumber}</span>
                    <div className="status-indicator online"></div>
                </div>
            </header>

            {/* Category Filter */}
            <div className="category-filter">
                {['all', 'appetizer', 'main-course', 'dessert', 'beverage'].map(cat => (
                    <button
                        key={cat}
                        className={`category-btn ${category === cat ? 'active' : ''}`}
                        onClick={() => setCategory(cat)}
                    >
                        {cat.toUpperCase()}
                    </button>
                ))}
            </div>

            {/* Menu Grid */}
            {loading ? (
                <div className="loading-spinner neon-loader"></div>
            ) : (
                <div className="menu-grid">
                    {filteredItems.map(item => (
                        <div key={item._id} className="menu-item-card glass-card">
                            <div className="item-image">
                                <img src={item.image || 'default-menu.jpg'} alt={item.name} />
                                {!item.isAvailable && (
                                    <div className="unavailable-overlay">Not Available</div>
                                )}
                            </div>
                            <div className="item-details">
                                <h3>{item.name}</h3>
                                <p className="item-description">{item.description}</p>
                                <div className="item-tags">
                                    {item.isVegetarian && <span className="tag veg">🌱</span>}
                                    {item.isVegan && <span className="tag vegan">🌿</span>}
                                    {item.isGlutenFree && <span className="tag gf">GF</span>}
                                    <span className="tag spicy">🌶️ {item.spicyLevel}</span>
                                </div>
                                <div className="item-footer">
                                    <span className="item-price">${item.price.toFixed(2)}</span>
                                    <NeonButton
                                        onClick={() => {
                                            setSelectedItem(item);
                                            setShowOrderPopup(true);
                                        }}
                                        disabled={!item.isAvailable}
                                    >
                                        Add to Order
                                    </NeonButton>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Order Popup */}
            {showOrderPopup && (
                <OrderPopup
                    item={selectedItem}
                    onClose={() => setShowOrderPopup(false)}
                    onAddToCart={handleAddToCart}
                />
            )}

            {/* Cart Summary */}
            <CartSummary
                cart={cart}
                onPlaceOrder={handlePlaceOrder}
                onUpdateCart={setCart}
            />
        </div>
    );
};

export default CustomerMenu;