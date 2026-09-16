export const HIGHLIGHT_COLORS = {
  yellow: "rgba(253, 244, 157, 0.4)",
  green: "rgba(134, 239, 172, 0.4)",
  blue: "rgba(96, 165, 250, 0.4)",
};

export const HIGHLIGHT_COLOR = HIGHLIGHT_COLORS.yellow; // Default color

export const fontSizeMap = {
  small: "text-[15px] sm:text-[16px]",
  medium: "text-[16px] sm:text-[17px]",
  large: "text-[17px] sm:text-[18px]",
};

export function tokenize(text) {
  return text.match(/\S+|\s+/g) || [];
}
