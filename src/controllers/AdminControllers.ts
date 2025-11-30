import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { BadRequestError, NotFoundError } from '../utils/error';
import { SelfpickupStatus, ShippingStatus } from '@prisma/client';
import { sendShippingStartedMail } from '../utils/mailer';
import { razorpay } from '../utils/razorpay';

interface UpdateOrderStatusRequest {
	selfpickupStatus?: SelfpickupStatus;
	shippingStatus?: ShippingStatus;
	trackingId?: string;
}

export async function updateOrderStatus(
	req: Request<
		{
			orderId: string;
		},
		{},
		UpdateOrderStatusRequest
	>,
	res: Response,
	next: NextFunction
) {
	const orderId = req.params.orderId;
	const { selfpickupStatus, shippingStatus, trackingId } = req.body;

	try {
		const order = await prisma.order.findUnique({
			where: { orderId: orderId },
			include: {
				user: true,
			},
		});

		if (!order) {
			throw new NotFoundError('Order not found');
		}

		
		if (order.isSelfPickup) {
			// logic for self pickup orders 
  			if (!selfpickupStatus) {
  			  throw new BadRequestError('selfpickupStatus is required for self-pickup orders');
  			}
		
  			/**
		 		* Only allow updating shipping status when order status is confirmed
		 	*/
  			if (
  			  order.orderStatus !== 'order_confirmed' ||
  			  order.paymentStatus !== 'payment_received'
  			) {
  			  throw new BadRequestError(
  			    'Order status must be confirmed and payment must be received to update self-pickup status'
  			  );
  			}
			// update selfpickup status
  			const updatedOrder = await prisma.order.update({
  			  where: { orderId },
  			  data: { selfpickupStatus: selfpickupStatus },
  			});
		
  			return res.status(200).json({
  			  order: updatedOrder,
  			  message: 'Self-pickup status updated successfully',
  			});
		} else {
			/**
		 		* Only allow updating shipping status when order status is confirmed
		 	*/
			if (
			order.orderStatus !== 'order_confirmed' ||
			order.paymentStatus !== 'payment_received'
		) {
			throw new BadRequestError(
				'Order status must be confirmed and payment must be received to update shipping status'
			);
		}

		if (
			order.shippingStatus !== ShippingStatus.shipping &&
			shippingStatus === ShippingStatus.shipping
		) {
			/**
			 * When admin sets shipping status to shipping, send mail to user
			 * with tracking id if present
			 */
			sendShippingStartedMail(
				order.user.name,
				order.orderId,
				order.user.email,
				trackingId
			);
		}

		const updatedOrder = await prisma.order.update({
			where: { orderId: orderId },
			data: {
				shippingStatus,
				trackingId,
			},
		});
		
		return res.status(200).json({
			order: updatedOrder,
			message: 'Order status updated successfully',
		});
		}
		
	} catch (err) {
		next(err);
	}
}

export async function getAllOrders(
	req: Request,
	res: Response,
	next: NextFunction
) {
	try {
		const orders = await prisma.order.findMany({
			where: {
				orderStatus: {
          in: ['order_confirmed', 'pre_ordered'],
        },
				paymentStatus: 'payment_received'
			},
			include: {
				orderItems: true,
				user: true,
				additionalCharges: true,
			},
		});

		return res.status(200).json({
			orders,
			message: 'Orders fetched successfully',
		});
	} catch (err) {
		next(err);
	}
}

export async function getOrderAdmin(
	req: Request,
	res: Response,
	next: NextFunction
) {
	try {
		const orderId = req.params.orderId;

		if (!orderId) {
			throw new BadRequestError('Order ID not provided');
		}

		const order = await prisma.order.findUnique({
			where: {
				orderId: orderId,
			},
			include: {
				orderItems: {
					include: {
						item: {
							include: {
								mediaObjects: true,
							},
						},
					},
				},
				additionalCharges: true,
				user: {
					include: {
						addresses: true,
					},
				},
			},
		});

		if (!order) {
			throw new NotFoundError('Order not found');
		}

		const razorpayOrderId = order.razOrderId;

		const razorpayOrder = await razorpay.orders.fetch(razorpayOrderId);

		const razorpayPayments = (
			await razorpay.orders.fetchPayments(razorpayOrderId)
		)?.items;

		return res.status(200).json({
			order,
			razorpayOrder,
			razorpayPayments,
		});
	} catch (err) {
		next(err);
	}
}
