const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
    tableNumber: {
        type: Number,
        required: true,
        unique: true
    },
    capacity: {
        type: Number,
        required: true,
        min: 1
    },
    capacity: {
        type: Number,
        required: true,
        min: 1
    },
    status: {
        type: String,
        enum: ['available', 'occupied', 'reserved', 'maintenance'],
        default: 'available'
    },
    section: {
        type: String,
        enum: ['indoor', 'outdoor', 'bar', 'private'],
        default: 'indoor'
    },
    qrCode: {
        type: String,
        required: true
    },
    currentOrder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    occupiedSince: Date,
    assignedServer: String
}, {
    timestamps: true
});

module.exports = mongoose.model('Table', tableSchema);
