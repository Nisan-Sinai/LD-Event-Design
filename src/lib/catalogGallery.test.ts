import { describe, expect, it } from 'vitest';
import { collectProductImages } from './productImageLightbox';
import { catalogImageUrls } from './secondaryCatalogMedia';

describe('catalogImageUrls', () => {
  it.each([
    [{ image_url: 'one', image_url_2: null, image_url_3: null, image_url_4: null }, ['one']],
    [{ image_url: 'one', image_url_2: 'two', image_url_3: null, image_url_4: null }, ['one', 'two']],
    [{ image_url: 'one', image_url_2: 'two', image_url_3: 'three', image_url_4: null }, ['one', 'two', 'three']],
    [{ image_url: 'one', image_url_2: 'two', image_url_3: 'three', image_url_4: 'four' }, ['one', 'two', 'three', 'four']]
  ])('returns exactly the existing image slots in order', (row, expected) => {
    expect(catalogImageUrls(row)).toEqual(expected);
  });

  it('skips empty values and duplicate URLs without leaving holes', () => {
    expect(catalogImageUrls({
      image_url: ' one ',
      image_url_2: '',
      image_url_3: 'one',
      image_url_4: ' four '
    })).toEqual(['one', 'four']);
  });
});

describe('collectProductImages', () => {
  function addImage(media: HTMLElement, src: string, index: number) {
    const image = document.createElement('img');
    image.src = src;
    image.alt = `image ${index + 1}`;
    image.dataset.catalogGalleryImage = 'true';
    image.dataset.catalogImageIndex = String(index);
    media.append(image);
  }

  it('collects only the selected product and restores slot order regardless of DOM order', () => {
    const section = document.createElement('section');
    const selected = document.createElement('article');
    const selectedMedia = document.createElement('div');
    const selectedTitle = document.createElement('h4');
    selectedTitle.textContent = 'Selected product';
    selected.append(selectedMedia, selectedTitle);

    addImage(selectedMedia, 'https://example.com/one.jpg', 0);
    addImage(selectedMedia, 'https://example.com/four.jpg', 3);
    addImage(selectedMedia, 'https://example.com/two.jpg', 1);
    addImage(selectedMedia, 'https://example.com/three.jpg', 2);

    const sibling = document.createElement('article');
    const siblingMedia = document.createElement('div');
    sibling.append(siblingMedia);
    addImage(siblingMedia, 'https://example.com/not-selected.jpg', 0);

    section.append(selected, sibling);

    expect(collectProductImages(selected).map((image) => image.src)).toEqual([
      'https://example.com/one.jpg',
      'https://example.com/two.jpg',
      'https://example.com/three.jpg',
      'https://example.com/four.jpg'
    ]);
  });

  it('deduplicates repeated image URLs inside one product', () => {
    const article = document.createElement('article');
    const media = document.createElement('div');
    article.append(media);
    addImage(media, 'https://example.com/same.jpg', 0);
    addImage(media, 'https://example.com/same.jpg', 1);

    expect(collectProductImages(article)).toHaveLength(1);
  });
});
