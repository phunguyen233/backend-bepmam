const db = require('../config/db');

exports.getAllCustomers = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT c.*, u.name AS user_name, u.email AS user_email
       FROM customers c
       LEFT JOIN users u ON c.user_id = u.id
       ORDER BY c.id`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

exports.getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT c.*, u.name AS user_name, u.email AS user_email
       FROM customers c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.createCustomer = async (req, res, next) => {
  try {
    const { user_id, phone, address, total_spent } = req.body;
    const result = await db.query(
      'INSERT INTO customers (user_id, phone, address, total_spent) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, phone, address, total_spent || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { user_id, phone, address, total_spent } = req.body;
    const result = await db.query(
      'UPDATE customers SET user_id = $1, phone = $2, address = $3, total_spent = $4 WHERE id = $5 RETURNING *',
      [user_id, phone, address, total_spent, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM customers WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    next(error);
  }
};
