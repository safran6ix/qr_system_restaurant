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
    }
}