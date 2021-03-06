const Joi = require('@hapi/joi');

const model = require('../models/saleModel');
const stock = require('../models/productModel');

const NOT_FOUND = 404;
const UNPROCESSABLE_ENTITY = 422;
const validateSale = Joi.array().items({
  productId: Joi.string().required(),
  quantity: Joi.number().min(1).required()
});

async function create(items) {
  const { error } = validateSale.validate(items);

  if (error) { 
    return {
      status: UNPROCESSABLE_ENTITY,
      code: 'invalid_data',
      error: { message: 'Wrong product ID or invalid quantity' }
    };
  };

  const { productId } = items[0];
  const { name, quantity } = await stock.readById(productId);
  const itemQuantity = quantity - items[0].quantity;
  const NO_STOCK = 0;

  if (itemQuantity < NO_STOCK) {
    return {
      status: NOT_FOUND,
      code: 'stock_problem',
      error: { message: 'Such amount is not permitted to sell' }
    };
  }

  await stock.update(productId, name, itemQuantity);
  const newSale = await model.create(items);

  return newSale;
};

async function readAll() {
  const sales = await model.readAll();

  return sales;
};

async function readById(id) {
  const sale = await model.readById(id);

  if (!sale) {
    return {
      status: NOT_FOUND,
      code: 'not_found',
      error: { message: 'Sale not found' }
    };
  }

  return sale;
};

async function update(id, item) {
  const { error } = validateSale.validate(item);

  if (error) { 
    return {
      status: UNPROCESSABLE_ENTITY,
      code: 'invalid_data',
      error: { message: 'Wrong product ID or invalid quantity' }
    };
  };

  const updateSale = await model.update(id, item);

  return updateSale;
};

async function destroy(id) {
  const saleDeleted = await model.destroy(id);

  if (!saleDeleted) {
    return {
      status: UNPROCESSABLE_ENTITY,
      code: 'invalid_data',
      error: { message: 'Wrong sale ID format' }
    };
  }

  const { productId, quantity } = saleDeleted.itensSold[0];
  const product = await stock.readById(productId);
  const itemQuantity = product.quantity + quantity;
  await stock.update(productId, product.name, itemQuantity);
  
  return saleDeleted;
};

module.exports = {
  create,
  readAll,
  readById,
  update,
  destroy
};
