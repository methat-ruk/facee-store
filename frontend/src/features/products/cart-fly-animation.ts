'use client';

const CART_ANCHOR_SELECTOR = '[data-cart-anchor="storefront"]';
const CART_HIGHLIGHT_EVENT = 'facee:cart-highlight';

export function animateAddToCartFlight(sourceElement: HTMLElement | null) {
  if (
    !sourceElement ||
    typeof window === 'undefined' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    window.dispatchEvent(new Event(CART_HIGHLIGHT_EVENT));
    return;
  }

  const targetElement =
    document.querySelector<HTMLElement>(CART_ANCHOR_SELECTOR);
  const sourceIcon = sourceElement.querySelector('svg');

  if (!targetElement || !sourceIcon) {
    window.dispatchEvent(new Event(CART_HIGHLIGHT_EVENT));
    return;
  }

  const sourceRect = sourceElement.getBoundingClientRect();
  const targetRect = targetElement.getBoundingClientRect();
  const startX = sourceRect.left + sourceRect.width / 2;
  const startY = sourceRect.top + sourceRect.height / 2;
  const endX = targetRect.left + targetRect.width / 2;
  const endY = targetRect.top + targetRect.height / 2;
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  const travelCurveY = Math.min(-72, deltaY * 0.28 - 22);

  const flyer = document.createElement('div');
  flyer.setAttribute('aria-hidden', 'true');
  flyer.className =
    'pointer-events-none fixed top-0 left-0 z-[120] flex size-11 items-center justify-center rounded-full border border-white/30 bg-primary text-primary-foreground shadow-[0_18px_40px_rgba(88,51,38,0.32)]';
  flyer.style.transform = 'translate(-50%, -50%)';
  flyer.style.left = `${startX}px`;
  flyer.style.top = `${startY}px`;
  flyer.innerHTML = sourceIcon.outerHTML;

  const flyerIcon = flyer.querySelector('svg');
  if (flyerIcon) {
    flyerIcon.setAttribute('width', '18');
    flyerIcon.setAttribute('height', '18');
  }

  document.body.appendChild(flyer);

  const animation = flyer.animate(
    [
      {
        transform: 'translate(-50%, -50%) translate3d(0px, 0px, 0) scale(1)',
        opacity: 1,
      },
      {
        transform: `translate(-50%, -50%) translate3d(${deltaX * 0.72}px, ${deltaY * 0.58 + travelCurveY}px, 0) scale(0.92)`,
        opacity: 0.96,
        offset: 0.58,
      },
      {
        transform: `translate(-50%, -50%) translate3d(${deltaX}px, ${deltaY}px, 0) scale(0.68)`,
        opacity: 0.16,
      },
    ],
    {
      duration: 720,
      easing: 'cubic-bezier(0.22, 0.9, 0.25, 1)',
      fill: 'forwards',
    },
  );

  animation.addEventListener(
    'finish',
    () => {
      flyer.remove();
      window.dispatchEvent(new Event(CART_HIGHLIGHT_EVENT));
    },
    { once: true },
  );
}

export { CART_HIGHLIGHT_EVENT };
