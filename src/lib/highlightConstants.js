export const HIGHLIGHT_COLOR = "rgba(253, 244, 157, 0.4)";

export const fontSizeMap = {
  small: "text-[15px] sm:text-[16px]",
  medium: "text-[16px] sm:text-[17px]",
  large: "text-[17px] sm:text-[18px]",
};

export function tokenize(text) {
  return text.match(/\S+|\s+/g) || [];
}
