const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a product name'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    enum: ['vegetables', 'fruits', 'grains', 'dairy', 'poultry', 'livestock', 'other']
  },
  subcategory: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: [true, 'Please add a price']
  },
  unit: {
    type: String,
    required: [true, 'Please add a unit'],
    enum: ['kg', 'g', 'piece', 'bunch', 'crate', 'bag', 'liter']
  },
  quantity: {
    type: Number,
    required: [true, 'Please add quantity available']
  },
  minOrder: {
    type: Number,
    default: 1
  },
  images: [{
    url: String,
    public_id: String
  }],
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    county: String,
    subCounty: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  isOrganic: {
    type: Boolean,
    default: false
  },
  isFresh: {
    type: Boolean,
    default: true
  },
  harvestDate: {
    type: Date
  },
  expiryDate: {
    type: Date
  },
  tags: [String],
  rating: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for search functionality
productSchema.index({ 
  name: 'text', 
  description: 'text', 
  tags: 'text' 
});

module.exports = mongoose.model('Product', productSchema);
