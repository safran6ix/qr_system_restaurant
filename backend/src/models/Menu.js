const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        enum: ['appetizer', 'main-course', 'dessert', 'beverage', 'soup', 'salad', 'special'],
        required: true
    },
    image: {
        type: String,
        default: 'default-menu-image.jpg'
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    isVegetarian: {
        type: Boolean,
        default: false
    },
    isVegan: {
        type: Boolean,
        default: false
    },
    isGlutenFree: {
        type: Boolean,
        default: false
    },
    spicyLevel: {
        type: String,
        enum: ['mild', 'medium', 'hot', 'extra-hot'],
        default: 'mild'
    },
    preparationTime: {
        type: Number,
        default: 10 //minutes 
    },
    calories: Number,
    modifiers: [{
        name: String,
        options: [{
            name: String,
            price: Number,
            isDefault: Boolean
        }]
    }],
    tags: [String],
    popularity: {
        type: Number,
        default: 0
     }
    }, {
        timestamps: true
    });

    module.exports = mongoose.model('Menu', menuItemSchema);