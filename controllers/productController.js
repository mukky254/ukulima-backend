const Product = require('../models/Product');
const User = require('../models/User');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const {
      category,
      subcategory,
      county,
      minPrice,
      maxPrice,
      isOrganic,
      isFresh,
      search,
      page = 1,
      limit = 12
    } = req.query;

    let query = { isAvailable: true };

    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Filter by subcategory
    if (subcategory) {
      query.subcategory = subcategory;
    }

    // Filter by county
    if (county) {
      query['location.county'] = new RegExp(county, 'i');
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Filter by organic
    if (isOrganic) {
      query.isOrganic = isOrganic === 'true';
    }

    // Filter by freshness
    if (isFresh) {
      query.isFresh = isFresh === 'true';
    }

    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    const products = await Product.find(query)
      .populate('farmer', 'name profile avatar rating')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('farmer', 'name profile avatar rating totalReviews phone');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Increment views
    product.views += 1;
    await product.save();

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private (Farmers only)
exports.createProduct = async (req, res) => {
  try {
    const farmer = await User.findById(req.user.id);
    
    if (farmer.role !== 'farmer') {
      return res.status(403).json({ message: 'Only farmers can create products' });
    }

    const product = await Product.create({
      ...req.body,
      farmer: req.user.id
    });

    const populatedProduct = await Product.findById(product._id)
      .populate('farmer', 'name profile avatar');

    res.status(201).json(populatedProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Product owner)
exports.updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user is product owner
    if (product.farmer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('farmer', 'name profile avatar');

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Product owner)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user is product owner
    if (product.farmer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({ message: 'Product removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get farmer's products
// @route   GET /api/products/farmer/:farmerId
// @access  Public
exports.getFarmerProducts = async (req, res) => {
  try {
    const products = await Product.find({ 
      farmer: req.params.farmerId,
      isAvailable: true 
    }).populate('farmer', 'name profile avatar rating');

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
