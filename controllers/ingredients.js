const db = require('../config/db');

exports.getAllIngredients = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT i.*, u.name AS unit_name, u.symbol AS unit_symbol
       FROM ingredients i
       LEFT JOIN units u ON i.unit_id = u.id
       ORDER BY i.id`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

exports.getIngredientById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT i.*, u.name AS unit_name, u.symbol AS unit_symbol
       FROM ingredients i
       LEFT JOIN units u ON i.unit_id = u.id
       WHERE i.id = $1`,
      [id]
    );
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
    const result = await db.query(
      'INSERT INTO ingredients (name, unit_id, stock_quantity) VALUES ($1, $2, $3) RETURNING *',
      [name, unit_id, stock_quantity || 0]
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
    const result = await db.query(
      'UPDATE ingredients SET name = $1, unit_id = $2, stock_quantity = $3 WHERE id = $4 RETURNING *',
      [name, unit_id, stock_quantity, id]
    );
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
    const result = await db.query('DELETE FROM ingredients WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ingredient not found' });
    }
    res.json({ message: 'Ingredient deleted successfully' });
  } catch (error) {
    next(error);
  }
};
