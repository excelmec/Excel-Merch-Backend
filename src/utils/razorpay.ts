import Razorpay from 'razorpay';
import { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } from './env';

export const razorpay = new Razorpay({
	key_id: RAZORPAY_KEY_ID,
	key_secret: RAZORPAY_KEY_SECRET,
});

function roundToTwoDecimals(num: number): number {
	console.log('before', num);
	const floatNum = parseFloat(num.toString()).toFixed(2);
	console.log('after', parseFloat(floatNum));
	return parseFloat(floatNum);
}

export function getTransferAmountInRs(amountInRs: number) {
	// All values must be rounded to 2 decimal digits. At each step

	amountInRs = roundToTwoDecimals(amountInRs);
	console.log('amountInRs', amountInRs);

	// 1. Deduct RazorPay fees (2%) and GST (18%) of the fees
	const Razor_Pay_Fees = roundToTwoDecimals(amountInRs * 0.02 * 1.18);
	console.log('Razor_Pay_Fees', Razor_Pay_Fees);
	const Amount_intended_to_transfer = amountInRs - Razor_Pay_Fees;
	console.log('Amount_intended_to_transfer', Amount_intended_to_transfer);
	// 2. Deduct Linked Transfer fees (0.25%) and GST (18%) of the fees
	const Linked_Transfer_Fee = roundToTwoDecimals(
		Amount_intended_to_transfer * 0.0025 * 1.18
	);
	console.log('Linked_Transfer_Fee', Linked_Transfer_Fee);

	const Total_Fees = Razor_Pay_Fees + Linked_Transfer_Fee;
	console.log('Total_Fees', Total_Fees);

	const NetTransferAmount = amountInRs - Total_Fees;
	console.log('NetTransferAmount', NetTransferAmount);
	return NetTransferAmount;
}
