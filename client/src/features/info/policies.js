/**
 * Store policies. Each section: `{ id, title, paragraphs: string[], list?: string[] }`.
 * `{returnWindowDays}`, `{freeShippingThreshold}`, `{shippingFee}`, `{supportEmail}`, `{supportPhone}`, `{address}`
 * placeholders are filled from live store settings.
 */
export const POLICIES = {
  privacy: {
    title: 'Privacy policy',
    description: 'How BlueMart collects, uses and protects your personal data.',
    updated: '2026-04-01',
    intro:
      'Your privacy matters to us. This policy explains what personal data BlueMart (“we”, “us”) collects when you use our website, why we collect it, and the choices you have. It is published in accordance with the Information Technology Act, 2000, the rules made under it, and the Digital Personal Data Protection Act, 2023.',
    sections: [
      {
        id: 'information-we-collect',
        title: 'Information we collect',
        paragraphs: ['We collect only what we need to run the store and serve you well:'],
        list: [
          'Account details — your name, email address, phone number and password (stored as a secure hash).',
          'Order details — delivery addresses, items purchased, order history and communication preferences.',
          'Payment information — processed by our payment partner Razorpay. We never see or store your full card number, CVV or UPI PIN.',
          'Usage data — pages visited, device and browser type and approximate location, collected through essential cookies to keep the site secure and working.',
          'Content you share — product reviews, photos and messages you send to our support team.',
        ],
      },
      {
        id: 'how-we-use',
        title: 'How we use your information',
        paragraphs: ['We use your personal data to:'],
        list: [
          'Process, deliver and support your orders, returns and refunds.',
          'Create and secure your account, including detecting fraud and preventing abuse.',
          'Send transactional messages such as order confirmations and shipping updates.',
          'Send marketing emails, only if you have opted in. You can unsubscribe at any time.',
          'Improve our catalogue, website performance and customer experience.',
          'Comply with legal, tax and accounting obligations.',
        ],
      },
      {
        id: 'sharing',
        title: 'Sharing with third parties',
        paragraphs: [
          'We do not sell your personal data. We share it only with service providers who help us operate the store — payment gateways, courier partners, cloud hosting, email delivery and image hosting — and only to the extent they need it to perform their service. All partners are contractually bound to protect your data.',
          'We may disclose information where required by law, court order or a government authority, or to protect the rights and safety of our customers and business.',
        ],
      },
      {
        id: 'cookies',
        title: 'Cookies',
        paragraphs: [
          'We use essential cookies to keep you signed in securely (HTTP-only session cookies) and to remember your bag and preferences. We do not use third-party advertising cookies. You can clear cookies from your browser settings, though some features may stop working.',
        ],
      },
      {
        id: 'retention-security',
        title: 'Data retention and security',
        paragraphs: [
          'We keep your data for as long as your account is active and as required by law (for example, invoices are retained for eight years under Indian tax law). Data is encrypted in transit using TLS, passwords are hashed, and access to personal data is limited to authorised staff.',
        ],
      },
      {
        id: 'your-rights',
        title: 'Your rights',
        paragraphs: ['Subject to applicable law, you may:'],
        list: [
          'Access and update your personal information from your account.',
          'Withdraw consent for marketing communications at any time.',
          'Request correction or erasure of your personal data.',
          'Nominate another person to exercise your rights in case of death or incapacity.',
          'Raise a grievance with our Grievance Officer, and thereafter with the Data Protection Board of India.',
        ],
      },
      {
        id: 'grievance',
        title: 'Grievance officer',
        paragraphs: [
          'For any privacy questions or complaints, contact our Grievance Officer at {supportEmail} or write to us at {address}. We acknowledge complaints within 48 hours and aim to resolve them within 30 days.',
        ],
      },
    ],
  },

  terms: {
    title: 'Terms of service',
    description: 'The terms that govern your use of the BlueMart website and purchases.',
    updated: '2026-04-01',
    intro:
      'These terms govern your access to and use of the BlueMart website and any purchase you make from us. By using the site you agree to these terms. Please read them carefully together with our Privacy, Shipping and Refund policies.',
    sections: [
      {
        id: 'eligibility',
        title: 'Eligibility and accounts',
        paragraphs: [
          'You must be at least 18 years old, or use the site under the supervision of a parent or guardian, to place an order. You are responsible for keeping your account credentials confidential and for all activity under your account. Tell us immediately if you suspect unauthorised use.',
        ],
      },
      {
        id: 'products-pricing',
        title: 'Products and pricing',
        paragraphs: [
          'We make every effort to display products, colours and specifications accurately; minor variations may occur due to screen settings and natural material differences.',
          'All prices are listed in Indian Rupees. Applicable taxes, shipping fees and any cash-on-delivery charges are calculated by our systems and shown clearly before you pay. In case of an obvious pricing error, we may cancel the affected order and issue a full refund.',
        ],
      },
      {
        id: 'orders',
        title: 'Orders and acceptance',
        paragraphs: [
          'An order is confirmed once payment is successful (or, for cash on delivery, once we send an order confirmation). We reserve the right to decline or cancel orders in cases of suspected fraud, stock unavailability, or quantities that suggest resale. Stock for unpaid online orders is held for a limited time, after which the order may be cancelled automatically.',
        ],
      },
      {
        id: 'payments',
        title: 'Payments',
        paragraphs: [
          'Online payments are processed securely by Razorpay. By paying, you also agree to the terms of the payment provider and your bank. Cash on delivery is offered at our discretion, subject to order value limits and serviceability.',
        ],
      },
      {
        id: 'coupons',
        title: 'Offers and coupons',
        paragraphs: [
          'Coupons are subject to their stated conditions, including minimum order value, maximum discount, validity period and usage limits. Only one coupon can be applied per order. Coupons have no cash value and may be withdrawn if misused.',
        ],
      },
      {
        id: 'reviews',
        title: 'Reviews and user content',
        paragraphs: [
          'Only customers who have received a product may review it. Reviews must be honest and must not contain offensive, misleading or unlawful content. We may moderate or remove reviews that breach these guidelines. By submitting content, you grant us a non-exclusive licence to display it on our platforms.',
        ],
      },
      {
        id: 'liability',
        title: 'Limitation of liability',
        paragraphs: [
          'To the extent permitted by law, our liability for any claim relating to a product is limited to the amount you paid for that product. We are not liable for indirect or consequential losses. Nothing in these terms limits your rights under the Consumer Protection Act, 2019.',
        ],
      },
      {
        id: 'law',
        title: 'Governing law and disputes',
        paragraphs: [
          'These terms are governed by the laws of India. Disputes are subject to the exclusive jurisdiction of the courts at Bengaluru, Karnataka. For any concerns, please contact us first at {supportEmail} — most issues can be resolved quickly.',
        ],
      },
    ],
  },

  refund: {
    title: 'Returns & refund policy',
    description: 'How returns, exchanges and refunds work at BlueMart.',
    updated: '2026-04-01',
    intro:
      'We want you to love what you buy. If something isn’t right, you can return eligible items within {returnWindowDays} days of delivery for a full refund.',
    sections: [
      {
        id: 'eligibility',
        title: 'Return eligibility',
        paragraphs: ['To be eligible for a return, items must be:'],
        list: [
          'Requested within {returnWindowDays} days of the delivery date.',
          'Unused, unwashed and in their original condition.',
          'Returned with all original tags, labels, accessories, manuals and packaging.',
          'Accompanied by any free gifts that were part of the offer.',
        ],
      },
      {
        id: 'non-returnable',
        title: 'Non-returnable items',
        paragraphs: ['For hygiene and safety reasons, the following cannot be returned unless they arrive damaged or defective:'],
        list: [
          'Innerwear, swimwear and socks.',
          'Opened beauty, skincare and fragrance products.',
          'Personalised or custom-made products.',
          'Gift cards.',
        ],
      },
      {
        id: 'how-to-return',
        title: 'How to request a return',
        paragraphs: [
          'Sign in, open the order from Account → Orders and choose “Request return”. Tell us the reason and add any comments. Once approved, our courier partner will pick up the item from your delivery address — pickups are free of charge.',
        ],
      },
      {
        id: 'refunds',
        title: 'Refund timelines',
        paragraphs: [
          'Refunds are initiated within 48 hours of the returned item passing our quality check.',
        ],
        list: [
          'UPI, cards and net banking — credited to the original payment method within 5–7 business days.',
          'Cash on delivery — refunded to your bank account or UPI ID within 5–7 business days.',
          'Cancelled prepaid orders — refunded automatically as soon as the cancellation is processed.',
        ],
      },
      {
        id: 'damaged',
        title: 'Damaged, defective or incorrect items',
        paragraphs: [
          'If an item arrives damaged, defective or different from what you ordered, contact us within 48 hours of delivery at {supportEmail} with your order number and photos. We will arrange a free replacement or a full refund, including any shipping charges.',
        ],
      },
      {
        id: 'exchanges',
        title: 'Exchanges',
        paragraphs: [
          'For a different size or colour, return the original item and place a new order — this is the fastest way to make sure your preferred option is reserved for you.',
        ],
      },
    ],
  },

  shipping: {
    title: 'Shipping policy',
    description: 'Delivery timelines, charges and coverage for BlueMart orders.',
    updated: '2026-04-01',
    intro:
      'We ship across India with trusted courier partners. Here is everything you need to know about how and when your order will reach you.',
    sections: [
      {
        id: 'charges',
        title: 'Shipping charges',
        paragraphs: [
          'Shipping is free on orders above {freeShippingThreshold}. A flat fee of {shippingFee} applies to orders below that amount. The exact shipping charge is calculated by our system and shown in your bag and at checkout before you pay.',
        ],
      },
      {
        id: 'processing',
        title: 'Order processing',
        paragraphs: [
          'Orders placed before 2 PM IST on business days are usually dispatched the same day; all other orders are dispatched within 24 hours. Orders are not dispatched on Sundays and national holidays.',
        ],
      },
      {
        id: 'timelines',
        title: 'Delivery timelines',
        paragraphs: ['Estimated delivery times after dispatch:'],
        list: [
          'Metro cities (Delhi NCR, Mumbai, Bengaluru, Chennai, Hyderabad, Kolkata, Pune) — 2–3 business days.',
          'Other cities and towns — 3–5 business days.',
          'Remote areas, North-East India and Jammu & Kashmir — 5–9 business days.',
        ],
      },
      {
        id: 'tracking',
        title: 'Order tracking',
        paragraphs: [
          'As soon as your order ships, you will receive an email with the courier name and tracking number. You can also follow every update from Account → Orders.',
        ],
      },
      {
        id: 'cod',
        title: 'Cash on delivery',
        paragraphs: [
          'Cash on delivery is available on eligible orders and pin codes, up to a maximum order value. A small handling fee may apply and is always shown at checkout. Please keep the exact amount ready — our delivery partners may not carry change.',
        ],
      },
      {
        id: 'failed-delivery',
        title: 'Failed or delayed deliveries',
        paragraphs: [
          'Our courier partner will attempt delivery up to three times. If the order cannot be delivered, it is returned to us and any prepaid amount is refunded in full. Delays caused by weather, strikes or other events beyond our control are rare, and we will keep you informed.',
          'Questions about a shipment? Write to {supportEmail} or call {supportPhone}.',
        ],
      },
    ],
  },
};
