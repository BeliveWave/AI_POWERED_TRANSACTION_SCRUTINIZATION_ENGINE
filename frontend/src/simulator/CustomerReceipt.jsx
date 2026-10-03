import React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  RotateCcw,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card.jsx';
import { Button } from '../components/ui/button.jsx';

export default function CustomerReceipt({
  result,
  orderDetails,
  onReset
}) {
  if (!result) return null;

  const {
    transaction_id,
    status = 'Approve',
    reason_codes = []
  } = result;

  const isApproved = status === 'Approve';
  const isDeclined = status === 'Decline';
  const orderNumber = orderDetails?.orderId || `ORD-${(transaction_id || 84920) + 10000}`;
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
      <Card className="border border-slate-200 bg-white text-slate-900 shadow-md rounded-xl overflow-hidden">
        {/* Header Banner */}
        <div className={`p-8 text-center flex flex-col items-center gap-3 border-b ${
          isApproved
            ? 'bg-emerald-50 border-emerald-100 text-emerald-900'
            : isDeclined
            ? 'bg-red-50 border-red-100 text-red-900'
            : 'bg-amber-50 border-amber-100 text-amber-900'
        }`}>
          {isApproved ? (
            <div className="size-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
              <CheckCircle2 className="size-10 stroke-[2.2]" />
            </div>
          ) : isDeclined ? (
            <div className="size-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center shadow-inner">
              <XCircle className="size-10 stroke-[2.2]" />
            </div>
          ) : (
            <div className="size-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shadow-inner">
              <AlertTriangle className="size-10 stroke-[2.2]" />
            </div>
          )}

          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight">
              {isApproved
                ? 'Payment Confirmed'
                : isDeclined
                ? 'Payment Declined'
                : 'Payment Under Review'}
            </h2>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
              {isApproved
                ? 'Thank you for your order! Your payment has been authorized and confirmed.'
                : isDeclined
                ? 'Your card issuer could not authorize this payment. No funds were charged to your account.'
                : 'Your transaction has been submitted and is currently being verified by your bank.'}
            </p>
          </div>
        </div>

        {/* Receipt Content */}
        <CardContent className="p-6 flex flex-col gap-4 text-xs">
          <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
            <span className="text-slate-500">Order Number</span>
            <span className="font-mono font-medium text-slate-900">
              #{orderNumber}
            </span>
          </div>

          <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
            <span className="text-slate-500">Amount</span>
            <span className="font-semibold text-slate-900 text-sm">
              ${orderDetails?.amount ? Number(orderDetails.amount).toFixed(2) : '1,299.00'} USD
            </span>
          </div>

          {orderDetails?.cardholderName && (
            <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
              <span className="text-slate-500">Customer</span>
              <span className="font-medium text-slate-900">
                {orderDetails.cardholderName}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
            <span className="text-slate-500">Payment Method</span>
            <span className="font-medium text-slate-800 flex items-center gap-1.5">
              <CreditCard className="size-3.5 text-slate-400" />
              {orderDetails?.cardType || 'Visa'} ending in {orderDetails?.lastFour || '4242'}
            </span>
          </div>

          <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
            <span className="text-slate-500">Date & Time</span>
            <span className="text-slate-600">
              {currentDate}
            </span>
          </div>

          <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
            <span className="text-slate-500">Authorization Status</span>
            <span className={`font-medium ${
              isApproved
                ? 'text-emerald-700'
                : isDeclined
                ? 'text-red-700'
                : 'text-amber-700'
            }`}>
              {isApproved ? 'Approved (Auth Code: 00)' : isDeclined ? 'Declined by Issuer (Code: 05)' : 'Pending'}
            </span>
          </div>

          {/* Decline Explanation Notice (Realistic Bank Advice) */}
          {isDeclined && (
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs flex flex-col gap-1.5 mt-1">
              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                Possible Reasons:
              </span>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600 leading-normal">
                {reason_codes.includes('FOREIGN_TRANSACTION') || reason_codes.includes('SUSPICIOUS_GEOLOCATION') ? (
                  <li>Your bank flagged this transaction as originating from a foreign or unrecognized network location.</li>
                ) : null}
                {reason_codes.includes('HIGH_VELOCITY') ? (
                  <li>Too many payment attempts detected in a short time frame.</li>
                ) : null}
                {reason_codes.includes('FROZEN_CARD') ? (
                  <li>This card is currently frozen or locked by the cardholder.</li>
                ) : null}
                {reason_codes.includes('HIGH_FRAUD_SCORE') && !reason_codes.includes('FOREIGN_TRANSACTION') ? (
                  <li>Transaction parameters did not satisfy your card issuer's automated security verification.</li>
                ) : null}
                <li>Please try another payment card or verify with your bank.</li>
              </ul>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-3">
            <Button
              onClick={onReset}
              className={`w-full h-10 text-xs font-medium rounded-lg flex items-center justify-center gap-2 ${
                isApproved
                  ? 'bg-slate-900 hover:bg-slate-800 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {isApproved ? (
                <>
                  <ArrowLeft className="size-4" />
                  <span>Return to Store</span>
                </>
              ) : (
                <>
                  <RotateCcw className="size-4" />
                  <span>Try Again / Different Card</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Footer */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
        <ShieldCheck className="size-4 text-emerald-600" />
        <span>PCI-DSS Level 1 Encrypted Payment Confirmation</span>
      </div>
    </div>
  );
}
