const path = require('path');
const Product = require('../models/Product');

const buildSlug = (name) =>
  String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const mapSort = (sort) => {
  switch (sort) {
    case 'price_asc':
      return { price: 1 };
    case 'price_desc':
      return { price: -1 };
    case 'date_asc':
      return { createdAt: 1 };
    case 'date_desc':
    default:
      return { createdAt: -1 };
  }
};

const parseVariants = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const isDuplicateSlugError = (err) =>
  err?.code === 11000 && (err?.keyPattern?.slug || err?.keyValue?.slug);

const collectImageUrls = (req) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  if (req.files && req.files.length > 0) {
    return req.files.map((f) =>
      `${baseUrl}/uploads/${path.basename(f.path || f.filename)}`
    );
  }
  if (Array.isArray(req.body.images)) {
    return req.body.images;
  }
  if (typeof req.body.images === 'string' && req.body.images.trim()) {
    return [req.body.images.trim()];
  }
  return [];
};

// GET /api/admin/products
// Admin-only: list products with pagination, filters, and basic analytics fields.
exports.getAdminProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      keyword,
      category,
      sort,
      status,
      includeArchived,
    } = req.query;

    const numericLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const numericPage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (numericPage - 1) * numericLimit;

    const filter = {};

    if (keyword) {
      filter.name = { $regex: String(keyword), $options: 'i' };
    }

    if (category) {
      filter.category = String(category).toLowerCase();
    }

    if (status === 'active') {
      filter.isActive = true;
      filter.isArchived = false;
    } else if (status === 'inactive') {
      filter.isActive = false;
      filter.isArchived = false;
    } else if (!includeArchived) {
      filter.isArchived = false;
    }

    const sortOptions = mapSort(sort);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(numericLimit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / numericLimit) || 1;

    return res.status(200).json({
      products,
      total,
      page: numericPage,
      totalPages,
      limit: numericLimit,
    });
  } catch (err) {
    return next(err);
  }
};

// GET /api/admin/products/:id
exports.getAdminProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    return res.status(200).json({ product });
  } catch (err) {
    return next(err);
  }
};

// POST /api/admin/products
// Creates a new product including variants and images.
exports.createAdminProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      category,
      brand,
      price,
      discountPrice,
      stock,
      isFeatured,
      isActive,
      tags,
      metaTitle,
      metaDescription,
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'Product name is required.' });
    }
    if (!category || !String(category).trim()) {
      return res.status(400).json({ message: 'Category is required.' });
    }

    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      return res
        .status(400)
        .json({ message: 'Price must be a positive number.' });
    }

    const numericStock = Number(stock ?? 0);
    if (Number.isNaN(numericStock) || numericStock < 0) {
      return res
        .status(400)
        .json({ message: 'Stock must be greater than or equal to 0.' });
    }

    const images = collectImageUrls(req);
    if (!images.length) {
      return res
        .status(400)
        .json({ message: 'At least one product image is required.' });
    }

    const numericDiscountPrice =
      discountPrice !== undefined && discountPrice !== null && discountPrice !== ''
        ? Number(discountPrice)
        : undefined;

    if (
      numericDiscountPrice !== undefined &&
      (Number.isNaN(numericDiscountPrice) || numericDiscountPrice < 0)
    ) {
      return res
        .status(400)
        .json({ message: 'Discount price must be a positive number.' });
    }

    const variants = parseVariants(req.body.variants);

    const slug = buildSlug(name);

    const product = await Product.create({
      name: name.trim(),
      slug,
      description,
      price: numericPrice,
      discountPrice: numericDiscountPrice,
      images,
      image: images[0],
      category: String(category).toLowerCase(),
      brand: brand || '',
      countInStock: numericStock,
      variants,
      isFeatured: Boolean(isFeatured),
      isActive: isActive === undefined ? true : isActive === 'true' || isActive === true,
      seo: {
        metaTitle: metaTitle || '',
        metaDescription: metaDescription || '',
        metaKeywords: Array.isArray(tags)
          ? tags
          : typeof tags === 'string' && tags
          ? tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
      },
      tags:
        Array.isArray(tags) && tags.length
          ? tags
          : typeof tags === 'string' && tags
          ? tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
      activityLogs: [
        {
          action: 'created',
          user: req.user?._id,
          note: 'Product created via admin panel.',
        },
      ],
    });

    return res.status(201).json({
      message: 'Product created successfully.',
      product,
    });
  } catch (err) {
    if (isDuplicateSlugError(err)) {
      return res.status(409).json({
        message:
          'A product with this name/slug already exists. Please use a different product name.',
      });
    }
    return next(err);
  }
};

