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
  },
};