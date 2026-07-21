// ============================================================
//  Logo ALAS (SVG inline, reutilizable).
//  window.alasLogo(variant, height)
//    variant: "blue"  → marca azul (para fondo blanco/claro)
//             "white" → marca blanca (para fondo azul/oscuro)
//    height:  alto en px (default 30)
// ============================================================
window.alasLogo = function (variant, height) {
  var brand  = variant === "white" ? "#FFFFFF" : "#1C75BC";
  var accent = variant === "white" ? "rgba(255,255,255,.55)" : "#8A97A8";
  var text   = variant === "white" ? "#FFFFFF" : "#1C75BC";
  height = height || 30;
  return '' +
  '<svg class="alas-logo" height="' + height + '" viewBox="0 0 320 96" fill="none" ' +
       'xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ALAS">' +
    '<path d="M16 82 L64 14 L92 82 Z" fill="' + brand + '"/>' +
    '<path d="M70 82 q22 9 44 1 q-16 12 -44 1 Z" fill="' + accent + '"/>' +
    '<text x="126" y="74" font-family="\'Space Grotesk\',Arial,sans-serif" ' +
         'font-weight="700" font-size="70" letter-spacing="4" fill="' + text + '">ALAS</text>' +
  '</svg>';
};