// PUT /api/admin/products/:id
// Updates only the fields provided in the request body.
exports.updateAdminProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const updates = {};
    const {
      name,
      description,
      category,
      brand,
      price,
      discountPrice,
      stock,
      isFeatured,
      isActive,
      tags,
      metaTitle,
      metaDescription,
      approvalStatus,
      variants: rawVariants,
      replaceImages,
    } = req.body;

    if (name && String(name).trim()) {
      updates.name = String(name).trim();
      updates.slug = buildSlug(name);
    }
    if (description !== undefined) {
      updates.description = description;
    }
    if (category) {
      updates.category = String(category).toLowerCase();
    }
    if (brand !== undefined) {
      updates.brand = brand;
    }

    if (price !== undefined) {
      const numericPrice = Number(price);
      if (Number.isNaN(numericPrice) || numericPrice < 0) {
        return res
          .status(400)
          .json({ message: 'Price must be a positive number.' });
      }
      updates.price = numericPrice;
    }

    if (discountPrice !== undefined) {
      const numericDiscountPrice = Number(discountPrice);
      if (Number.isNaN(numericDiscountPrice) || numericDiscountPrice < 0) {
        return res
          .status(400)
          .json({ message: 'Discount price must be a positive number.' });
      }
      updates.discountPrice = numericDiscountPrice;
    }

    if (stock !== undefined) {
      const numericStock = Number(stock);
      if (Number.isNaN(numericStock) || numericStock < 0) {
        return res
          .status(400)
          .json({ message: 'Stock must be greater than or equal to 0.' });
      }
      updates.countInStock = numericStock;
    }

    if (isFeatured !== undefined) {
      updates.isFeatured = isFeatured === 'true' || isFeatured === true;
    }
    if (isActive !== undefined) {
      updates.isActive = isActive === 'true' || isActive === true;
    }

    const newImages = collectImageUrls(req);
    let existingImages = Array.isArray(product.images) ? [...product.images] : [];
    if (req.body.existingImages) {
      try {
        const parsed = typeof req.body.existingImages === 'string'
          ? JSON.parse(req.body.existingImages)
          : req.body.existingImages;
        if (Array.isArray(parsed)) existingImages = parsed.filter(Boolean);
      } catch { /* ignore invalid JSON */ }
    }

    if (newImages.length) {
      if (replaceImages === 'true' || replaceImages === true) {
        updates.images = newImages;
      } else {
        updates.images = [...existingImages, ...newImages];
      }
      updates.image = updates.images[0] || null;
    } else if (existingImages.length !== (product.images || []).length) {
      updates.images = existingImages;
      updates.image = existingImages[0] || null;
    }

    const parsedVariants = parseVariants(rawVariants);
    if (parsedVariants.length) {
      updates.variants = parsedVariants;
    }

    if (approvalStatus) {
      updates.approvalStatus = approvalStatus;
    }

    if (metaTitle !== undefined || metaDescription !== undefined || tags !== undefined) {
      const currentSeo =
        product.seo && typeof product.seo === 'object'
          ? product.seo.toObject?.() || product.seo
          : {};
      updates.seo = {
        ...currentSeo,
      };
      if (metaTitle !== undefined) {
        updates.seo.metaTitle = metaTitle;
      }
      if (metaDescription !== undefined) {
        updates.seo.metaDescription = metaDescription;
      }
      if (tags !== undefined) {
        const tagArray =
          Array.isArray(tags) && tags.length
            ? tags
            : typeof tags === 'string' && tags
            ? tags.split(',').map((t) => t.trim()).filter(Boolean)
            : [];
        updates.tags = tagArray;
        updates.seo.metaKeywords = tagArray;
      }
    }

    Object.assign(product, updates);
    product.activityLogs.push({
      action: 'updated',
      user: req.user?._id,
      note: 'Product updated via admin panel.',
    });

    await product.save();

    return res.status(200).json({
      message: 'Product updated successfully.',
      product,
    });
  } catch (err) {
    if (isDuplicateSlugError(err)) {
      return res.status(409).json({
        message:
          'A product with this name/slug already exists. Please use a different product name.',
      });
    }
    return next(err);
  }
};

// DELETE /api/admin/products/:id
// Permanently deletes a product.
exports.deleteAdminProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    await product.deleteOne();
    return res.status(200).json({ message: 'Product deleted successfully.' });
  } catch (err) {
    return next(err);
  }
};

