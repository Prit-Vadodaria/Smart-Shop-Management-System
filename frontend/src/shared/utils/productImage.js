import { API_ORIGIN } from '../services/api';

export const hasProductImage = (image) =>
  Boolean(image && image !== 'no-photo.jpg');

export const getProductImageUrl = (image) => {
  if (!hasProductImage(image)) return null;
  if (image.startsWith('http://') || image.startsWith('https://')) return image;
  if (image.startsWith('/')) return `${API_ORIGIN}${image}`;
  return `${API_ORIGIN}/uploads/products/${image}`;
};
