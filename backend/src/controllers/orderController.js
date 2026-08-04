const Order = require('../models/Order');
const Table = require('../models/Table');
const Menu = require('../models/Menu');
const { redisClient } = require('../config/redis');

exports.createOrder = async (req, res) => {
    try {
        const { tableNumber, items, customerName, cutomerPhone, specialRequests } = req.body;

        //Validate table exists
        const table = await Table.findOne({ tableNumber });
        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        //Calculate total
        let subtotal = 0;
        const orderItems = [];


        for (const item of items) {
            const menuItem = await Menu.findById(item.menuItemId);
            if(!menuItem) {
                return res.status(404).json({
                    success: false,
                    message: `Menu item ${item.menuItemId} not found`
                });
            }

            const itemTotal = menuItem.price * item.quantity;
            subtotal += itemTotal;

            orderItems.push({
                menuItemId: menuItem._id,
                name: menuItem.name,
                quantity: item.quantity,
                price: menuItem.price,
                specialInstructions: item.specialInstructions || '',
                modifiers: item.modifiers || []
            });
        }

        //Calculate tax (assuming 10% tax)
        const tax = subtotal * 0.10;
        const total = subtotal + tax;
        
        //Create order
        const order = new Order({
            tableNumber,
            items: orderItems,
            subtotal,
            tax,
            total,
            customerName,
            customerPhone,
            specialRequests,
            status: 'pending'
        });

        await order.save();

        //Update table status
        table.status = 'occupied';
        table.currentOrder = order._id;
        table.occupiedSince = new Date();
        await table.save();

        //Emit socket event for new order
        const io = req.app.get('io');
        io.emit('new-order', order);

        //Cache order in Redis for real-time updates
        await redisClient.set(`order:${order._id}`, JSON.stringify(order), {
            EX: 3600 //1 hour
        });

        res.status(201).json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({
            success:  false,
            message: 'Failed to create oder'
        });
    }
};

exports.getOrders = async (req, res) => {
    try {
        const { status, tableNumber, date } = req.query;
        const query = {};

        if (status) query.status = status;
        if (tableNumber) query.tableNumber = tableNumber;
        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            query.createdAt = { $gte: startDate, $lte: endDate };
        }

        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .populate('items.menuItemId');

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders'
        });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        order.status = status;

        // Update timestamps based on status
        if (status === 'received') {
            order.acceptedTime = new Date();
        } else if (status === 'ready') {
            order.readyTime = new Date();
        } else if (status === 'served') {
            order.servedTime = new Date();
        }

        await order.save();

        // Emit socket event for status update
        const io = req.app.get('io');
        io.emit('order-status-updated', order);

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Update order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update order'
        });
    }
};