export function elementContrast(el: Element) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d')!;
  const parse = (value: string) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = value;
    ctx.fillRect(0, 0, 1, 1);
    return [...ctx.getImageData(0, 0, 1, 1).data];
  };
  const ancestors: Element[] = [];
  for (let node: Element | null = el; node; node = node.parentElement) ancestors.unshift(node);
  let background = [255, 255, 255];
  for (const node of ancestors) {
    const [r, g, b, a] = parse(getComputedStyle(node).backgroundColor);
    background = [r, g, b].map((v, i) => (v * a) / 255 + background[i] * (1 - a / 255));
  }
  const foreground = parse(getComputedStyle(el).color).slice(0, 3);
  const luminance = (rgb: number[]) =>
    rgb
      .map((v) => {
        v /= 255;
        return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      })
      .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
  const a = luminance(background),
    b = luminance(foreground);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function elementBackground(el: Element) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = getComputedStyle(el).backgroundColor;
  ctx.fillRect(0, 0, 1, 1);
  return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
}
