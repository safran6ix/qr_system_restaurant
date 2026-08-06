import React, { useState, useEffect } from "react";
import axios from 'axios';
import { useWebSocket } from '../hooks/useWebSocket';
import OrderCard from '../components/manager/OrderCard';
import AnalyticsPanel from '../components/manager/AnalyticsPanel';
import KitchenDisplay from '../components/manager/KitchenDisplay';
import NeonButton from '../components/common/NeonButton';
import AnimatedBackground from '../components/common/AnimatedBackground';
import './ManagerDashboard.css';

const ManagerDashboard = () => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [filter, setFilter] = useState('all');
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        preparing: 0,
        ready: 0,
        served: 0
    });
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [showKitchen, setShowKitchen] = useState(false);
    const { sendMessage, lastMessage } = useWebSocket();

    useEffect(() => {
        fetchOrders();

        // Real-time updates
        if (lastMessage) {
            const data = JSON.parse(lastMessage);
            if (data.type === 'new-order' || data.type === 'order-status-updated') {
                fetchOrders();
            }
        }
    }, [lastMessage]);

    const fetchOrders = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/orders`);
            setOrders(response.data.data);
            updateStats(response.data.data);
            applyFilter(filter, response.data.data);
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    };

    const updateStats = (ordersData) => {
        const newStats = {
            total: ordersData.length,
            pending: ordersData.filter(o => o.status === 'pending').length,
            preparing: ordersData.filter(o => o.status === 'preparing').length,
            ready: ordersData.filter(o => o.status === 'ready').length,
            served: ordersData.filter(o => o.status === 'served').length
        };
        setStats(newStats);
    };

    const applyFilter = (filterType, ordersData = orders) => {
        if (filterType === 'all') {
            setFilteredOrders(ordersData);
        } else {
            setFilteredOrders(ordersData.filter(o => o.status === filterType));
        }
    };

    const handleOrderAction = async (orderId, action) => {
        const statusMap = {
            accept: 'received',
            prepare: 'preparing',
            ready: 'ready',
            serve: 'served'
        };

        try {
            await axios.put(`${process.env.REACT_APP_API_URL}/api/orders/${orderId}`, {
                status: statusMap[action]
            });

            // Send WebSocket update
            sendMessage({
                type: 'order-status-updated',
                orderId,
                status: statusMap[action]
            });

            fetchOrders();
        } catch (error) {
            console.error('Error updating order:', error);
        }
    };

    return (
        <div className="manager-dashboard">
            <AnimatedBackground />

            <header className="dashboard-header">
                <h1 className="neon-text">✨ MANAGER DASHBOARD</h1>
                <div className="header-actions">
                    <NeonButton onClick={() => setShowAnalytics(!showAnalytics)}>
                        {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
                    </NeonButton>
                    <NeonButton onClick={() => setShowKitchen(!showKitchen)}>
                        {showKitchen ? 'Hide Kitchen' : 'Kitchen View'}
                    </NeonButton>
                </div>
            </header>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card glass-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.total}</span>
                        <span className="stat-label">Total Orders</span>
                    </div>
                </div>
                <div className="stat-card glass-card pending">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.pending}</span>
                        <span className="stat-label">Pending</span>
                    </div>
                </div>
                <div className="stat-card glass-card preparing">
                    <div className="stat-icon">👨‍🍳</div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.preparing}</span>
                        <span className="stat-label">Preparing</span>
                    </div>
                </div>
                <div className="stat-card glass-card ready">
                    <div className="stat-icon">✅</div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.ready}</span>
                        <span className="stat-label">Ready</span>
                    </div>
                </div>
                <div className="stat-card glass-card served">
                    <div className="stat-icon">🍽️</div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.served}</span>
                        <span className="stat-label">Served</span>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="filter-tabs">
                {['all', 'pending', 'received', 'preparing', 'ready', 'served'].map(status => (
                    <button
                        key={status}
                        className={`filter-btn ${filter === status ? 'active' : ''}`}
                        onClick={() => {
                            setFilter(status);
                            applyFilter(status);
                        }}
                    >
                        {status.toUpperCase()}
                    </button>
                ))}
            </div>

            {/* Orders Grid */}
            <div className="orders-grid">
                {filteredOrders.length === 0 ? (
                    <div className="empty-state glass-card">
                        <span className="empty-icon">📭</span>
                        <p>No orders in this category</p>
                    </div>
                ) : (
                    filteredOrders.map(order => (
                        <OrderCard
                            key={order._id}
                            order={order}
                            onAction={handleOrderAction}
                        />
                    ))
                )}
            </div>

            {/* Analytics Panel */}
            {showAnalytics && (
                <div className="analytics-overlay">
                    <AnalyticsPanel orders={orders} onClose={() => setShowAnalytics(false)} />
                </div>
            )}

            {/* Kitchen Display */}
            {showKitchen && (
                <div className="kitchen-overlay">
                    <KitchenDisplay
                        orders={orders.filter(o => o.status === 'preparing' || o.status === 'ready')}
                        onClose={() => setShowKitchen(false)}
                        onUpdate={handleOrderAction}
                    />
                </div>
            )}
        </div>
    );
};

export default ManagerDashboard;