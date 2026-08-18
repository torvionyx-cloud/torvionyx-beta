/* @ds-bundle: {"format":4,"namespace":"TorvionyxDesignSystem_229294","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Logo","sourcePath":"components/core/Logo.jsx"},{"name":"StatCard","sourcePath":"components/core/StatCard.jsx"},{"name":"Avatar","sourcePath":"components/feedback/Avatar.jsx"},{"name":"ProgressBar","sourcePath":"components/feedback/ProgressBar.jsx"},{"name":"ColorSwatch","sourcePath":"components/forms/ColorSwatch.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Textarea","sourcePath":"components/forms/Textarea.jsx"},{"name":"Toggle","sourcePath":"components/forms/Toggle.jsx"},{"name":"NavLink","sourcePath":"components/navigation/NavLink.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"c3e3a930e0bd","components/core/Button.jsx":"ab474011a5c4","components/core/Card.jsx":"7269bc2b0196","components/core/Logo.jsx":"953732251c37","components/core/StatCard.jsx":"c2b54628a48e","components/feedback/Avatar.jsx":"58364795f19d","components/feedback/ProgressBar.jsx":"ffabef6c49cf","components/forms/ColorSwatch.jsx":"399068feadea","components/forms/Input.jsx":"d16c8d2984cd","components/forms/Textarea.jsx":"57b8eace1121","components/forms/Toggle.jsx":"75ac78b0d8d1","components/navigation/NavLink.jsx":"5fc8dfe70151","ui_kits/torvionyx-app/AnalyticsScreen.jsx":"7b52de6773fb","ui_kits/torvionyx-app/BrandScreen.jsx":"1fd42c0f71dc","ui_kits/torvionyx-app/DashboardHome.jsx":"a5d44222e4dc","ui_kits/torvionyx-app/NewProposalScreen.jsx":"ddb519179a43","ui_kits/torvionyx-app/Sidebar.jsx":"3c5bcfb4ff9d","ui_kits/torvionyx-app/Topbar.jsx":"de0a1281b6ce","ui_kits/torvionyx-app/data.js":"e6c595bef863"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.TorvionyxDesignSystem_229294 = window.TorvionyxDesignSystem_229294 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Badge.jsx
try { (() => {
const STATUS = {
  draft: {
    label: 'Draft',
    bg: 'rgba(19,37,67,.08)',
    color: 'var(--text-faint)'
  },
  shared: {
    label: 'Sent',
    bg: 'rgba(61,185,201,.14)',
    color: 'var(--info)'
  },
  viewed: {
    label: 'Viewed',
    bg: 'rgba(242,169,59,.14)',
    color: 'var(--warning)'
  },
  accepted: {
    label: 'Accepted',
    bg: 'rgba(95,208,138,.16)',
    color: 'var(--success)'
  },
  declined: {
    label: 'Declined',
    bg: 'rgba(242,99,92,.14)',
    color: 'var(--error)'
  },
  expired: {
    label: 'Expired',
    bg: 'rgba(19,37,67,.06)',
    color: 'var(--text-faint)'
  }
};
function Badge({
  status = 'draft'
}) {
  const s = STATUS[status] || STATUS.draft;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      background: s.bg,
      color: s.color,
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '.08em',
      textTransform: 'uppercase',
      padding: '3px 9px',
      borderRadius: 'var(--radius-pill)',
      whiteSpace: 'nowrap',
      display: 'inline-block'
    }
  }, s.label);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  sm: {
    padding: '8px 16px',
    fontSize: 13
  },
  md: {
    padding: '10px 22px',
    fontSize: 13.5
  },
  lg: {
    padding: '14px 22px',
    fontSize: 15.5
  }
};
function Button({
  variant = 'primary',
  size = 'md',
  disabled,
  children,
  style,
  ...props
}) {
  const s = SIZES[size] || SIZES.md;
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 'var(--radius-md)',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    letterSpacing: '-.01em',
    transition: 'transform .18s, box-shadow .18s, opacity .18s',
    opacity: disabled ? 0.5 : 1,
    ...s
  };
  const variants = {
    primary: {
      background: 'linear-gradient(135deg,var(--gold-bright),var(--gold))',
      color: 'var(--navy-900)',
      boxShadow: '0 14px 30px -12px rgba(220,170,51,.7)'
    },
    secondary: {
      background: 'var(--surface-panel-accent)',
      color: 'var(--text)',
      border: '1.5px solid var(--border)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--gold)',
      padding: 0,
      fontWeight: 500
    }
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    disabled: disabled,
    style: {
      ...base,
      ...variants[variant],
      ...style
    },
    onMouseEnter: e => {
      if (!disabled && variant === 'primary') e.currentTarget.style.transform = 'translateY(-2px)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.transform = 'none';
    }
  }, props), children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Card({
  children,
  style,
  padding = '18px 20px',
  ...props
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: 'var(--surface-panel)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-panel)',
      padding,
      transition: 'background .3s, border-color .3s',
      ...style
    }
  }, props), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Logo.jsx
try { (() => {
function Logo({
  size = 22,
  wordmark = true,
  dark = false
}) {
  const h = Math.round(size * 1.55);
  const diamond = dark ? '#0C1A2E' : 'var(--cream)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 11
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: h,
    viewBox: "0 0 100 157",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M50 0 L100 48.4 L50 156.5 L0 48.4 Z",
    fill: diamond
  }), /*#__PURE__*/React.createElement("path", {
    d: "M79.7 37.7 L19.9 37.9 L19.9 52 L41.5 52.2 L35 96.5 L46.4 93.5 L45.1 135.3 L66.1 75.9 L54.5 78.1 L59.6 52.7 L79.7 52 Z",
    fill: "var(--gold)",
    stroke: "var(--navy-700)",
    strokeWidth: "3",
    paintOrder: "stroke"
  })), wordmark && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: size === 22 ? 18 : size,
      letterSpacing: '-.02em',
      color: dark ? 'var(--text)' : 'var(--cream)'
    }
  }, "torvionyx"));
}
Object.assign(__ds_scope, { Logo });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Logo.jsx", error: String((e && e.message) || e) }); }

