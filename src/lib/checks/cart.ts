import type { Page } from 'puppeteer'
import type { CheckResult } from '@/types/audit'

export async function checkCart(page: Page): Promise<CheckResult[]> {
  return page.evaluate(() => {
    const results: { id: string; label: string; status: 'pass' | 'partial' | 'fail'; detail?: string; sfccValue?: string }[] = []
    const bodyText = document.body.innerText.toLowerCase()

    // Guest checkout
    const hasGuestCheckout =
      bodyText.includes('guest') ||
      bodyText.includes('continue as guest') ||
      bodyText.includes('checkout as guest')
    results.push({
      id: 'guest-checkout',
      label: 'Guest checkout available',
      status: hasGuestCheckout ? 'pass' : 'fail',
      sfccValue: hasGuestCheckout ? undefined : "34% of shoppers abandon checkout when forced to create an account. Commerce Cloud supports frictionless guest checkout with optional post-purchase account creation.",
    })

    // Promo / coupon code
    const hasCoupon =
      !!document.querySelector('[class*="coupon"], [class*="promo"], [class*="discount"], input[placeholder*="coupon" i], input[placeholder*="promo" i], input[name*="coupon" i]')
    results.push({
      id: 'coupon-code',
      label: 'Promo / coupon code field',
      status: hasCoupon ? 'pass' : 'fail',
      sfccValue: hasCoupon ? undefined : "Commerce Cloud's Promotions engine supports 50+ promotion types — coupons, tiered discounts, BOGO, and more — driving conversion from marketing campaigns.",
    })

    // Multiple payment methods
    const hasMultiPayment =
      bodyText.includes('paypal') ||
      bodyText.includes('afterpay') ||
      bodyText.includes('klarna') ||
      bodyText.includes('affirm') ||
      !!document.querySelector('[class*="payment-method"], img[alt*="PayPal"], img[alt*="Klarna"]')
    results.push({
      id: 'multi-payment',
      label: 'Multiple payment methods (card, PayPal, BNPL)',
      status: hasMultiPayment ? 'pass' : 'fail',
      sfccValue: hasMultiPayment ? undefined : "Commerce Cloud integrates with 40+ payment providers via LINK marketplace — offering BNPL, digital wallets, and local payment methods that can increase conversion by 12%.",
    })

    // Apple Pay / Google Pay
    const hasWallets =
      bodyText.includes('apple pay') ||
      bodyText.includes('google pay') ||
      !!document.querySelector('[class*="apple-pay"], [class*="googlepay"]')
    results.push({
      id: 'digital-wallets',
      label: 'Apple Pay / Google Pay',
      status: hasWallets ? 'pass' : 'fail',
      sfccValue: hasWallets ? undefined : "Digital wallet checkout reduces checkout time to under 30 seconds — Commerce Cloud's Checkout natively supports Apple Pay and Google Pay, increasing mobile conversion by 20%.",
    })

    // Order summary visible
    const hasOrderSummary =
      !!document.querySelector('[class*="order-summary"], [class*="cart-summary"], [class*="summary"]') ||
      bodyText.includes('order total') ||
      bodyText.includes('subtotal')
    results.push({
      id: 'order-summary',
      label: 'Order summary visible',
      status: hasOrderSummary ? 'pass' : 'partial',
    })

    // Address autocomplete
    const hasAddressAutocomplete =
      !!document.querySelector('[autocomplete="address-line1"], [autocomplete="shipping address-line1"], input[placeholder*="address" i]')
    results.push({
      id: 'address-autocomplete',
      label: 'Address autocomplete',
      status: hasAddressAutocomplete ? 'pass' : 'fail',
      sfccValue: hasAddressAutocomplete ? undefined : "Address validation and autocomplete in Commerce Cloud reduces checkout errors — incorrect addresses are the #1 cause of failed deliveries.",
    })

    return results
  })
}
