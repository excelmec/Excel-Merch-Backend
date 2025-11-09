import { Address } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { NotFoundError } from '../utils/error';

interface ProfileRequest {
	phoneNumber?: string;
	address: Omit<Address, 'userId'>;
}

export async function updateProfileController(
	req: Request<{}, {}, ProfileRequest>,
	res: Response,
	next: NextFunction
) {
	const { phoneNumber, address } = req.body;
	const decodedUser = req.decodedToken!;

	try {
		const newUser = await prisma.user.upsert({
			where: { id: decodedUser.user_id },
			update: {
				phoneNumber,
			},
			create: {
				id: decodedUser.user_id,
				name: decodedUser.name,
				email: decodedUser.email,
				phoneNumber,
			},

			include: {
				addresses: true,
			},
		});

		const newAddress = address.id
			? await prisma.address.update({
					where: { id: address.id },
					data: address,
				})
			: await prisma.address.create({
					data: {
						...address,
						userId: decodedUser.user_id,
					},
    });

		return res.json({
			user: {
				...newUser,
				address: newAddress,
			},
		});
	} catch (err) {
		next(err);
	}
}

/**
 * Creates a new user if one does not exist
 */
export async function getProfileController(
	req: Request,
	res: Response,
	next: NextFunction
) {
	try {
		const decodedUser = req.decodedToken!;
		const user = await prisma.user.findUnique({
			where: { id: decodedUser.user_id },
			include: {
				addresses: true,
				cartItems: true,
				orders: true,
			},
		});

		const userData = user
			? user
			: await prisma.user.create({
					data: {
						id: decodedUser.user_id,
						name: decodedUser.name,
						email: decodedUser.email,
					},
					include: {
						addresses: true,
						cartItems: true,
						orders: true,
					},
			  });

		return res.status(200).json({
			picture: decodedUser.picture,
			...userData,
			...( !user && { message: 'User profile created and returned' } ),
		});
	} catch (err) {
		next(err);
	}
}

export async function deleteAddressController(
	req: Request<{ addressId: string }>,
	res: Response,
	next: NextFunction
) {
	try {
		const decodedUser = req.decodedToken!;
		const addressId = parseInt(req.params.addressId, 10);

		const address = await prisma.address.findUnique({
			where: { id: addressId },
		});

		if (!address || address.userId !== decodedUser.user_id) {
			throw new NotFoundError('Address not found');
		}

		await prisma.address.delete({
			where: { id: addressId },
		});

		return res.status(200).json({
			message: 'Address deleted successfully',
		});
	} catch (err) {
		next(err);
	}
}