// components/core/StatCard.jsx
try { (() => {
function StatCard({
  label,
  value,
  delta,
  up
}) {
  return /*#__PURE__*/React.createElement(__ds_scope.Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      letterSpacing: '.16em',
      textTransform: 'uppercase',
      color: 'var(--text-faint)',
      marginBottom: 8
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 28,
      letterSpacing: '-.02em',
      color: 'var(--text)',
      marginBottom: 6
    }
  }, value), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11.5,
      color: up ? 'var(--success)' : 'var(--text-faint)'
    }
  }, up ? '↑ ' : '', delta));
}
Object.assign(__ds_scope, { StatCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/StatCard.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Avatar.jsx
try { (() => {
function Avatar({
  initial,
  size = 32
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: size,
      height: size,
      borderRadius: '50%',
      flexShrink: 0,
      background: 'linear-gradient(135deg,var(--gold),var(--gold-bright))',
      display: 'grid',
      placeItems: 'center',
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: size * 0.44,
      color: 'var(--navy-900)'
    }
  }, initial);
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/feedback/ProgressBar.jsx
try { (() => {
function ProgressBar({
  value,
  color = 'var(--gold)',
  track
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 8,
      background: track || 'rgba(140,140,140,.16)',
      borderRadius: 'var(--radius-pill)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      borderRadius: 'var(--radius-pill)',
      background: color,
      width: `${Math.max(0, Math.min(100, value))}%`,
      transition: 'width 1.2s'
    }
  }));
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/forms/ColorSwatch.jsx
try { (() => {
function ColorSwatch({
  color,
  active,
  onClick,
  size = 34
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    style: {
      width: size,
      height: size,
      borderRadius: 10,
      background: color,
      border: 'none',
      outline: active ? '2.5px solid var(--text)' : '2.5px solid transparent',
      cursor: 'pointer',
      transition: 'transform .2s, outline .15s',
      transform: active ? 'translateY(-2px)' : 'none'
    }
  });
}
Object.assign(__ds_scope, { ColorSwatch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/ColorSwatch.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Input({
  style,
  ...props
}) {
  return /*#__PURE__*/React.createElement("input", _extends({
    style: {
      width: '100%',
      padding: '11px 14px',
      fontFamily: 'var(--font-body)',
      fontSize: 14,
      borderRadius: 'var(--radius-md)',
      border: '1.5px solid var(--border)',
      background: 'var(--surface-panel-accent)',
      color: 'var(--text)',
      outline: 'none',
      transition: 'border-color .2s, box-shadow .2s',
      ...style
    },
    onFocus: e => {
      e.target.style.borderColor = 'var(--gold)';
      e.target.style.boxShadow = '0 0 0 4px rgba(220,170,51,.14)';
    },
    onBlur: e => {
      e.target.style.borderColor = 'var(--border)';
      e.target.style.boxShadow = 'none';
    }
  }, props));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Textarea.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Textarea({
  style,
  ...props
}) {
  return /*#__PURE__*/React.createElement("textarea", _extends({
    style: {
      width: '100%',
      padding: '11px 14px',
      fontFamily: 'var(--font-body)',
      fontSize: 14,
      lineHeight: 1.55,
      borderRadius: 'var(--radius-md)',
      border: '1.5px solid var(--border)',
      background: 'var(--surface-panel-accent)',
      color: 'var(--text)',
      outline: 'none',
      resize: 'vertical',
      transition: 'border-color .2s, box-shadow .2s',
      ...style
    },
    onFocus: e => {
      e.target.style.borderColor = 'var(--gold)';
      e.target.style.boxShadow = '0 0 0 4px rgba(220,170,51,.14)';
    },
    onBlur: e => {
      e.target.style.borderColor = 'var(--border)';
      e.target.style.boxShadow = 'none';
    }
  }, props));
}
Object.assign(__ds_scope, { Textarea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Textarea.jsx", error: String((e && e.message) || e) }); }

// components/forms/Toggle.jsx
try { (() => {
function Toggle({
  checked,
  onChange
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => onChange && onChange(!checked),
    style: {
      width: 40,
      height: 22,
      borderRadius: 20,
      border: 'none',
      cursor: 'pointer',
      flexShrink: 0,
      background: checked ? 'var(--gold)' : 'rgba(140,140,140,.3)',
      position: 'relative',
      transition: 'background .25s'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 3,
      width: 16,
      height: 16,
      borderRadius: '50%',
      background: '#fff',
      transition: 'transform .25s',
      transform: checked ? 'translateX(21px)' : 'translateX(3px)'
    }
  }));
}
Object.assign(__ds_scope, { Toggle });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Toggle.jsx", error: String((e && e.message) || e) }); }

// components/navigation/NavLink.jsx
try { (() => {
function NavLink({
  icon,
  active,
  children,
  href = '#'
}) {
  return /*#__PURE__*/React.createElement("a", {
    href: href,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 11,
      padding: '10px 12px',
      borderRadius: 10,
      fontFamily: 'var(--font-body)',
      fontSize: 13.5,
      fontWeight: 500,
      textDecoration: 'none',
      transition: 'background .18s, color .18s',
      position: 'relative',
      color: active ? 'var(--gold)' : 'var(--sidebar-text)',
      background: active ? 'rgba(220,170,51,.13)' : 'transparent'
    },
    onMouseEnter: e => {
      if (!active) {
        e.currentTarget.style.background = 'var(--sidebar-hover)';
        e.currentTarget.style.color = 'var(--cream)';
      }
    },
    onMouseLeave: e => {
      if (!active) {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = 'var(--sidebar-text)';
      }
    }
  }, active && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: -12,
      top: '50%',
      transform: 'translateY(-50%)',
      width: 3,
      height: 22,
      background: 'var(--gold)',
      borderRadius: '0 3px 3px 0'
    }
  }), icon && /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0,
      opacity: active ? 1 : 0.6,
      display: 'flex'
    }
  }, icon), children);
}
Object.assign(__ds_scope, { NavLink });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/NavLink.jsx", error: String((e && e.message) || e) }); }

// ui_kits/torvionyx-app/AnalyticsScreen.jsx
try { (() => {
const {
  Card,
  ProgressBar
} = window.TorvionyxDesignSystem_229294;
function AnalyticsScreen() {
  const funnel = [{
    label: 'Created',
    count: 5,
    pct: 100,
    color: 'var(--text-faint)'
  }, {
    label: 'Sent',
    count: 4,
    pct: 80,
    color: 'var(--info)'
  }, {
    label: 'Viewed',
    count: 2,
    pct: 40,
    color: 'var(--warning)'
  }, {
    label: 'Accepted',
    count: 1,
    pct: 20,
    color: 'var(--success)'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 22
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 22,
      color: 'var(--text)',
      margin: 0
    }
  }, "Analytics"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: 'var(--text-faint)',
      marginTop: 3
    }
  }, "Proposal performance and revenue trends")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 16
    }
  }, [['Total revenue', '£4,800'], ['Proposals sent', '4'], ['Accept rate', '25%'], ['Avg deal value', '£4,800']].map(([l, v]) => /*#__PURE__*/React.createElement(Card, {
    key: l
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      letterSpacing: '.16em',
      textTransform: 'uppercase',
      color: 'var(--text-faint)',
      marginBottom: 8
    }
  }, l), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 28,
      color: 'var(--text)'
    }
  }, v)))), /*#__PURE__*/React.createElement(Card, {
    padding: "0"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 22px 14px',
      borderBottom: '1px solid var(--border-soft)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 14.5,
      color: 'var(--text)'
    }
  }, "Proposal funnel")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 22,
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, funnel.map(f => /*#__PURE__*/React.createElement("div", {
    key: f.label
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: 5,
      fontSize: 13,
      color: 'var(--text)'
    }
  }, /*#__PURE__*/React.createElement("span", null, f.label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11.5,
      color: 'var(--text-faint)'
    }
  }, f.count, " (", f.pct, "%)")), /*#__PURE__*/React.createElement(ProgressBar, {
    value: f.pct,
    color: f.color
  }))))));
}
window.AnalyticsScreen = AnalyticsScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/torvionyx-app/AnalyticsScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/torvionyx-app/BrandScreen.jsx
try { (() => {
const {
  Card,
  Input,
  Textarea,
  Toggle,
  ColorSwatch,
  Button
} = window.TorvionyxDesignSystem_229294;
function BrandScreen() {
  const [accent, setAccent] = React.useState('#DCAA33');
  const [prefs, setPrefs] = React.useState({
    powered: true,
    acceptBtn: true,
    lineItems: true
  });
  const swatches = ['#DCAA33', '#3DB9C9', '#7C6BE8', '#52C285', '#E8635C'];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 340px',
      gap: 24,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 26
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 15.5,
      color: 'var(--text)',
      margin: '0 0 14px'
    }
  }, "Accent colour"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 9
    }
  }, swatches.map(c => /*#__PURE__*/React.createElement(ColorSwatch, {
    key: c,
    color: c,
    active: c === accent,
    onClick: () => setAccent(c)
  })))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 15.5,
      color: 'var(--text)',
      margin: '0 0 6px'
    }
  }, "Business details"), /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'block',
      fontSize: 12.5,
      fontWeight: 600,
      marginBottom: 7,
      color: 'var(--text-dim)'
    }
  }, "Business name"), /*#__PURE__*/React.createElement(Input, {
    defaultValue: "Studio Kayla"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 15.5,
      color: 'var(--text)',
      margin: '0 0 6px'
    }
  }, "Voice & context"), /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'block',
      fontSize: 12.5,
      fontWeight: 600,
      marginBottom: 7,
      color: 'var(--text-dim)'
    }
  }, "About your business"), /*#__PURE__*/React.createElement(Textarea, {
    rows: 4,
    defaultValue: "We're a small brand studio working with founder-led consumer brands."
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 15.5,
      color: 'var(--text)',
      margin: '0 0 6px'
    }
  }, "Proposal preferences"), [['powered', 'Show "Powered by Torvionyx"'], ['acceptBtn', 'Include accept button'], ['lineItems', 'Show line item breakdown']].map(([k, l]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 0',
      borderBottom: '1px solid var(--border-soft)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13.5,
      color: 'var(--text)'
    }
  }, l), /*#__PURE__*/React.createElement(Toggle, {
    checked: prefs[k],
    onChange: v => setPrefs(p => ({
      ...p,
      [k]: v
    }))
  })))), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    style: {
      alignSelf: 'flex-start'
    }
  }, "Save changes")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'sticky',
      top: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 10.5,
      letterSpacing: '.2em',
      textTransform: 'uppercase',
      color: 'var(--text-faint)',
      marginBottom: 14
    }
  }, "Live preview"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#fff',
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 24px 50px -20px rgba(0,0,0,.4)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 20px',
      background: accent,
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 13.5
    }
  }, "Studio Kayla"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      opacity: .8,
      marginTop: 2
    }
  }, "Creative services")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 20px',
      color: '#1a1a2e'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 17,
      marginBottom: 12
    }
  }, "Brand Strategy Package"), prefs.lineItems && ['Discovery — £1,200', 'Brand identity — £2,400'].map(l => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      fontSize: 12.5,
      padding: '8px 10px',
      background: '#f7f7fa',
      borderRadius: 8,
      marginBottom: 6
    }
  }, l)), prefs.powered && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      textAlign: 'center',
      fontSize: 11,
      color: '#bbb'
    }
  }, "Sent via ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: accent,
      fontWeight: 600
    }
  }, "torvionyx"))))));
}
window.BrandScreen = BrandScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/torvionyx-app/BrandScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/torvionyx-app/DashboardHome.jsx
try { (() => {
const {
  Card,
  StatCard,
  Badge,
  Button
} = window.TorvionyxDesignSystem_229294;
function DashboardHome() {
  const proposals = window.PROPOSALS;
  const activity = [{
    text: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("strong", null, "Northwind Studio"), " accepted your proposal"),
    time: '2h ago',
    color: 'var(--success)'
  }, {
    text: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("strong", null, "Halcyon & Co."), " viewed your proposal"),
    time: '1d ago',
    color: 'var(--info)'
  }, {
    text: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("strong", null, "Mira Bright"), " was sent a proposal"),
    time: '3d ago',
    color: 'var(--info)'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Revenue this month",
    value: "\xA34,800",
    delta: "From 1 accepted this month",
    up: true
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Proposals sent",
    value: 4,
    delta: "4 total sent",
    up: true
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Accept rate",
    value: "25%",
    delta: "1 accepted",
    up: true
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Avg time to accept",
    value: "18h",
    delta: "Based on 1 accepted"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.5fr 1fr',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(Card, {
    padding: "0"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '18px 20px 14px',
      borderBottom: '1px solid var(--border-soft)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 15,
      color: 'var(--text)'
    }
  }, "Recent proposals"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: 'var(--gold)',
      fontWeight: 500,
      cursor: 'pointer'
    }
  }, "View all")), proposals.map((p, i) => /*#__PURE__*/React.createElement("div", {
    key: p.id,
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      alignItems: 'center',
      gap: 12,
      padding: '13px 20px',
      borderBottom: i < proposals.length - 1 ? '1px solid var(--border-soft)' : 'none',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      fontSize: 14,
      color: 'var(--text)'
    }
  }, p.client), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--text-faint)',
      marginTop: 2
    }
  }, p.type, " \xB7 ", p.created)), /*#__PURE__*/React.createElement(Badge, {
    status: p.status
  })))), /*#__PURE__*/React.createElement(Card, {
    padding: "0"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 20px 14px',
      borderBottom: '1px solid var(--border-soft)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 15,
      color: 'var(--text)'
    }
  }, "Activity")), activity.map((a, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      gap: 12,
      padding: '13px 20px',
      borderBottom: i < activity.length - 1 ? '1px solid var(--border-soft)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: a.color,
      marginTop: 6,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-dim)',
      lineHeight: 1.4
    }
  }, a.text), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      color: 'var(--text-faint)',
      marginTop: 2
    }
  }, a.time)))))));
}
window.DashboardHome = DashboardHome;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/torvionyx-app/DashboardHome.jsx", error: String((e && e.message) || e) }); }

