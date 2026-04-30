# Changelog

All notable changes to this project should be documented in this file.

The format is inspired by Keep a Changelog, with lightweight sections that fit
an in-progress storefront project.

## Unreleased

### Added

- Product catalog storefront
- Localized product detail page
- Route-based i18n for `en` and `th`
- Theme toggle and shared storefront shell
- Customer auth flow with cookie-backed session restore
- Customer cart, checkout, order success, and order history flow
- Sandbox payment flow with QR payment and demo card confirmation
- Saved addresses and saved demo cards in the customer profile
- Predictive product search in the storefront topbar
- Flash sale product flag and compare-at pricing support
- Admin order review endpoints for cancellation and refund handling

### Changed

- Documentation updated to reflect the implemented storefront and current
  architecture
- Product cards, PDP pricing, and search suggestions now support compare-at
  pricing and flash sale presentation
- Backend guard placement was normalized so shared guards live under
  `src/common/guards`

### Planned

- Real payment gateway integration
- Full admin product and catalog management UI
- Broader deployment and operations polish
