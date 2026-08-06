import { Dimensions, PixelRatio } from 'react-native';

const { width, height } = Dimensions.get('window');

// Lấy kích thước gốc (Base guideline size) từ iPhone 11 Pro Max / iPhone XS Max
const guidelineBaseWidth = 414;
const guidelineBaseHeight = 896;

/**
 * Hàm scale dựa trên chiều rộng màn hình.
 * Thường dùng cho các thuộc tính liên quan đến chiều ngang như width, marginHorizontal, paddingHorizontal
 */
export const scale = (size: number) => (width / guidelineBaseWidth) * size;

/**
 * Hàm scale dựa trên chiều cao màn hình.
 * Thường dùng cho các thuộc tính liên quan đến chiều dọc như height, marginVertical, paddingVertical
 */
export const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;

/**
 * Hàm scale vừa phải, giúp size không bị phình quá to trên thiết bị lớn.
 * Thường dùng cho fontSize, borderRadius
 */
export const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

/**
 * Hàm chuyển đổi đơn vị phần trăm theo chiều ngang màn hình
 */
export const wp = (widthPercent: number | string) => {
  const elemWidth = typeof widthPercent === "number" ? widthPercent : parseFloat(widthPercent);
  return PixelRatio.roundToNearestPixel((width * elemWidth) / 100);
};

/**
 * Hàm chuyển đổi đơn vị phần trăm theo chiều dọc màn hình
 */
export const hp = (heightPercent: number | string) => {
  const elemHeight = typeof heightPercent === "number" ? heightPercent : parseFloat(heightPercent);
  return PixelRatio.roundToNearestPixel((height * elemHeight) / 100);
};
