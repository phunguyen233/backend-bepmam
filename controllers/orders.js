const db = require('../config/db');

exports.getAllOrders = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT o.*, u.name AS customer_name, u.email AS customer_email
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       ORDER BY o.id`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const orderResult = await db.query(
      `SELECT o.*, u.name AS customer_name, u.email AS customer_email
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.id = $1`,
      [id]
    );
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const itemsResult = await db.query(
      `SELECT oi.*, p.name AS product_name
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [id]
    );
    res.json({ ...orderResult.rows[0], items: itemsResult.rows });
  } catch (error) {
    next(error);
  }
};

exports.createOrder = async (req, res, next) => {
  try {
    const { user_id, total_price, status } = req.body;
    const result = await db.query(
      'INSERT INTO orders (user_id, total_price, status) VALUES ($1, $2, $3) RETURNING *',
      [user_id, total_price || 0, status || 'pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.updateOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { user_id, total_price, status } = req.body;
    const result = await db.query(
      'UPDATE orders SET user_id = $1, total_price = $2, status = $3 WHERE id = $4 RETURNING *',
      [user_id, total_price, status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM orders WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.processOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.query('SELECT process_order($1)', [id]);
    await db.query('UPDATE orders SET status = $1 WHERE id = $2', ['completed', id]);
    res.json({ message: 'Order processed and inventory updated' });
  } catch (error) {
    next(error);
  }
};
