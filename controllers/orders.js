const db = require('../config/db');

exports.getAllOrders = async (req, res, next) => {
  try {
    const { shopId } = req;
    const { shop_id } = req.query;
    const currentShopId = shopId || shop_id;

    let query;
    let values = [];

    if (currentShopId) {
      query = `SELECT o.*, u.name AS customer_name, u.email AS customer_email
               FROM orders o
               LEFT JOIN users u ON o.user_id = u.id
               WHERE o.shop_id = $1
               ORDER BY o.id`;
      values.push(currentShopId);
    } else {
      query = `SELECT o.*, u.name AS customer_name, u.email AS customer_email
               FROM orders o
               LEFT JOIN users u ON o.user_id = u.id
               ORDER BY o.id`;
    }

    const result = await db.query(query, values);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { shopId } = req;

    let whereClause = 'WHERE o.id = $1';
    let values = [id];

    if (shopId) {
      whereClause += ' AND o.shop_id = $2';
      values.push(shopId);
    }

    const orderResult = await db.query(
      `SELECT o.*, u.name AS customer_name, u.email AS customer_email
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       ${whereClause}`,
      values
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
    const { user } = req;
    const { shopId } = req;

    const shop_id = user?.shop_id || shopId || null;

    const result = await db.query(
      'INSERT INTO orders (user_id, total_price, status, shop_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, total_price || 0, status || 'pending', shop_id]
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
    const { shopId } = req;

    let query;
    let values = [user_id, total_price, status, id];

    if (shopId) {
      query = 'UPDATE orders SET user_id = $1, total_price = $2, status = $3 WHERE id = $4 AND shop_id = $5 RETURNING *';
      values.push(shopId);
    } else {
      query = 'UPDATE orders SET user_id = $1, total_price = $2, status = $3 WHERE id = $4 RETURNING *';
    }

    const result = await db.query(query, values);
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
    const { shopId } = req;

    let query;
    let values = [id];

    if (shopId) {
      query = 'DELETE FROM orders WHERE id = $1 AND shop_id = $2 RETURNING id';
      values.push(shopId);
    } else {
      query = 'DELETE FROM orders WHERE id = $1 RETURNING id';
    }

    const result = await db.query(query, values);
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
    const { shopId } = req;

    // Verify order belongs to shop if using API key
    if (shopId) {
      const orderCheck = await db.query('SELECT id FROM orders WHERE id = $1 AND shop_id = $2', [id, shopId]);
      if (orderCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }
    }

    await db.query('SELECT process_order($1)', [id]);
    await db.query('UPDATE orders SET status = $1 WHERE id = $2', ['completed', id]);
    res.json({ message: 'Order processed and inventory updated' });
  } catch (error) {
    next(error);
  }
};
