const path = require('path');
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');

/**
 * Build URL-safe slug from name.
 */
const buildSlug = (name) =>
  String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

/**
 * Collect category image URL from multer upload or body.
 */
const collectCategoryImageUrl = (req) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  if (req.file && req.file.path) {
    return `${baseUrl}/uploads/${path.basename(req.file.path)}`;
  }
  if (req.body.image && typeof req.body.image === 'string') {
    return req.body.image.trim() || null;
  }
  return null;
};

/**
 * Ensure slug uniqueness by appending suffix if needed.
 */
const ensureUniqueSlug = async (slug, excludeId = null) => {
  let candidate = slug;
  let counter = 1;
  const filter = { slug: candidate };
  if (excludeId) filter._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
  while (await Category.exists(filter)) {
    candidate = `${slug}-${counter}`;
    filter.slug = candidate;
    counter += 1;
  }
  return candidate;
};

/**
 * Build path from parent path + own slug (e.g., "electronics/mobiles").
 */
const buildPath = (parentPath, ownSlug) => {
  if (!parentPath || !ownSlug) return ownSlug || '';
  return `${parentPath}/${ownSlug}`;
};

/**
 * Check circular parent: cannot assign category A as parent of B if B is ancestor of A.
 */
const isCircularParent = async (categoryId, newParentId) => {
  if (!newParentId || !categoryId) return false;
  const visited = new Set();
  let current = newParentId.toString();
  const selfId = categoryId.toString();
  while (current) {
    if (current === selfId) return true;
    if (visited.has(current)) break;
    visited.add(current);
    const parent = await Category.findById(current).select('parent').lean();
    if (!parent || !parent.parent) break;
    current = parent.parent.toString();
  }
  return false;
};

/**
 * Update productCount for categories by aggregating Product.category (slug).
 */
