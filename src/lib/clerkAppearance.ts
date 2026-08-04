// src/lib/clerkAppearance.ts
// Themes every Clerk component to the Torvionyx brand.
// Hard-coded hex (not CSS vars) so it works regardless of light/dark.

export const clerkAppearance = {
  variables: {
    colorPrimary: "#DCAA33",
    colorText: "#FAF2E8",
    colorTextSecondary: "rgba(250,242,232,.62)",
    colorBackground: "rgba(27,49,87,.45)",
    colorInputBackground: "rgba(250,242,232,.05)",
    colorInputText: "#FAF2E8",
    colorDanger: "#F2635C",
    colorSuccess: "#5FD08A",
    borderRadius: "10px",
    fontFamily: "'Inter', system-ui, sans-serif",
    fontFamilyButtons: "'Space Grotesk', system-ui, sans-serif",
  },
  elements: {
    rootBox: { width: "100%" },
    card: { background: "transparent", boxShadow: "none", border: "none" },
    headerTitle: { fontFamily: "'Space Grotesk', system-ui, sans-serif", color: "#FAF2E8" },
    headerSubtitle: { color: "rgba(250,242,232,.62)" },
    socialButtonsBlockButton: {
      background: "rgba(250,242,232,.05)",
      border: "1.5px solid rgba(250,242,232,.14)",
      color: "#FAF2E8",
    },
    dividerLine: { background: "rgba(250,242,232,.12)" },
    dividerText: { color: "rgba(250,242,232,.38)" },
    formFieldLabel: { color: "rgba(250,242,232,.8)", fontWeight: 600 },
    formFieldInput: {
      background: "rgba(250,242,232,.05)",
      border: "1.5px solid rgba(250,242,232,.14)",
      color: "#FAF2E8",
      borderRadius: "10px",
    },
    formButtonPrimary: {
      background: "linear-gradient(135deg, #F2C84E, #DCAA33)",
      color: "#0A1322",
      fontFamily: "'Space Grotesk', system-ui, sans-serif",
      fontWeight: 600,
      textTransform: "none",
    },
    footerActionLink: { color: "#DCAA33" },

    // UserButton popover floats over arbitrary dashboard content, so — unlike
    // the sign-in/sign-up `card` above — it needs a fully opaque background
    // rather than inheriting the translucent colorBackground.
    userButtonPopoverCard: {
      background: "#0C1A2E",
      border: "1px solid rgba(250,242,232,.12)",
      boxShadow: "0 12px 32px -8px rgba(0,0,0,.55)",
    },
    userButtonPopoverMain: { background: "#0C1A2E" },
    userButtonPopoverActions: { background: "#0C1A2E" },
    userButtonPopoverActionButton: {
      color: "#FAF2E8",
      "&:hover": { background: "rgba(250,242,232,.06)" },
    },
    userButtonPopoverActionButtonText: { color: "#FAF2E8" },
    userButtonPopoverActionButtonIcon: { color: "rgba(250,242,232,.62)" },
    userButtonPopoverFooter: {
      background: "#0C1A2E",
      borderTop: "1px solid rgba(250,242,232,.07)",
    },
    userPreviewMainIdentifier: { color: "#FAF2E8" },
    userPreviewSecondaryIdentifier: { color: "rgba(250,242,232,.62)" },
  },
};