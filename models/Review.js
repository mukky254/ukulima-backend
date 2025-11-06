const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true
  },
  images: [String],
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Update product and farmer ratings when a review is saved
reviewSchema.post('save', async function() {
  if (this.product) {
    const Product = mongoose.model('Product');
    const product = await Product.findById(this.product);
    const reviews = await mongoose.model('Review').find({ product: this.product });
    
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    product.rating = totalRating / reviews.length;
    product.totalReviews = reviews.length;
    await product.save();
  }
  
  if (this.farmer) {
    const User = mongoose.model('User');
    const farmer = await User.findById(this.farmer);
    const reviews = await mongoose.model('Review').find({ farmer: this.farmer });
    
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    farmer.rating = totalRating / reviews.length;
    farmer.totalReviews = reviews.length;
    await farmer.save();
  }
});

module.exports = mongoose.model('Review', reviewSchema);