const updateProductCounts = async () => {
  const counts = await Product.aggregate([
    { $match: { isArchived: { $ne: true } } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const slugToCount = Object.fromEntries(
    counts.map((c) => [String(c._id || '').toLowerCase(), c.count])
  );
  const categories = await Category.find({}).select('slug').lean();
  const bulkOps = categories.map((cat) => ({
    updateOne: {
      filter: { _id: cat._id },
      update: { $set: { productCount: slugToCount[cat.slug] || 0 } },
    },
  }));
  if (bulkOps.length) {
    await Category.bulkWrite(bulkOps);
  }
};

/**
 * Build tree structure from flat categories array.
 * Children are nested under parent; root items have parent === null.
 */
const buildTree = (flatCategories) => {
  const byId = new Map();
  flatCategories.forEach((c) => {
    byId.set(c._id.toString(), { ...c, children: [] });
  });
  const roots = [];
  flatCategories.forEach((c) => {
    const node = byId.get(c._id.toString());
    if (!c.parent) {
      roots.push(node);
    } else {
      const parent = byId.get(c.parent.toString());
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }
  });
  // Sort by position then name
  const sortNodes = (nodes) => {
    nodes.sort((a, b) => {
      const pa = a.position ?? 0;
      const pb = b.position ?? 0;
      if (pa !== pb) return pa - pb;
      return (a.name || '').localeCompare(b.name || '');
    });
    nodes.forEach((n) => sortNodes(n.children || []));
  };
  sortNodes(roots);
  return roots;
};

// GET /api/admin/categories
exports.getAdminCategories = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      keyword,
      parent,
      status,
      tree,
    } = req.query;

    const numericLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
    const numericPage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (numericPage - 1) * numericLimit;

    const filter = {};

    if (keyword) {
      filter.$or = [
        { name: { $regex: String(keyword), $options: 'i' } },
        { slug: { $regex: String(keyword), $options: 'i' } },
      ];
    }

    if (parent === 'root' || parent === '') {
      filter.parent = null;
    } else if (parent) {
      filter.parent = new mongoose.Types.ObjectId(parent);
    }

    if (status === 'active') {
      filter.isActive = true;
    } else if (status === 'inactive') {
      filter.isActive = false;
    }

    // Tree mode: return full hierarchy (no pagination)
    if (tree === 'true' || tree === '1') {
      const flat = await Category.find(filter)
        .populate('parent', 'name slug')
        .sort({ position: 1, name: 1 })
        .lean();
      await updateProductCounts();
      const withCounts = await Category.find(filter).sort({ position: 1, name: 1 }).lean();
      const slugToCount = {};
      const counts = await Product.aggregate([
        { $match: { isArchived: { $ne: true } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]);
      counts.forEach((c) => {
        slugToCount[String(c._id || '').toLowerCase()] = c.count;
      });
      const flatWithCount = flat.map((c) => ({
        ...c,
        productCount: slugToCount[c.slug] ?? 0,
      }));
      const treeData = buildTree(flatWithCount);
      return res.status(200).json({
        categories: treeData,
        total: flat.length,
        tree: true,
      });
    }

    const [categories, total] = await Promise.all([
      Category.find(filter)
        .populate('parent', 'name slug')
        .sort({ position: 1, name: 1 })
        .skip(skip)
        .limit(numericLimit)
        .lean(),
      Category.countDocuments(filter),
    ]);

    // Add product counts via aggregation
    const slugToCount = {};
    const counts = await Product.aggregate([
      { $match: { isArchived: { $ne: true } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    counts.forEach((c) => {
      slugToCount[String(c._id || '').toLowerCase()] = c.count;
    });
    const withCounts = categories.map((c) => ({
      ...c,
      productCount: slugToCount[c.slug] ?? 0,
    }));

    const totalPages = Math.ceil(total / numericLimit) || 1;

    return res.status(200).json({
      categories: withCounts,
      total,
      page: numericPage,
      totalPages,
      limit: numericLimit,
    });
  } catch (err) {
    return next(err);
  }
};

// GET /api/admin/categories/:id
exports.getAdminCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parent', 'name slug _id')
      .lean();
    if (!category) {
      return res.status(404).json({ message: 'Category not found.' });
    }

    const countResult = await Product.countDocuments({
      category: category.slug,
      isArchived: { $ne: true },
    });
    category.productCount = countResult;

    return res.status(200).json({ category });
  } catch (err) {
    return next(err);
  }
};

// POST /api/admin/categories
exports.createAdminCategory = async (req, res, next) => {
  try {
    const {
      name,
      description,
      slug: rawSlug,
      parent,
      isActive,
      isFeatured,
      seoTitle,
      seoDescription,
      position,
      filters,
      landingContent,
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'Category name is required.' });
    }

    const baseSlug = rawSlug && String(rawSlug).trim()
      ? buildSlug(rawSlug)
      : buildSlug(name);
    const slug = await ensureUniqueSlug(baseSlug);

    let parentDoc = null;
    let parentPath = '';
    if (parent && mongoose.Types.ObjectId.isValid(parent)) {
      parentDoc = await Category.findById(parent).lean();
      if (!parentDoc) {
        return res.status(400).json({ message: 'Parent category not found.' });
      }
      parentPath = parentDoc.path || parentDoc.slug;
    }

    const normalizedPosition =
      typeof position === 'number' ? position : parseInt(position, 10) || 0;
    const positionTaken = await Category.exists({
      parent: parentDoc ? parentDoc._id : null,
      position: normalizedPosition,
    });
    if (positionTaken) {
      return res.status(400).json({
        message: 'Display order is already taken for this parent category.',
      });
    }

    const imageUrl = collectCategoryImageUrl(req);

    const category = await Category.create({
      name: name.trim(),
      slug,
      description: description || '',
      image: imageUrl,
      parent: parentDoc ? parentDoc._id : null,
      path: buildPath(parentPath, slug),
      position: normalizedPosition,
      isActive: isActive === undefined ? true : isActive === 'true' || isActive === true,
      isFeatured: isFeatured === 'true' || isFeatured === true,
      seoTitle: seoTitle || '',
      seoDescription: seoDescription || '',
      filters: typeof filters === 'object' ? filters : {},
      landingContent: landingContent || '',
    });

    await updateProductCounts();

    return res.status(201).json({
      message: 'Category created successfully.',
      category,
    });
  } catch (err) {
    return next(err);
  }
};

// PUT /api/admin/categories/:id
exports.updateAdminCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found.' });
    }

    const {
      name,
      description,
      slug: rawSlug,
      parent,
      isActive,
      isFeatured,
      seoTitle,
      seoDescription,
      position,
      filters,
      landingContent,
    } = req.body;
    const previousSlug = category.slug;
    const previousPath = category.path || category.slug;
    const originalParent = category.parent ? category.parent.toString() : '';
    const originalPosition = Number(category.position || 0);

    if (name && String(name).trim()) {
      category.name = name.trim();
    }

    const baseSlug = rawSlug !== undefined
      ? (rawSlug && String(rawSlug).trim() ? buildSlug(rawSlug) : buildSlug(category.name))
      : category.slug;
    category.slug = await ensureUniqueSlug(baseSlug, category._id);

    if (description !== undefined) category.description = description || '';
    if (seoTitle !== undefined) category.seoTitle = seoTitle || '';
    if (seoDescription !== undefined) category.seoDescription = seoDescription || '';
    if (isActive !== undefined) category.isActive = isActive === 'true' || isActive === true;
    if (isFeatured !== undefined) category.isFeatured = isFeatured === 'true' || isFeatured === true;
    if (position !== undefined) category.position = parseInt(position, 10) || 0;
    if (filters !== undefined && typeof filters === 'object') category.filters = filters;
    if (landingContent !== undefined) category.landingContent = landingContent || '';

    if (parent !== undefined) {
      if (!parent || parent === '' || parent === 'null') {
        category.parent = null;
      } else if (mongoose.Types.ObjectId.isValid(parent)) {
        const circular = await isCircularParent(category._id, parent);
        if (circular) {
          return res.status(400).json({
            message: 'Circular parent assignment is not allowed. This category cannot be a parent of itself or its ancestors.',
          });
        }
        const parentDoc = await Category.findById(parent).lean();
        if (!parentDoc) {
          return res.status(400).json({ message: 'Parent category not found.' });
        }
        if (parentDoc._id.toString() === category._id.toString()) {
          return res.status(400).json({ message: 'Category cannot be its own parent.' });
        }
        category.parent = parentDoc._id;
      }
    }

    let parentPath = '';
    if (category.parent) {
      const parentDoc = await Category.findById(category.parent)
        .select('path slug')
        .lean();
      if (parentDoc) {
        parentPath = parentDoc.path || parentDoc.slug;
      }
    }
    category.path = buildPath(parentPath, category.slug);

    const nextParent = category.parent ? category.parent.toString() : '';
    const nextPosition = Number(category.position || 0);
    const hasPositionContextChanged =
      originalParent !== nextParent || originalPosition !== nextPosition;
    if (hasPositionContextChanged) {
      const positionTaken = await Category.exists({
        _id: { $ne: category._id },
        parent: category.parent || null,
        position: category.position,
      });
      if (positionTaken) {
        return res.status(400).json({
          message: 'Display order is already taken for this parent category.',
        });
      }
    }

    const imageUrl = collectCategoryImageUrl(req);
    if (imageUrl) category.image = imageUrl;

    await category.save();

    // Keep product references in sync when category slug changes.
    if (previousSlug !== category.slug) {
      await Product.updateMany(
        { category: previousSlug, isArchived: { $ne: true } },
        { $set: { category: category.slug } }
      );
    }

    // Keep descendant path prefixes in sync if this category path changed.
    if (previousPath !== category.path) {
      const descendants = await Category.find({
        _id: { $ne: category._id },
        path: { $regex: `^${previousPath}/` },
      });
      if (descendants.length) {
        await Promise.all(
          descendants.map((child) => {
            child.path = child.path.replace(
              `${previousPath}/`,
              `${category.path}/`
            );
            return child.save();
          })
        );
      }
    }
    await updateProductCounts();

    return res.status(200).json({
      message: 'Category updated successfully.',
      category,
    });
  } catch (err) {
    return next(err);
  }
};

