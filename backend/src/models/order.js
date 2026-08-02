const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    menuItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Menu',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true
    },
    specialInstructions: String,
    modifiers: [{
        name: String,
        price: Number
    }]
});

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        unique: true,
        required: true
    },
    tableNumber: {
        type: Number,
        required: true
    },
    items: [orderItemSchema],
    subtotal: {
        type: Number,
        required: true
    },
    tax: {
        type: Number,
        default: 0
    },
    total: {
        type: Number,
        required: true
    },
    status: {
        type: Staring,
        enum: ['pending', 'received', 'preparing', 'ready', 'served', 'cancelled'],
        default: 'pending'
    },
    customerName: {
        type: String,
        required: true
    },
    customerPhone: String,
    specialRequests: String,
    orderTime: {
        type: Date,
        default: Date.now
    },
    acceptedTime: Date,
    readyTime: Date,
    servedTime: Date,
    estimatedPrepTime: {
        type: Number,
        default: 15 // minutes
    }
}, {
    timestamps : true
});

//Generate order ID
orderSchema.pre('save', function(next) {
    if (this.isNew) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        this.orderId = `ORD-${year}${month}${day}-${random}`;
    }
    next();
});

module.exports = mongoose.model('Order', orderSchema);