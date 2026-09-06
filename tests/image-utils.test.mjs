import assert from 'node:assert/strict';
import test from 'node:test';
import { isValidImageUrl, DEFAULT_FALLBACK_PRODUCT_IMAGE } from '../src/lib/image-utils.ts';

test('DEFAULT_FALLBACK_PRODUCT_IMAGE is defined and valid', () => {
  assert.ok(DEFAULT_FALLBACK_PRODUCT_IMAGE);
  assert.ok(isValidImageUrl(DEFAULT_FALLBACK_PRODUCT_IMAGE));
});

test('isValidImageUrl detects valid and invalid formats', () => {
  assert.equal(isValidImageUrl('https://images.unsplash.com/photo-123'), true);
  assert.equal(isValidImageUrl('http://example.com/item.png'), true);
  assert.equal(isValidImageUrl('data:image/webp;base64,UklGRk...'), true);
  assert.equal(isValidImageUrl('/images/logo.png'), true);

  assert.equal(isValidImageUrl(''), false);
  assert.equal(isValidImageUrl('invalid-url'), false);
  assert.equal(isValidImageUrl('javascript:alert(1)'), false);
});
