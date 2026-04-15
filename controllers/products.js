const db = require('../config/db');
const { uploadImage, deleteImage } = require('../utils/cloudinaryUpload');

exports.getAllProducts = async (req, res, next) => {
  try {
    const { active, category_id, search, shop_id } = req.query;
    const { shopId } = req;
    const filters = [];
    const values = [];

    // If using API key (verifyApiKey middleware), filter by that shop
    const currentShopId = shopId || shop_id;
    if (currentShopId) {
      values.push(currentShopId);
      filters.push(`p.shop_id = $${values.length}`);
    }

    if (active !== undefined) {
      values.push(active === 'true');
      filters.push(`p.is_active = $${values.length}`);
    }
    if (category_id) {
      values.push(category_id);
      filters.push(`p.category_id = $${values.length}`);
    }
    if (search) {
      values.push(`%${search}%`);
      filters.push(`p.name ILIKE $${values.length}`);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const query = `
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY p.id
    `;
    const result = await db.query(query, values);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { shopId } = req;

    let query;
    let values = [id];

    if (shopId) {
      query = `SELECT p.*, c.name AS category_name
               FROM products p
               LEFT JOIN categories c ON p.category_id = c.id
               WHERE p.id = $1 AND p.shop_id = $2`;
      values.push(shopId);
    } else {
      query = `SELECT p.*, c.name AS category_name
               FROM products p
               LEFT JOIN categories c ON p.category_id = c.id
               WHERE p.id = $1`;
    }

    const result = await db.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const { name, price, cost_price, description, image_url, category_id, is_active } = req.body;
    const { user } = req;
    const { shopId } = req;

    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    // Use shop_id from token, or from shopId (API key), or from body
    const shop_id = user?.shop_id || shopId || null;

    const result = await db.query(
      `INSERT INTO products (name, price, cost_price, description, image_url, category_id, shop_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, price, cost_price || 0, description, image_url, category_id, shop_id, is_active !== false]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.createProductWithImage = async (req, res, next) => {
  try {
    const { name, price, cost_price, description, category_id, is_active, image_base64 } = req.body;
    const { user } = req;
    const { shopId } = req;

    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    let imageUrl = null;

    // Upload image to Cloudinary if provided
    if (image_base64) {
      const uploadResult = await uploadImage(image_base64, `product-${Date.now()}-${name}`);
      if (!uploadResult.success) {
        return res.status(400).json({ error: 'Image upload failed', details: uploadResult.error });
      }
      imageUrl = uploadResult.url;
    }

    // Use shop_id from token or API key
    const shop_id = user?.shop_id || shopId || null;

    const result = await db.query(
      `INSERT INTO products (name, price, cost_price, description, image_url, category_id, shop_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, price, cost_price || 0, description, imageUrl, category_id, shop_id, is_active !== false]
    );

    res.status(201).json({
      message: 'Product created successfully',
      product: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, price, cost_price, description, image_url, category_id, is_active } = req.body;
    const { shopId } = req;

    let query;
    let values = [name, price, cost_price || 0, description, image_url, category_id, is_active !== false, id];

    if (shopId) {
      query = `UPDATE products SET name = $1, price = $2, cost_price = $3, description = $4,
        image_url = $5, category_id = $6, is_active = $7
       WHERE id = $8 AND shop_id = $9 RETURNING *`;
      values.push(shopId);
    } else {
      query = `UPDATE products SET name = $1, price = $2, cost_price = $3, description = $4,
        image_url = $5, category_id = $6, is_active = $7
       WHERE id = $8 RETURNING *`;
    }

    const result = await db.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.updateProductWithImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, price, cost_price, description, category_id, is_active, image_base64, old_image_url } = req.body;
    const { shopId } = req;

    let imageUrl = old_image_url;

    // Upload new image if provided
    if (image_base64) {
      const uploadResult = await uploadImage(image_base64, `product-${Date.now()}-${name}`);
      if (!uploadResult.success) {
        return res.status(400).json({ error: 'Image upload failed', details: uploadResult.error });
      }
      imageUrl = uploadResult.url;
    }

    let query;
    let values = [name, price, cost_price || 0, description, imageUrl, category_id, is_active !== false, id];

    if (shopId) {
      query = `UPDATE products SET name = $1, price = $2, cost_price = $3, description = $4,
        image_url = $5, category_id = $6, is_active = $7
       WHERE id = $8 AND shop_id = $9 RETURNING *`;
      values.push(shopId);
    } else {
      query = `UPDATE products SET name = $1, price = $2, cost_price = $3, description = $4,
        image_url = $5, category_id = $6, is_active = $7
       WHERE id = $8 RETURNING *`;
    }

    const result = await db.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      message: 'Product updated successfully',
      product: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { shopId } = req;

    let query;
    let values = [id];

    if (shopId) {
      query = 'DELETE FROM products WHERE id = $1 AND shop_id = $2 RETURNING id, image_url';
      values.push(shopId);
    } else {
      query = 'DELETE FROM products WHERE id = $1 RETURNING id, image_url';
    }

    const result = await db.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};
