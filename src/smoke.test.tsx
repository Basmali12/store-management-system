/** @vitest-environment jsdom */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SalesScreen } from './merchant/sales/screens/SalesScreen';
import { PurchasesScreen } from './merchant/purchases/screens/PurchasesScreen';
import App from './App';
import { tenantGetItem, tenantRemoveItem, tenantSetItem } from './shared/storage/tenantStorage';
import { getStoreSyncQueue } from './shared/convex/tenantSyncBridge';
import { MerchantNavigator } from './navigation/merchant_navigation/MerchantNavigator';
import { InstallPrompt } from './shared/components/InstallPrompt';
import { getMerchantSession, setMerchantSession } from './shared/storage/session';
import { addCustomer, getCustomers } from './merchant/debts/services/debtService';
import { SettingsScreen } from './merchant/settings/screens/SettingsScreen';
import { UpdatePrompt } from './shared/components/UpdatePrompt';
import { CURRENT_APP_VERSION } from './shared/update/appVersion';
import { updateSale } from './merchant/sales/services/salesService';
import { authenticateOfficialMerchant, changeOfficialMerchantPassword } from './shared/auth/serverAuth';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem('merchantSession', 'test-merchant');
});

afterEach(() => cleanup());

describe('critical UI paths', () => {
  it('opens a new sale without a hooks crash', () => {
    render(<SalesScreen />);
    fireEvent.click(screen.getByRole('button', { name: /عملية بيع/ }));
    expect(screen.getByRole('heading', { name: 'عملية بيع جديدة' })).toBeTruthy();
    expect(screen.getByLabelText('اسم الزبون')).toBeTruthy();
    expect(screen.getByLabelText('رقم الزبون')).toBeTruthy();
    expect(screen.getByLabelText(/العنوان/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'تأكيد وإتمام البيع' })).toBeTruthy();
  });

  it('shares a sale on WhatsApp and safely edits its quantity and customer details', () => {
    tenantSetItem('merchant_products', JSON.stringify([{
      productId: 'p-edit', name: 'ببسي', category: 'مشروبات', purchasePrice: 500,
      salePrice: 1000, quantity: 8, lowStockLimit: 1, createdAt: '', updatedAt: '',
    }]));
    tenantSetItem('merchant_sales', JSON.stringify([{
      saleId: 'sale-edit-123456', saleType: 'CASH', cashCustomer: { name: 'علي', phone: '07712345678' },
      items: [{ productId: 'p-edit', productName: 'ببسي', quantity: 2, unitPrice: 1000, totalPrice: 2000, returnedQuantity: 0 }],
      subtotal: 2000, total: 2000, createdAt: new Date().toISOString(), refundedTotal: 0, status: 'COMPLETED',
    }]));
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(<SalesScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'مشاركة عبر واتساب' }));
    expect(open).toHaveBeenCalledWith(expect.stringContaining('https://wa.me/9647712345678'), '_blank', 'noopener,noreferrer');

    fireEvent.click(screen.getByRole('button', { name: 'تعديل المعاملة' }));
    fireEvent.change(screen.getByLabelText('تعديل اسم الزبون'), { target: { value: 'علي محمد' } });
    fireEvent.change(screen.getByLabelText('كمية ببسي'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'حفظ التعديل' }));

    const sale = JSON.parse(tenantGetItem('merchant_sales') || '[]')[0];
    const product = JSON.parse(tenantGetItem('merchant_products') || '[]')[0];
    expect(sale.cashCustomer.name).toBe('علي محمد');
    expect(sale.total).toBe(3000);
    expect(product.quantity).toBe(7);
    open.mockRestore();
  });

  it('keeps credit balance, debt and stock consistent when editing an unpaid sale', () => {
    tenantSetItem('merchant_products', JSON.stringify([{
      productId: 'p-credit-edit', name: 'مادة', category: '', purchasePrice: 50,
      salePrice: 100, quantity: 8, lowStockLimit: 1, createdAt: '', updatedAt: '',
    }]));
    tenantSetItem('merchant_customers', JSON.stringify([{
      id: 'c-edit', name: 'زبون آجل', phone: '07711111111', balance: 200,
      totalTaken: 200, totalPaid: 0, lastActivity: '', status: 'active',
    }]));
    tenantSetItem('merchant_debts', JSON.stringify({ 'c-edit': [{
      debtId: 'd-edit', customerId: 'c-edit', description: 'مادة', quantity: 2,
      amount: 200, remainingAmount: 200, status: 'OPEN', createdAt: '', saleId: 'sale-credit-edit',
    }] }));
    tenantSetItem('merchant_sales', JSON.stringify([{
      saleId: 'sale-credit-edit', customerId: 'c-edit', saleType: 'CREDIT',
      items: [{ productId: 'p-credit-edit', productName: 'مادة', quantity: 2, unitPrice: 100, totalPrice: 200, returnedQuantity: 0 }],
      subtotal: 200, total: 200, createdAt: new Date().toISOString(), refundedTotal: 0, status: 'COMPLETED',
    }]));

    updateSale('sale-credit-edit', { items: [{ productId: 'p-credit-edit', quantity: 3, unitPrice: 120 }] });

    expect(JSON.parse(tenantGetItem('merchant_products') || '[]')[0].quantity).toBe(7);
    expect(JSON.parse(tenantGetItem('merchant_customers') || '[]')[0].balance).toBe(360);
    expect(JSON.parse(tenantGetItem('merchant_debts') || '{}')['c-edit'][0].remainingAmount).toBe(360);
    expect(JSON.parse(tenantGetItem('merchant_sales') || '[]')[0].total).toBe(360);
  });

  it('opens a new purchase without a hooks crash', () => {
    render(<PurchasesScreen />);
    fireEvent.click(screen.getByRole('button', { name: /عملية شراء/ }));
    expect(screen.getByRole('heading', { name: 'عملية شراء جديدة' })).toBeTruthy();
  });

  it('does not erase existing browser data on startup', () => {
    localStorage.setItem('valuable-data', 'keep-me');
    render(<App />);
    expect(localStorage.getItem('valuable-data')).toBe('keep-me');
  });

  it('restores the role selection page and opens the owner login', () => {
    localStorage.removeItem('merchantSession');
    render(<App />);

    expect(screen.getByRole('heading', { name: 'أهلاً بك في النور للإدارة والديون' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /صاحب المحل/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /دخول الزبون/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /صاحب المحل/ }));
    expect(screen.getByRole('heading', { name: 'تسجيل الدخول للمحل' })).toBeTruthy();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(document.querySelectorAll('input[type="password"]')).toHaveLength(1);
    expect(screen.queryByText('إنشاء حساب محل جديد')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'العودة لاختيار نوع الدخول' }));
    expect(screen.getByRole('heading', { name: 'أهلاً بك في النور للإدارة والديون' })).toBeTruthy();
  });

  it('uses the official merchant account and hides public registration', () => {
    localStorage.removeItem('merchantSession');
    render(<App />);

    expect(screen.queryByText('إنشاء حساب محل جديد')).toBeNull();
    const accounts = JSON.parse(localStorage.getItem('merchant_accounts') || '[]');
    expect(accounts).toHaveLength(1);
    const official = accounts.find((account: { phone?: string }) => account.phone === '07710074850');
    expect(official?.passwordCredential).toBeUndefined();
    expect(official?.password).toBeUndefined();
  });

  it('logs the trial owner in locally without a Convex connection', async () => {
    localStorage.removeItem('merchantSession');
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /صاحب المحل/ }));
    fireEvent.change(document.querySelector('input[type="password"]')!, { target: { value: '1001' } });
    fireEvent.click(screen.getByRole('button', { name: 'تسجيل الدخول' }));

    expect(await screen.findByRole('button', { name: 'الرئيسية' })).toBeTruthy();
    expect(getMerchantSession()).toBe('merchant_official');
  });

  it('keeps a changed local trial password across account initialization', async () => {
    expect(await authenticateOfficialMerchant('merchant_official', '1001')).toBeTruthy();
    await changeOfficialMerchantPassword('1001', 'local-pass-2026');

    const { ensureOfficialMerchantAccount } = await import('./shared/auth/merchantAccounts');
    ensureOfficialMerchantAccount();

    expect(await authenticateOfficialMerchant('merchant_official', '1001')).toBeNull();
    expect(await authenticateOfficialMerchant('merchant_official', 'local-pass-2026')).toBeTruthy();
  });

  it('uses one registered phone field for customer login and creates no credentials', async () => {
    setMerchantSession('merchant_official');
    const customer = await addCustomer('زبون الاختبار', '٠٧٧١٢٣٤٥٦٧٨');
    expect(customer.phone).toBe('07712345678');
    expect(customer).not.toHaveProperty('customerLoginNumber');
    expect(customer).not.toHaveProperty('customerPassword');
    expect(getCustomers().find(item => item.id === customer.id)).toBeTruthy();

    localStorage.removeItem('merchantSession');
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /دخول الزبون/ }));

    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    expect(document.querySelector('input[type="password"]')).toBeNull();
    fireEvent.change(screen.getByLabelText('رقم الهاتف المسجل'), { target: { value: '07712345678' } });
    fireEvent.click(screen.getByRole('button', { name: 'دخول إلى حسابي' }));
    expect(await screen.findByRole('heading', { name: 'زبون الاختبار' })).toBeTruthy();
    expect(screen.getByText(/حسابي/)).toBeTruthy();
  });

  it('keeps the owner signed in across app restarts until explicit logout', () => {
    setMerchantSession('merchant_official');
    render(<App />);
    expect(getMerchantSession()).toBe('merchant_official');
    expect(screen.queryByRole('heading', { name: 'تسجيل الدخول للمحل' })).toBeNull();

    cleanup();
    render(<App />);
    expect(getMerchantSession()).toBe('merchant_official');
    expect(screen.queryByRole('heading', { name: 'تسجيل الدخول للمحل' })).toBeNull();
  });

  it('keeps trial writes locally without creating a Convex sync queue', () => {
    tenantSetItem('merchant_products', JSON.stringify([{ id: 'p1', name: 'أول' }]));
    tenantSetItem('merchant_products', JSON.stringify([{ id: 'p1', name: 'معدل' }]));

    expect(JSON.parse(tenantGetItem('merchant_products') || '[]')[0].name).toBe('معدل');
    expect(getStoreSyncQueue()).toHaveLength(0);
  });

  it('keeps trial deletions local without creating a Convex sync queue', () => {
    tenantSetItem('merchant_customers', JSON.stringify([{ id: 'c1' }]));
    tenantRemoveItem('merchant_customers');

    expect(tenantGetItem('merchant_customers')).toBeNull();
    expect(getStoreSyncQueue()).toHaveLength(0);
  });

  it('opens the main navigation and every quick-action button', async () => {
    render(<MerchantNavigator />);

    fireEvent.click(screen.getByRole('button', { name: 'المزيد' }));
    expect(screen.getByRole('heading', { name: 'المزيد' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'المخزون' }));
    expect(screen.getByRole('heading', { name: 'المخزون' })).toBeTruthy();

    cleanup();
    render(<MerchantNavigator />);
    fireEvent.click(screen.getByRole('button', { name: 'فتح الإجراءات السريعة' }));
    for (const name of ['إضافة دين', 'تسجيل تسديد', 'عملية بيع', 'عملية شراء', 'إضافة منتج', 'إضافة زبون', 'إضافة مورد', 'إضافة مصروف']) {
      expect(screen.getByRole('button', { name })).toBeTruthy();
    }
    fireEvent.click(screen.getByRole('button', { name: 'إغلاق الإجراءات السريعة' }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'عملية بيع' })).toBeNull());
  });

  it('offers PWA installation and calls the browser install prompt', async () => {
    const prompt = vi.fn().mockResolvedValue(undefined);
    const event = new Event('beforeinstallprompt') as Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: 'accepted' }>;
    };
    event.prompt = prompt;
    event.userChoice = Promise.resolve({ outcome: 'accepted' });

    render(<InstallPrompt />);
    window.dispatchEvent(event);
    expect(await screen.findByRole('heading', { name: 'ثبّت تطبيق النور' }, { timeout: 1500 })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'تحميل التطبيق' }));
    await waitFor(() => expect(prompt).toHaveBeenCalledOnce());
  });

  it('shows the code-defined app version as read-only in settings', () => {
    render(<SettingsScreen onBack={() => undefined} />);
    expect(screen.getByLabelText('رقم الإصدار').textContent).toBe(CURRENT_APP_VERSION);
    expect(screen.queryByRole('button', { name: 'حفظ واعتماد الإصدار' })).toBeNull();
    expect(screen.getByText(/لا يمكن تغييره من التطبيق/)).toBeTruthy();
  });

  it('shows a persistent update badge when the published code version changes', () => {
    render(<UpdatePrompt availableVersion="99.0.0" />);

    expect(screen.getByRole('heading', { name: 'يوجد تحديث جديد' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'تحميل النسخة الجديدة' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'لاحقًا' }));
    expect(screen.getByRole('button', { name: 'يوجد تحديث جديد' })).toBeTruthy();
  });

  it('does not show an update when the published and installed versions match', () => {
    render(<UpdatePrompt availableVersion={CURRENT_APP_VERSION} />);
    expect(screen.queryByRole('heading', { name: 'يوجد تحديث جديد' })).toBeNull();
  });
});
