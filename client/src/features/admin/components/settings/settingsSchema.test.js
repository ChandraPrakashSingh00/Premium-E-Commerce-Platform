import { buildSettingsPatch, settingsFormSchema, toSettingsFormValues } from './settingsSchema';

const server = {
  _id: 'x',
  key: 'store',
  storeName: 'BlueMart',
  supportEmail: 'support@bluemart.store',
  supportPhone: '+91 98765 43210',
  address: 'Bengaluru',
  announcement: 'Free shipping',
  freeShippingThreshold: 999,
  shippingFee: 79,
  codEnabled: true,
  codFee: 0,
  codMaxOrderAmount: 50000,
  returnWindowDays: 7,
  reservationTtlMinutes: 30,
  defaultLowStockThreshold: 5,
  requireReviewModeration: true,
  social: { instagram: 'https://instagram.com', facebook: '' },
};

describe('settings schema', () => {
  it('accepts server values mapped to the form', () => {
    const values = toSettingsFormValues(server);
    expect(values.social).toEqual({ instagram: 'https://instagram.com', facebook: '', twitter: '', youtube: '' });
    expect(values).not.toHaveProperty('key');
    expect(settingsFormSchema.safeParse(values).success).toBe(true);
  });

  it('rejects out-of-range and non-numeric values', () => {
    const values = toSettingsFormValues(server);
    const bad = { ...values, returnWindowDays: 61, reservationTtlMinutes: 4, shippingFee: Number.NaN, social: { ...values.social, twitter: 'nope' } };
    const paths = settingsFormSchema.safeParse(bad).error.issues.map((i) => i.path.join('.'));
    expect(paths).toEqual(expect.arrayContaining(['returnWindowDays', 'reservationTtlMinutes', 'shippingFee', 'social.twitter']));
  });

  it('builds a patch from dirty fields only, sending social as a whole object', () => {
    const values = { ...toSettingsFormValues(server), shippingFee: 49, social: { instagram: '', facebook: '', twitter: '', youtube: '' } };
    expect(buildSettingsPatch(values, { shippingFee: true, social: { instagram: true } })).toEqual({
      shippingFee: 49,
      social: values.social,
    });
    expect(buildSettingsPatch(values, { social: { instagram: false } })).toEqual({});
    expect(buildSettingsPatch(values, {})).toEqual({});
  });
});
