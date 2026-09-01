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

    expect(screen.getByRole('heading', { name: 'أهلاً بك في أبو شمس' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /صاحب المحل/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /دخول الزبون/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /صاحب المحل/ }));
    expect(screen.getByRole('heading', { name: 'تسجيل الدخول للمحل' })).toBeTruthy();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(document.querySelectorAll('input[type="password"]')).toHaveLength(1);
    expect(screen.queryByText('إنشاء حساب محل جديد')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'العودة لاختيار نوع الدخول' }));
    expect(screen.getByRole('heading', { name: 'أهلاً بك في أبو شمس' })).toBeTruthy();
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

  it('keeps offline writes locally and deduplicates the pending sync queue', () => {
    tenantSetItem('merchant_products', JSON.stringify([{ id: 'p1', name: 'أول' }]));
    tenantSetItem('merchant_products', JSON.stringify([{ id: 'p1', name: 'معدل' }]));

    expect(JSON.parse(tenantGetItem('merchant_products') || '[]')[0].name).toBe('معدل');
    expect(getStoreSyncQueue()).toHaveLength(1);
    expect(getStoreSyncQueue()[0].value).toContain('معدل');
  });

  it('keeps deletion as the newest pending operation so old server data cannot return', () => {
    tenantSetItem('merchant_customers', JSON.stringify([{ id: 'c1' }]));
    tenantRemoveItem('merchant_customers');

    expect(tenantGetItem('merchant_customers')).toBeNull();
    const pending = getStoreSyncQueue().filter(operation => operation.key === 'merchant_customers');
    expect(pending).toHaveLength(1);
    expect(pending[0].value).toBeNull();
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
    expect(await screen.findByRole('heading', { name: 'ثبّت تطبيق أبو شمس' }, { timeout: 1500 })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'تحميل التطبيق' }));
    await waitFor(() => expect(prompt).toHaveBeenCalledOnce());
  });
});
