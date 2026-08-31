
import { ProductFieldSettings } from '../models/ProductFieldSettings';
import { tenantGetItem, tenantSetItem } from '../../../../shared/storage/tenantStorage';

const DEFAULT_SETTINGS: ProductFieldSettings = {
  barcodeEnabled: false,
  sizeEnabled: false,
  colorEnabled: false,
  weightEnabled: false,
  unitEnabled: false,
  expiryEnabled: false,
  brandEnabled: false,
  batchNumberEnabled: false,
  serialNumberEnabled: false,
  warrantyEnabled: false,
};

export const getProductFieldSettings = (): ProductFieldSettings => {
  const local = tenantGetItem('merchant_product_field_settings');
  if (local) return JSON.parse(local);
  return DEFAULT_SETTINGS;
};

export const saveProductFieldSettings = (settings: ProductFieldSettings) => {
  tenantSetItem('merchant_product_field_settings', JSON.stringify(settings));
};