// ui_kits/torvionyx-app/NewProposalScreen.jsx
try { (() => {
const {
  Input,
  Textarea,
  Button
} = window.TorvionyxDesignSystem_229294;
function NewProposalScreen({
  onBack
}) {
  const [brief, setBrief] = React.useState('');
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 640,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    style: {
      background: 'none',
      border: 'none',
      color: 'var(--text-faint)',
      fontSize: 13,
      cursor: 'pointer',
      padding: 0,
      marginBottom: 16
    }
  }, "\u2190 Back to proposals"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 22,
      color: 'var(--text)',
      margin: '0 0 6px'
    }
  }, "New proposal"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13.5,
      color: 'var(--text-faint)',
      marginBottom: 22
    }
  }, "Describe your project and Torvionyx writes a polished proposal in under a minute."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'block',
      fontSize: 12.5,
      fontWeight: 600,
      marginBottom: 7,
      color: 'var(--text-dim)'
    }
  }, "Client / company name"), /*#__PURE__*/React.createElement(Input, {
    placeholder: "e.g. Acme Corporation"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'block',
      fontSize: 12.5,
      fontWeight: 600,
      marginBottom: 7,
      color: 'var(--text-dim)'
    }
  }, "Your brief"), /*#__PURE__*/React.createElement(Textarea, {
    rows: 7,
    value: brief,
    onChange: e => setBrief(e.target.value),
    placeholder: "Paste your call notes, the scope, the client's goals \u2014 anything rough."
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    style: {
      alignSelf: 'flex-start'
    }
  }, "Generate with Torvionyx \u2192")));
}
window.NewProposalScreen = NewProposalScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/torvionyx-app/NewProposalScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/torvionyx-app/Sidebar.jsx
try { (() => {
const {
  NavLink,
  Logo,
  Avatar
} = window.TorvionyxDesignSystem_229294;
function ProposalsIcon() {
  return /*#__PURE__*/React.createElement("svg", {
    width: "17",
    height: "17",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "14 2 14 8 20 8"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "16",
    y1: "13",
    x2: "8",
    y2: "13"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "16",
    y1: "17",
    x2: "8",
    y2: "17"
  }));
}
function AnalyticsIcon() {
  return /*#__PURE__*/React.createElement("svg", {
    width: "17",
    height: "17",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("line", {
    x1: "18",
    y1: "20",
    x2: "18",
    y2: "10"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "20",
    x2: "12",
    y2: "4"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "6",
    y1: "20",
    x2: "6",
    y2: "14"
  }));
}
function BrandIcon() {
  return /*#__PURE__*/React.createElement("svg", {
    width: "17",
    height: "17",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"
  }));
}
function Sidebar({
  screen,
  setScreen
}) {
  return /*#__PURE__*/React.createElement("aside", {
    style: {
      width: 220,
      flexShrink: 0,
      background: 'var(--surface-sidebar)',
      borderRight: '1px solid var(--sidebar-border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '22px 20px',
      borderBottom: '1px solid var(--sidebar-border)'
    }
  }, /*#__PURE__*/React.createElement(Logo, {
    size: 22
  })), /*#__PURE__*/React.createElement("nav", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      padding: '20px 12px'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      padding: '0 12px',
      marginBottom: 6,
      fontSize: 9.5,
      letterSpacing: '.18em',
      textTransform: 'uppercase',
      color: 'var(--sidebar-text-faint)',
      fontFamily: 'var(--font-mono)'
    }
  }, "Workspace"), /*#__PURE__*/React.createElement("div", {
    onClick: () => setScreen('home')
  }, /*#__PURE__*/React.createElement(NavLink, {
    icon: /*#__PURE__*/React.createElement(ProposalsIcon, null),
    active: screen === 'home'
  }, "Proposals")), /*#__PURE__*/React.createElement("div", {
    onClick: () => setScreen('analytics')
  }, /*#__PURE__*/React.createElement(NavLink, {
    icon: /*#__PURE__*/React.createElement(AnalyticsIcon, null),
    active: screen === 'analytics'
  }, "Analytics")), /*#__PURE__*/React.createElement("p", {
    style: {
      padding: '0 12px',
      margin: '16px 0 6px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9.5,
      letterSpacing: '.18em',
      textTransform: 'uppercase',
      color: 'var(--sidebar-text-faint)',
      fontFamily: 'var(--font-mono)'
    }
  }, "Settings")), /*#__PURE__*/React.createElement("div", {
    onClick: () => setScreen('brand')
  }, /*#__PURE__*/React.createElement(NavLink, {
    icon: /*#__PURE__*/React.createElement(BrandIcon, null),
    active: screen === 'brand'
  }, "Branding"))), /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '0 12px 20px',
      padding: 12,
      borderRadius: 12,
      background: 'var(--sidebar-hover)',
      border: '1px solid var(--sidebar-border)',
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    initial: "K"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      color: 'var(--cream)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, "Kayla Reyes"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--sidebar-text-faint)'
    }
  }, "kayla@studio.com"))));
}
window.Sidebar = Sidebar;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/torvionyx-app/Sidebar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/torvionyx-app/Topbar.jsx
try { (() => {
const {
  Button
} = window.TorvionyxDesignSystem_229294;
function SunIcon() {
  return /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "5"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "1",
    x2: "12",
    y2: "3"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "21",
    x2: "12",
    y2: "23"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "4.22",
    y1: "4.22",
    x2: "5.64",
    y2: "5.64"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "18.36",
    y1: "18.36",
    x2: "19.78",
    y2: "19.78"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "1",
    y1: "12",
    x2: "3",
    y2: "12"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "21",
    y1: "12",
    x2: "23",
    y2: "12"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "4.22",
    y1: "19.78",
    x2: "5.64",
    y2: "18.36"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "18.36",
    y1: "5.64",
    x2: "19.78",
    y2: "4.22"
  }));
}
function MoonIcon() {
  return /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
  }));
}
function Topbar({
  title,
  dark,
  setDark,
  onNew
}) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  return /*#__PURE__*/React.createElement("header", {
    style: {
      height: 60,
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      background: 'var(--surface-topbar)',
      borderBottom: '1px solid var(--border-soft)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 17,
      letterSpacing: '-.015em',
      color: 'var(--text)'
    }
  }, title || `${greeting}, Kayla`)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setDark(!dark),
    style: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: 'var(--text-faint)',
      display: 'flex',
      padding: 6
    }
  }, dark ? /*#__PURE__*/React.createElement(SunIcon, null) : /*#__PURE__*/React.createElement(MoonIcon, null)), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm",
    onClick: onNew
  }, "+ New proposal")));
}
window.Topbar = Topbar;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/torvionyx-app/Topbar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/torvionyx-app/data.js
try { (() => {
window.PROPOSALS = [{
  id: 1,
  client: 'Northwind Studio',
  type: 'service proposal',
  status: 'accepted',
  created: '2d ago'
}, {
  id: 2,
  client: 'Halcyon & Co.',
  type: 'project quote',
  status: 'viewed',
  created: '3d ago'
}, {
  id: 3,
  client: 'Mira Bright',
  type: 'retainer proposal',
  status: 'shared',
  created: '5d ago'
}, {
  id: 4,
  client: 'Bright Fox Labs',
  type: 'consultancy proposal',
  status: 'draft',
  created: '1w ago'
}, {
  id: 5,
  client: 'Ledger & Vine',
  type: 'photography proposal',
  status: 'declined',
  created: '2w ago'
}];
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/torvionyx-app/data.js", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Logo = __ds_scope.Logo;

__ds_ns.StatCard = __ds_scope.StatCard;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.ColorSwatch = __ds_scope.ColorSwatch;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Textarea = __ds_scope.Textarea;

__ds_ns.Toggle = __ds_scope.Toggle;

__ds_ns.NavLink = __ds_scope.NavLink;

})();
