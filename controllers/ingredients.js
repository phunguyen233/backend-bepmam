const db = require('../config/db');

exports.getAllIngredients = async (req, res, next) => {
  try {
    const { shopId } = req;
    const { shop_id } = req.query;
    const currentShopId = shopId || shop_id;

    let query;
    let values = [];

    if (currentShopId) {
      query = `SELECT i.*, u.name AS unit_name, u.symbol AS unit_symbol
               FROM ingredients i
               LEFT JOIN units u ON i.unit_id = u.id
               WHERE i.shop_id = $1
               ORDER BY i.id`;
      values.push(currentShopId);
    } else {
      query = `SELECT i.*, u.name AS unit_name, u.symbol AS unit_symbol
               FROM ingredients i
               LEFT JOIN units u ON i.unit_id = u.id
               ORDER BY i.id`;
    }

    const result = await db.query(query, values);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

exports.getIngredientById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { shopId } = req;

    let query;
    let values = [id];

    if (shopId) {
      query = `SELECT i.*, u.name AS unit_name, u.symbol AS unit_symbol
               FROM ingredients i
               LEFT JOIN units u ON i.unit_id = u.id
               WHERE i.id = $1 AND i.shop_id = $2`;
      values.push(shopId);
    } else {
      query = `SELECT i.*, u.name AS unit_name, u.symbol AS unit_symbol
               FROM ingredients i
               LEFT JOIN units u ON i.unit_id = u.id
               WHERE i.id = $1`;
    }

    const result = await db.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ingredient not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.createIngredient = async (req, res, next) => {
  try {
    const { name, unit_id, stock_quantity } = req.body;
    const { user } = req;
    const { shopId } = req;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const shop_id = user?.shop_id || shopId || null;

    const result = await db.query(
      'INSERT INTO ingredients (name, unit_id, stock_quantity, shop_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, unit_id, stock_quantity || 0, shop_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.updateIngredient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, unit_id, stock_quantity } = req.body;
    const { shopId } = req;

    let query;
    let values = [name, unit_id, stock_quantity, id];

    if (shopId) {
      query = 'UPDATE ingredients SET name = $1, unit_id = $2, stock_quantity = $3 WHERE id = $4 AND shop_id = $5 RETURNING *';
      values.push(shopId);
    } else {
      query = 'UPDATE ingredients SET name = $1, unit_id = $2, stock_quantity = $3 WHERE id = $4 RETURNING *';
    }

    const result = await db.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ingredient not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.deleteIngredient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { shopId } = req;

    let query;
    let values = [id];

    if (shopId) {
      query = 'DELETE FROM ingredients WHERE id = $1 AND shop_id = $2 RETURNING id';
      values.push(shopId);
    } else {
      query = 'DELETE FROM ingredients WHERE id = $1 RETURNING id';
    }

    const result = await db.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ingredient not found' });
    }
    res.json({ message: 'Ingredient deleted successfully' });
  } catch (error) {
    next(error);
  }
};
