const db = require('../config/db');

exports.getAllInventoryLogs = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT il.*, i.name AS ingredient_name
       FROM inventory_logs il
       LEFT JOIN ingredients i ON il.ingredient_id = i.id
       ORDER BY il.id`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

exports.getInventoryLogById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT il.*, i.name AS ingredient_name
       FROM inventory_logs il
       LEFT JOIN ingredients i ON il.ingredient_id = i.id
       WHERE il.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory log not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.createInventoryLog = async (req, res, next) => {
  try {
    const { ingredient_id, change_type, quantity, note } = req.body;
    const result = await db.query(
      `INSERT INTO inventory_logs (ingredient_id, change_type, quantity, note)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [ingredient_id, change_type, quantity, note]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.updateInventoryLog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { ingredient_id, change_type, quantity, note } = req.body;
    const result = await db.query(
      `UPDATE inventory_logs
       SET ingredient_id = $1, change_type = $2, quantity = $3, note = $4
       WHERE id = $5 RETURNING *`,
      [ingredient_id, change_type, quantity, note, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory log not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.deleteInventoryLog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM inventory_logs WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory log not found' });
    }
    res.json({ message: 'Inventory log deleted successfully' });
  } catch (error) {
    next(error);
  }
};
