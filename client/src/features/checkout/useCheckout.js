import { useCallback, useMemo, useRef, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { useCart } from '@/features/cart/useCart';
import { useStoreSettings } from '@/features/store/useStoreSettings';
import { queryClient, queryKeys } from '@/services/queryClient';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';
import { checkoutApi } from './api';
import { checkoutSignature, clearIdempotencyKey, getIdempotencyKey } from './idempotency';
import { payWithRazorpay, paymentResultPath } from './payment';

export const CHECKOUT_STEPS = [
  { id: 1, key: 'contact', title: 'Contact', long: 'Customer information' },
  { id: 2, key: 'address', title: 'Shipping', long: 'Shipping address' },
  { id: 3, key: 'review', title: 'Review', long: 'Order summary' },
  { id: 4, key: 'payment', title: 'Payment', long: 'Payment' },
];

export const STEP_FORM_ID = 'checkout-step-form';

export function usePaymentConfig() {
  return useQuery({ queryKey: ['payments', 'config'], queryFn: checkoutApi.paymentConfig, staleTime: 5 * 60_000 });
}

const refreshAfterOrder = () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.cart });
  queryClient.invalidateQueries({ queryKey: ['orders'] });
  queryClient.invalidateQueries({ queryKey: queryKeys.accountStats });
};

/**
 * Checkout state machine. Prices always come from the server quote; the client
 * only sends ids, contact details and the chosen payment method.
 */
export function useCheckout() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const cartState = useCart();
  const { cart } = cartState;
  const { settings } = useStoreSettings();
  const paymentConfig = usePaymentConfig();

  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  const [contact, setContact] = useState(() => ({ name: user?.name ?? '', email: user?.email ?? '', phone: user?.phone ?? '' }));
  const [addressId, setAddressId] = useState(null);
  const [addingAddress, setAddingAddress] = useState(false);
  const [chosenMethod, setChosenMethod] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | creating | paying | done
  const [placeError, setPlaceError] = useState(null);
  const lock = useRef(false);

  const razorpayEnabled = paymentConfig.data?.razorpayEnabled ?? settings.razorpayEnabled ?? false;
  const codEnabled = paymentConfig.data?.codEnabled ?? settings.codEnabled ?? false;
  const paymentMethod = chosenMethod ?? (razorpayEnabled || !codEnabled ? 'razorpay' : 'cod');

  const signature = useMemo(() => checkoutSignature(cart), [cart]);
  const hasItems = cart.items.length > 0;

  const quote = useQuery({
    queryKey: ['cart', 'quote', paymentMethod, signature],
    queryFn: () => checkoutApi.quote(paymentMethod),
    enabled: hasItems && !cartState.isGuest && phase === 'idle',
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const goTo = useCallback(
    (target) => {
      if (target <= maxStep && phase === 'idle') setStep(target);
    },
    [maxStep, phase],
  );

  const advance = useCallback((next) => {
    setStep(next);
    setMaxStep((m) => Math.max(m, next));
  }, []);

  const submitContact = (values) => {
    setContact(values);
    advance(2);
  };

  const confirmAddress = (id) => {
    setAddressId(id);
    setAddingAddress(false);
    advance(3);
  };

  const confirmReview = () => advance(4);

  const quoteSummary = quote.data?.summary ?? cart.summary;
  const blockers = [];
  if (cart.hasIssues || quote.data?.hasIssues) blockers.push('Some items in your bag need attention before you can pay.');
  if (paymentMethod === 'razorpay' && !razorpayEnabled) blockers.push('Online payments are currently unavailable.');
  if (paymentMethod === 'cod' && quote.data && !quote.data.codAvailable) {
    blockers.push(quote.data.codUnavailableReason || 'Cash on delivery is not available for this order.');
  }

  const placeOrder = async ({ customerNote } = {}) => {
    if (lock.current) return;
    if (!addressId) {
      setStep(2);
      return;
    }
    if (blockers.length) {
      setPlaceError(blockers[0]);
      return;
    }
    lock.current = true;
    setPlaceError(null);
    setPhase('creating');

    let orderId = null;
    try {
      const key = getIdempotencyKey(checkoutSignature(cart, { addressId, paymentMethod }));
      const { order, payment } = await checkoutApi.createOrder(key, {
        addressId,
        contact,
        paymentMethod,
        ...(customerNote?.trim() && { customerNote: customerNote.trim() }),
      });
      clearIdempotencyKey();
      orderId = order._id;

      if (order.paymentMethod === 'cod' || order.paymentStatus === 'paid') {
        setPhase('done');
        navigate(`/checkout/success?order=${encodeURIComponent(orderId)}`, { replace: true });
        refreshAfterOrder();
        return;
      }
      if (!payment) {
        // A previously created order that can no longer be paid (e.g. reservation expired).
        setPhase('done');
        navigate(paymentResultPath(orderId, { outcome: 'failed', reason: 'This order can no longer be paid.' }), { replace: true });
        refreshAfterOrder();
        return;
      }

      setPhase('paying');
      const result = await payWithRazorpay(payment, { storeName: settings.storeName });
      setPhase('done');
      navigate(paymentResultPath(orderId, result), { replace: true });
      refreshAfterOrder();
    } catch (error) {
      if (orderId) {
        // The order exists but the gateway could not be opened – continue on the failure page.
        setPhase('done');
        navigate(paymentResultPath(orderId, { outcome: 'failed', reason: error.message }), { replace: true });
        refreshAfterOrder();
        return;
      }
      lock.current = false;
      setPhase('idle');
      if (error.status === 409) {
        queryClient.invalidateQueries({ queryKey: queryKeys.cart });
        setPlaceError(error.message || 'Your bag changed. Please review it and try again.');
      } else if (error.status === 422 && error.errors?.some((e) => e.field?.includes('addressId'))) {
        setStep(2);
        setPlaceError('Please choose a valid delivery address.');
      } else {
        setPlaceError(error.message);
      }
      toast.error('We could not place your order', error.message);
    }
  };

  return {
    ...cartState,
    user,
    step,
    maxStep,
    goTo,
    contact,
    submitContact,
    addressId,
    setAddressId,
    addingAddress,
    setAddingAddress,
    confirmAddress,
    confirmReview,
    paymentMethod,
    setPaymentMethod: setChosenMethod,
    razorpayEnabled,
    codEnabled,
    paymentConfig,
    quote,
    quoteSummary,
    hasIssues: Boolean(cart.hasIssues || quote.data?.hasIssues),
    blockers,
    placeOrder,
    phase,
    isPlacing: phase !== 'idle',
    placeError,
    clearPlaceError: () => setPlaceError(null),
  };
}
