import { describe, expect, it } from 'vitest';
import { addressSchema, contactSchema, paymentSchema } from './checkout';

const validAddress = {
  fullName: 'Aarav Sharma',
  phone: '98765 43210',
  addressLine1: 'Flat 12B, Palm Residency, MG Road',
  addressLine2: 'Indiranagar',
  landmark: 'Near Metro Station',
  city: 'Bengaluru',
  state: 'Karnataka',
  postalCode: '560038',
  country: 'India',
  label: 'home',
  isDefault: true,
};

const errorFor = (result, field) => result.error?.issues.find((i) => i.path[0] === field)?.message;

describe('addressSchema', () => {
  it('accepts a valid Indian address and normalises the phone', () => {
    const result = addressSchema.safeParse(validAddress);
    expect(result.success).toBe(true);
    expect(result.data.phone).toBe('9876543210');
  });

  it('accepts +91 prefixed numbers and optional fields left empty', () => {
    const result = addressSchema.safeParse({ ...validAddress, phone: '+91-98765-43210', addressLine2: '', landmark: '' });
    expect(result.success).toBe(true);
    expect(result.data.phone).toBe('+919876543210');
  });

  it('defaults country and label', () => {
    const { country: _c, label: _l, ...rest } = validAddress;
    const result = addressSchema.safeParse(rest);
    expect(result.success).toBe(true);
    expect(result.data.country).toBe('India');
    expect(result.data.label).toBe('home');
  });

  it.each(['56003', '5600381', '060038', 'ABC123', '56 038'])('rejects the PIN code %s', (postalCode) => {
    const result = addressSchema.safeParse({ ...validAddress, postalCode });
    expect(result.success).toBe(false);
    expect(errorFor(result, 'postalCode')).toBe('Enter a valid 6-digit PIN code');
  });

  it.each(['12345', '1234567890', '98765432101', '+1 98765 43210', 'phone'])('rejects the phone number %s', (phone) => {
    const result = addressSchema.safeParse({ ...validAddress, phone });
    expect(result.success).toBe(false);
    expect(errorFor(result, 'phone')).toBe('Enter a valid 10-digit mobile number');
  });

  it('requires the core fields', () => {
    const result = addressSchema.safeParse({ ...validAddress, fullName: ' ', addressLine1: '', city: '', state: '' });
    expect(result.success).toBe(false);
    expect(errorFor(result, 'fullName')).toBe('Full name is required');
    expect(errorFor(result, 'addressLine1')).toBe('Address is required');
    expect(errorFor(result, 'city')).toBe('City is required');
    expect(errorFor(result, 'state')).toBe('Select a state');
  });

  it('rejects states outside the Indian list', () => {
    const result = addressSchema.safeParse({ ...validAddress, state: 'California' });
    expect(result.success).toBe(false);
    expect(errorFor(result, 'state')).toBe('Select a valid state');
  });
});

describe('contactSchema', () => {
  it('normalises email and phone', () => {
    const result = contactSchema.safeParse({ name: 'Aarav', email: ' Aarav@Example.COM ', phone: '+91 98765 43210' });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ name: 'Aarav', email: 'aarav@example.com', phone: '+919876543210' });
  });

  it('rejects an invalid email', () => {
    const result = contactSchema.safeParse({ name: 'Aarav', email: 'aarav@', phone: '9876543210' });
    expect(result.success).toBe(false);
    expect(errorFor(result, 'email')).toBe('Enter a valid email address');
  });
});

describe('paymentSchema', () => {
  it('only allows known payment methods', () => {
    expect(paymentSchema.safeParse({ paymentMethod: 'cod' }).success).toBe(true);
    expect(paymentSchema.safeParse({ paymentMethod: 'razorpay', customerNote: '' }).success).toBe(true);
    expect(paymentSchema.safeParse({ paymentMethod: 'paypal' }).success).toBe(false);
  });
});
