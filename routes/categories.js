const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/categories');
const usersController = require('../controllers/users');

// Public routes (read)
router.get('/', categoriesController.getAllCategories);
router.get('/:id', categoriesController.getCategoryById);

// Protected routes (write)
router.post('/', usersController.verifyToken, categoriesController.createCategory);
router.put('/:id', usersController.verifyToken, categoriesController.updateCategory);
router.delete('/:id', usersController.verifyToken, categoriesController.deleteCategory);

module.exports = router;