// DELETE /api/admin/categories/:id
// Soft delete: set isActive = false. Or hard delete if no products and no children.
exports.deleteAdminCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found.' });
    }

    const productCount = await Product.countDocuments({
      category: category.slug,
      isArchived: { $ne: true },
    });

    const childCount = await Category.countDocuments({ parent: category._id });

    // Option: soft delete (recommended)
    const softDelete = req.query.hard !== 'true';
    if (softDelete) {
      category.isActive = false;
      await category.save();
      await updateProductCounts();
      return res.status(200).json({
        message: 'Category deactivated successfully.',
        deactivated: true,
      });
    }

    // Hard delete: only if no products and no children
    if (productCount > 0) {
      return res.status(400).json({
        message: `Cannot delete category with ${productCount} product(s). Reassign or remove products first, or use soft delete (deactivate).`,
      });
    }
    if (childCount > 0) {
      return res.status(400).json({
        message: `Cannot delete category with ${childCount} subcategory(ies). Delete or reassign subcategories first.`,
      });
    }

    await Category.findByIdAndDelete(category._id);
    await updateProductCounts();

    return res.status(200).json({
      message: 'Category deleted successfully.',
    });
  } catch (err) {
    return next(err);
  }
};

// GET /api/admin/categories/tree/hierarchy
// Returns flat list suitable for breadcrumb/parent dropdown
exports.getCategoryHierarchy = async (req, res, next) => {
  try {
    const flat = await Category.find({ isActive: true })
      .sort({ position: 1, path: 1, name: 1 })
      .select('name slug path parent')
      .lean();
    const treeData = buildTree(flat);
    return res.status(200).json({ categories: treeData });
  } catch (err) {
    return next(err);
  }
};
