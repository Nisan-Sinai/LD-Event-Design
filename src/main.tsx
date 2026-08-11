import React from 'react';
import ReactDOM from 'react-dom/client';
import { Root } from './Root';
import { I18nProvider } from './i18n/i18n';
import { initHashNavigation } from './lib/hashNavigation';
import { installNavigationActiveState } from './lib/navigationActiveState';
import { installProductImageLightbox } from './lib/productImageLightbox';
import { installSecondaryCatalogMedia } from './lib/secondaryCatalogMedia';
import './index.css';
import './storefront.css';
import './storefront-refinement.css';
import './mobile-cart-summary.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider>
      <Root />
    </I18nProvider>
  </React.StrictMode>
);

initHashNavigation();
installNavigationActiveState();
installSecondaryCatalogMedia();
installProductImageLightbox();

// No-op production deployment trigger.
