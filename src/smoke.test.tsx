/** @vitest-environment jsdom */
import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SalesScreen } from './merchant/sales/screens/SalesScreen';
import { PurchasesScreen } from './merchant/purchases/screens/PurchasesScreen';
import App from './App';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem('merchantSession', 'test-merchant');
});

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

  it('protects the super admin route', () => {
    localStorage.removeItem('merchantSession');
    window.history.replaceState({}, '', '/11');
    render(<App />);
    expect(screen.getByRole('heading', { name: /إعداد حماية الإدارة|دخول المشرف العام/ })).toBeTruthy();
  });
});
