import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Lock,
  ShoppingBag,
  Laptop,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  Info,
  User
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import CustomerReceipt from './CustomerReceipt.jsx';
import { SimulatorService } from './SimulatorService.js';

export default function CheckoutPage() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(7);
  const [activeCustomer, setActiveCustomer] = useState(null);

  // Form Fields (Realistic E-Commerce Checkout)
  const [cardholderName, setCardholderName] = useState('Inshaf Rajaei');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 6969');
  const [expiry, setExpiry] = useState('08/29');
  const [cvv, setCvv] = useState('782');
  const [billingCountry, setBillingCountry] = useState('LK');
  const [streetAddress, setStreetAddress] = useState('42 Temple Road, Colombo');
  const [amount, setAmount] = useState('1299.00');
  const [isCardLocked, setIsCardLocked] = useState(false);

  // Background Live Network Info (silent detection without displaying badges)
  const [liveIp, setLiveIp] = useState('127.0.0.1');
  const [liveCountry, setLiveCountry] = useState('LK');

  // Execution states
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Silent live network check
  useEffect(() => {
    async function detectNetwork() {
      try {
        const res = await fetch('https://api.country.is', { cache: 'no-cache' });
        if (res.ok) {
          const data = await res.json();
          const detected = (data.country || 'LK').toUpperCase();
          setLiveIp(data.ip || '127.0.0.1');
          setLiveCountry(detected);
        }
      } catch (e) {
        // Silent fallback
      }
    }

    async function loadCustomers() {
      const data = await SimulatorService.getCustomers();
      if (data && data.length > 0) {
        setCustomers(data);
        // Default to Inshaf Rajaei (ID 7) if present, else first customer
        const defaultCust = data.find((c) => c.id === 7 || c.full_name?.toLowerCase().includes('inshaf')) || data[0];
        setSelectedCustomerId(defaultCust.id);
        setActiveCustomer(defaultCust);
        setCardholderName(defaultCust.full_name || 'Cardholder');
        setCardNumber(`4242 •••• •••• ${defaultCust.card_last_four || '4242'}`);
        setIsCardLocked(defaultCust.is_frozen || false);
      }
    }

    detectNetwork();
    loadCustomers();
  }, []);

  const handleSelectCustomer = (val) => {
    setSelectedCustomerId(val);
    if (val === 'custom') {
      setActiveCustomer(null);
      setCardholderName('Guest Cardholder');
      setCardNumber('4242 •••• •••• 4242');
      setIsCardLocked(false);
      return;
    }

    const cid = parseInt(val, 10);
    const found = customers.find((c) => c.id === cid);
    if (found) {
      setActiveCustomer(found);
      setCardholderName(found.full_name || 'Cardholder');
      setCardNumber(`4242 •••• •••• ${found.card_last_four || '4242'}`);
      setIsCardLocked(found.is_frozen || false);
    }
  };

  const handleToggleLock = async (checked) => {
    setIsCardLocked(checked);
    if (activeCustomer) {
      try {
        await SimulatorService.toggleFreezeCustomer(activeCustomer.id);
        setActiveCustomer((prev) => (prev ? { ...prev, is_frozen: checked } : null));
        setCustomers((prev) =>
          prev.map((c) => (c.id === activeCustomer.id ? { ...c, is_frozen: checked } : c))
        );
      } catch (err) {
        console.error('Failed to toggle freeze status:', err);
      }
    }
  };

  const handlePay = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      // If user toggled card lock, simulate frozen card in DB
      if (isCardLocked && activeCustomer && !activeCustomer.is_frozen) {
        await SimulatorService.toggleFreezeCustomer(activeCustomer.id);
      }

      // If user has a real VPN on or selected a foreign country from dropdown, pass that country
      const effectiveCountry = liveCountry !== 'LK' ? liveCountry : billingCountry;
      const effectiveIp = liveIp || '192.168.1.10';
      const custId = activeCustomer ? activeCustomer.id : (selectedCustomerId !== 'custom' ? parseInt(selectedCustomerId, 10) : 3);

      const payload = {
        metadata: {
          customer_id: custId,
          merchant: 'TechMart Online Store',
          merchant_category_code: '5732',
          merchant_country_code: effectiveCountry,
          amount: parseFloat(amount) || 1299.00,
          currency: 'USD',
          transaction_type: 'PURCHASE',
          pos_entry_mode: effectiveCountry !== 'LK' ? '81' : '05',
          terminal_id: 'WEB-PAY-01',
          moto_eci_indicator: '00',
          three_d_secure: effectiveCountry !== 'LK' ? 'N' : 'Y',
          ip_address: effectiveIp,
          device_fingerprint: effectiveCountry !== 'LK' ? 'foreign_browser_session' : 'web_desktop_chrome',
          shipping_address: streetAddress
        }
      };

      const scoreResult = await SimulatorService.scoreTransaction(payload);
      setResult(scoreResult);
    } catch (err) {
      setErrorMsg(err.message || 'Payment communication error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 font-sans antialiased selection:bg-slate-200">
      {/* 1. Clean Store Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold tracking-tight text-sm shadow-xs">
              TM
            </div>
            <div>
              <span className="font-semibold text-slate-900 text-sm tracking-tight">TechMart Store</span>
              <span className="hidden sm:inline-block text-[11px] text-slate-400 ml-2">Official Online Checkout</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 font-medium">
              <ShieldCheck className="size-3.5" />
              <span>256-Bit SSL Secure</span>
            </span>
          </div>
        </div>
      </header>

      {/* 2. Main Checkout Body */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {result ? (
          /* Receipt View after payment */
          <CustomerReceipt
            result={result}
            orderDetails={{
              orderId: `ORD-${result.transaction_id || '98214'}`,
              amount: amount,
              cardholderName: cardholderName || activeCustomer?.full_name || 'Cardholder',
              cardType: activeCustomer?.card_type || 'Visa',
              lastFour: activeCustomer?.card_last_four || cardNumber.replace(/\D/g, '').slice(-4) || '4242'
            }}
            onReset={handleReset}
          />
        ) : (
          /* Normal E-Commerce Checkout Form */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Order Summary */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Order Summary</h2>
                <p className="text-xs text-slate-500 mt-0.5">1 item in your cart</p>
              </div>

              {/* Product Card */}
              <div className="flex items-center gap-4 py-4 border-y border-slate-100">
                <div className="size-16 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                  <Laptop className="size-8 stroke-[1.5]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-semibold text-slate-900 truncate">
                    Apple MacBook Air 15" M3
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    16GB Unified Memory • 512GB SSD
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Space Gray • Qty: 1</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-900">
                    ${amount}
                  </span>
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="text-slate-900 font-medium">${amount}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Standard Shipping</span>
                  <span className="text-emerald-700 font-medium">FREE</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Estimated Tax</span>
                  <span className="text-slate-900 font-medium">$0.00</span>
                </div>
                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-sm font-semibold text-slate-900">Total Due</span>
                  <span className="text-lg font-bold text-slate-900 tabular-nums">
                    ${amount} USD
                  </span>
                </div>
              </div>

              {/* Editable Amount for manual testing */}
              <div className="pt-2 border-t border-slate-100">
                <label className="text-[11px] font-medium text-slate-500 block mb-1">
                  Adjust Amount (USD)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">$</span>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-8 text-xs bg-slate-50 border-slate-200 text-slate-900"
                    placeholder="1299.00"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Payment Details Form */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs">
              <div className="flex items-center justify-between pb-5 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Payment Information</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Pay securely using credit or debit card</p>
                </div>
                {/* Card Brand Badges */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    VISA
                  </span>
                  <span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                    MC
                  </span>
                  <span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                    AMEX
                  </span>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 my-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                  {errorMsg}
                </div>
              )}

              {/* Paying Customer Account Selector */}
              <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <User className="size-3.5 text-slate-600" />
                    <span>Paying Customer (Select Account)</span>
                  </label>
                  {activeCustomer && (
                    <span className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      Profile #{activeCustomer.id}
                    </span>
                  )}
                </div>

                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleSelectCustomer(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.email || 'customer@bank.com'}) — {c.card_type || 'Visa'} •••• {c.card_last_four || '4242'} {c.is_frozen ? ' [CARD FROZEN]' : ''}
                    </option>
                  ))}
                  <option value="custom">+ Manual / Guest Checkout</option>
                </select>

                {activeCustomer && (
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>
                      Saved Card:{' '}
                      <strong className="text-slate-700">
                        {activeCustomer.card_type || 'Visa'} •••• {activeCustomer.card_last_four || '4242'}
                      </strong>
                    </span>
                    {activeCustomer.is_frozen ? (
                      <span className="text-red-600 font-semibold flex items-center gap-1">
                        ● Card Locked / Frozen
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-medium flex items-center gap-1">
                        ● Card Active
                      </span>
                    )}
                  </div>
                )}
              </div>

              <form onSubmit={handlePay} className="mt-5 space-y-4">
                {/* Cardholder Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">Cardholder Name</label>
                  <Input
                    type="text"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    className="h-10 text-xs bg-white border-slate-200 text-slate-900"
                    placeholder="Name on card"
                    required
                  />
                </div>

                {/* Card Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">Card Number</label>
                  <div className="relative">
                    <Input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="h-10 text-xs font-mono bg-white border-slate-200 text-slate-900 pr-10"
                      placeholder="4242 •••• •••• 4242"
                      required
                    />
                    <CreditCard className="size-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                {/* Expiry and CVC */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">Expiration Date</label>
                    <Input
                      type="text"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      className="h-10 text-xs font-mono bg-white border-slate-200 text-slate-900"
                      placeholder="MM / YY"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">Security Code (CVC)</label>
                    <Input
                      type="text"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      className="h-10 text-xs font-mono bg-white border-slate-200 text-slate-900"
                      placeholder="CVC"
                      required
                    />
                  </div>
                </div>

                {/* Billing Country */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">
                    Billing Country / Region
                  </label>
                  <select
                    value={billingCountry}
                    onChange={(e) => setBillingCountry(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="LK">Sri Lanka (Home Country)</option>
                    <option value="US">United States (Foreign Location)</option>
                    <option value="GB">United Kingdom (Foreign Location)</option>
                    <option value="SG">Singapore (Foreign Location)</option>
                    <option value="AE">United Arab Emirates (Foreign Location)</option>
                    <option value="DE">Germany (Foreign Location)</option>
                    <option value="AU">Australia (Foreign Location)</option>
                  </select>
                </div>

                {/* Street Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">Billing Street Address</label>
                  <Input
                    type="text"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    className="h-10 text-xs bg-white border-slate-200 text-slate-900"
                    placeholder="Street Address, City"
                  />
                </div>

                {/* Optional realistic card lock toggle */}
                <div className="pt-2 flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="space-y-0.5">
                    <span className="font-medium text-slate-800">Simulate Cardholder Lock</span>
                    <p className="text-[11px] text-slate-500">Lock card via mobile banking app</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isCardLocked}
                    onChange={(e) => handleToggleLock(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                  />
                </div>

                {/* Submit Payment Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white mt-4 flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing Payment...</span>
                    </div>
                  ) : (
                    <>
                      <Lock className="size-3.5" />
                      <span>Pay ${amount} USD</span>
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <p className="text-[11px] text-slate-400">
                  Payments are processed with end-to-end encryption. Your card details are never stored unencrypted.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
