# Changelog

All notable changes to this project should be documented in this file.

The format is inspired by Keep a Changelog, with lightweight sections that fit
an in-progress storefront project.

## Unreleased

### Added

- Product catalog storefront
- Localized product detail page
- Route-based i18n for `en` and `th`
- Shared storefront shell and dedicated admin shell
- Customer auth flow with cookie-backed session restore
- Customer cart, checkout, order success, and order history flow
- Sandbox payment flow with QR payment and demo card confirmation
- Saved addresses and saved demo cards in the customer profile
- Predictive product search in the storefront topbar
- Flash sale product flag and compare-at pricing support
- Admin order review endpoints for cancellation and refund handling
- Admin portal overview and order review workspace at `/[locale]/admin`
- Admin customer directory with read-only customer detail views
- Admin QR payment confirmation flow
- Notification persistence, SSE stream, unread badges, and read-state actions

### Changed

- Documentation updated to reflect the implemented storefront and current
  architecture
- Product cards, PDP pricing, and search suggestions now support compare-at
  pricing and flash sale presentation
- Backend guard placement was normalized so shared guards live under
  `src/common/guards`
- Frontend and admin UI now run in a single dark theme
- Admin orders UI was simplified around review-focused statuses and
  notification-aware order rows
- Admin customer detail scope was corrected to read-only profile/address
  inspection without admin payment-method management

### Planned

- Real payment gateway integration
- Full admin product and catalog management UI
- Broader deployment and operations polish
