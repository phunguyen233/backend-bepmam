const db = require('../config/db');

exports.getAllInventoryImports = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT ii.*, i.name AS ingredient_name, u.symbol AS unit_symbol
       FROM inventory_imports ii
       LEFT JOIN ingredients i ON ii.ingredient_id = i.id
       LEFT JOIN units u ON ii.unit_id = u.id
       ORDER BY ii.id`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

exports.getInventoryImportById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT ii.*, i.name AS ingredient_name, u.symbol AS unit_symbol
       FROM inventory_imports ii
       LEFT JOIN ingredients i ON ii.ingredient_id = i.id
       LEFT JOIN units u ON ii.unit_id = u.id
       WHERE ii.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory import not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.createInventoryImport = async (req, res, next) => {
  try {
    const { ingredient_id, quantity, unit_id, import_price } = req.body;
    const result = await db.query(
      `INSERT INTO inventory_imports (ingredient_id, quantity, unit_id, import_price)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [ingredient_id, quantity, unit_id, import_price]
    );
    await db.query('SELECT import_ingredient($1, $2, $3)', [ingredient_id, quantity, unit_id]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.updateInventoryImport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { ingredient_id, quantity, unit_id, import_price } = req.body;
    const result = await db.query(
      `UPDATE inventory_imports
       SET ingredient_id = $1, quantity = $2, unit_id = $3, import_price = $4
       WHERE id = $5 RETURNING *`,
      [ingredient_id, quantity, unit_id, import_price, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory import not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.deleteInventoryImport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM inventory_imports WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory import not found' });
    }
    res.json({ message: 'Inventory import deleted successfully' });
  } catch (error) {
    next(error);
  }
};
