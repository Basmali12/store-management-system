import React, { useState } from 'react';
import { AdminDashboardScreen } from '../dashboard/screens/AdminDashboardScreen';
import { MerchantDetailsScreen } from '../merchants/details/screens/MerchantDetailsScreen';
import { SubscriptionManagerScreen } from '../subscriptions/screens/SubscriptionManagerScreen';
import { FeatureFlagsScreen } from '../feature_flags/screens/FeatureFlagsScreen';

export function SuperAdminNavigator() {
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);
  const [currentRoute, setCurrentRoute] = useState<'dashboard' | 'details' | 'subscriptions' | 'features'>('dashboard');

  const handleSelectMerchant = (id: string) => {
    setSelectedMerchantId(id);
    setCurrentRoute('details');
  };

  const handleBackToDashboard = () => {
    setSelectedMerchantId(null);
    setCurrentRoute('dashboard');
  };

  const handleBackToDetails = () => {
    setCurrentRoute('details');
  };

  if (currentRoute === 'dashboard') {
    return <AdminDashboardScreen onSelectMerchant={handleSelectMerchant} />;
  }

  if (currentRoute === 'details' && selectedMerchantId) {
    return (
      <MerchantDetailsScreen 
        merchantId={selectedMerchantId} 
        onBack={handleBackToDashboard}
        onNavigateSubscription={() => setCurrentRoute('subscriptions')}
        onNavigateFeatures={() => setCurrentRoute('features')}
      />
    );
  }

  if (currentRoute === 'subscriptions' && selectedMerchantId) {
    return <SubscriptionManagerScreen merchantId={selectedMerchantId} onBack={handleBackToDetails} />;
  }

  if (currentRoute === 'features' && selectedMerchantId) {
    return <FeatureFlagsScreen merchantId={selectedMerchantId} onBack={handleBackToDetails} />;
  }

  return null;
}
