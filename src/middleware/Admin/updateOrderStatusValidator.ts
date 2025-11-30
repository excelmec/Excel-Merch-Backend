import { body } from 'express-validator';
import { getValidator } from '../Validator';
import { SelfpickupStatus, ShippingStatus } from '@prisma/client';

const shippingStatuses: ShippingStatus[] = [
	'not_shipped',
	'processing',
	'shipping',
	'delivered',
];

export const selfPickupStatuses: SelfpickupStatus[] = [
  'not_ready_for_pickup',
  'ready_for_pickup',
  'picked_up',
];

const updateOrderStatusValidators = [
  body().custom(value => {
    if (!value.shippingStatus && !value.selfpickupStatus) {
      throw new Error('Either shippingStatus or selfpickupStatus must be provided');
    }
    return true;
  }),

  body('shippingStatus')
    .optional()
    .isString()
    .withMessage('shippingStatus must be a string')
    .isIn(shippingStatuses)
    .withMessage('Invalid shippingStatus'),

  body('selfpickupStatus')
    .optional()
    .isString()
    .withMessage('selfpickupStatus must be a string')
    .isIn(selfPickupStatuses)
    .withMessage('Invalid selfpickupStatus'),
];

export const updateOrderStatusValidator = getValidator(updateOrderStatusValidators);
