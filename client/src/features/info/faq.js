/** Frequently asked questions, grouped by topic. */
export const FAQ_GROUPS = [
  {
    id: 'orders',
    title: 'Orders',
    items: [
      {
        q: 'How do I track my order?',
        a: 'Go to Account → Orders and open the order. Once it has shipped you will see the courier name, tracking number and a live tracking link. We also email and notify you at every step.',
      },
      {
        q: 'Can I change or cancel my order?',
        a: 'You can cancel an order from Account → Orders any time before it is packed. If you paid online, the refund is initiated automatically. Address changes are possible before dispatch — contact support with your order number.',
      },
      {
        q: 'Why was my order cancelled automatically?',
        a: 'Stock is reserved for 30 minutes while an online payment is pending. If the payment is not completed in that window the order is cancelled and the items are released. You can simply place the order again.',
      },
      {
        q: 'Do you offer gift wrapping?',
        a: 'Every order ships in our signature recyclable packaging. Add a note at checkout and we will include a handwritten card with your message and no invoice inside the box.',
      },
    ],
  },
  {
    id: 'shipping',
    title: 'Shipping',
    items: [
      {
        q: 'How much does shipping cost?',
        a: 'Shipping is free on orders above the free-shipping threshold shown in your bag. Below that, a flat shipping fee applies. The exact amount is always shown before you pay.',
      },
      {
        q: 'How long will delivery take?',
        a: 'Orders are dispatched within 24 hours on business days. Metro cities usually receive deliveries in 2–3 business days and the rest of India in 3–7 business days.',
      },
      {
        q: 'Do you deliver to my pin code?',
        a: 'We deliver to more than 19,000 pin codes across India through our courier partners. If a location is not serviceable, you will be informed at checkout.',
      },
      {
        q: 'Do you ship internationally?',
        a: 'Not yet. We currently deliver only within India, but international shipping is on our roadmap.',
      },
    ],
  },
  {
    id: 'returns',
    title: 'Returns & refunds',
    items: [
      {
        q: 'What is your return policy?',
        a: 'Most products can be returned within the return window (shown on each product page) from the date of delivery. Items must be unused, with original tags and packaging. Innerwear, cosmetics that have been opened and personalised products cannot be returned for hygiene reasons.',
      },
      {
        q: 'How do I request a return?',
        a: 'Open the delivered order in Account → Orders and choose “Request return”. Select a reason, and our team will review it and arrange a free pickup from your address.',
      },
      {
        q: 'When will I receive my refund?',
        a: 'Refunds are initiated once the returned item passes a quality check, usually within 48 hours of pickup. Online payments are refunded to the original method within 5–7 business days; COD orders are refunded to your bank account or UPI ID.',
      },
    ],
  },
  {
    id: 'payments',
    title: 'Payments',
    items: [
      {
        q: 'Which payment methods do you accept?',
        a: 'We accept UPI, credit and debit cards (Visa, Mastercard, RuPay), net banking and popular wallets through Razorpay. Cash on delivery is available on eligible orders.',
      },
      {
        q: 'Is it safe to pay on BlueMart?',
        a: 'Yes. Payments are processed by Razorpay, a PCI-DSS compliant gateway. We never see or store your card details, and every payment is verified on our servers.',
      },
      {
        q: 'My payment failed but money was deducted. What now?',
        a: 'Don’t worry — failed payments are automatically reversed by your bank, usually within 5–7 business days. You can also retry the payment from Account → Orders while the order is pending.',
      },
      {
        q: 'Is cash on delivery available?',
        a: 'COD is available for most pin codes on orders up to a maximum value. A small handling fee may apply and is shown at checkout.',
      },
    ],
  },
  {
    id: 'account',
    title: 'Account',
    items: [
      {
        q: 'Do I need an account to shop?',
        a: 'You can browse, build a bag and save a wishlist without an account. To check out, track orders and write reviews you will need to sign in — your bag and wishlist are merged automatically.',
      },
      {
        q: 'I forgot my password. How do I reset it?',
        a: 'Select “Forgot password” on the sign-in page and enter your email. We will send you a secure link that is valid for a limited time.',
      },
      {
        q: 'How do I manage email preferences?',
        a: 'Go to Account → Settings to choose which order updates and promotional emails you receive. You can also unsubscribe using the link in any marketing email.',
      },
    ],
  },
];
