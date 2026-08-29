const luminance = (hex) => {
  const rgb = hex
    .match(/[0-9a-f]{2}/gi)
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
};
const ratio = (a, b) => {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
for (const color of process.argv.slice(2))
  console.log(
    JSON.stringify({
      color,
      onLight: Number(ratio(color, "#f8f8f5").toFixed(2)),
      whiteText: Number(ratio(color, "#ffffff").toFixed(2)),
      onDark: Number(ratio(color, "#181b19").toFixed(2)),
    }),
  );
