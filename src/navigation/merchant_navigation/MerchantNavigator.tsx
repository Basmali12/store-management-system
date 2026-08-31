import React, { useState, useEffect } from "react";
import { TopBar } from "../../merchant/components/TopBar";
import { BottomNavigation } from "../../merchant/components/BottomNavigation";
import { BottomSheet } from "../../merchant/components/BottomSheet";
import { HomeScreen } from "../../merchant/dashboard/screens/HomeScreen";
import { AccountsScreen } from "../../merchant/customers/screens/AccountsScreen";
import { CustomerDetailScreen } from "../../merchant/customers/screens/CustomerDetailScreen";
import { SalesScreen } from "../../merchant/sales/screens/SalesScreen";
import { InventoryScreen } from "../../merchant/inventory/screens/InventoryScreen";
import { PurchasesScreen } from "../../merchant/purchases/screens/PurchasesScreen";
import { MoreScreen } from "../../merchant/settings/screens/MoreScreen";
import { SettingsScreen } from "../../merchant/settings/screens/SettingsScreen";
import { ProductFieldsSettingsScreen } from "../../merchant/settings/product_fields/screens/ProductFieldsSettingsScreen";
import { SuppliersListScreen } from "../../merchant/suppliers/screens/SuppliersListScreen";
import { ExpensesScreen } from "../../merchant/expenses/screens/ExpensesScreen";
import { PlaceholderScreen } from "../../shared/components/PlaceholderScreen";
import { OverdueScreen } from "../../merchant/overdue/screens/OverdueScreen";
import { ReportsScreen } from "../../merchant/reports/screens/ReportsScreen";
import { ActivityLogScreen } from "../../merchant/activity/screens/ActivityLogScreen";

export function MerchantNavigator() {
  const [currentTab, setCurrentTab] = useState("home");
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  // Simple nested routing state for accounts
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );
  const [selectedMoreRoute, setSelectedMoreRoute] = useState<string | null>(
    null,
  );

  const [pendingCustomerAction, setPendingCustomerAction] = useState<
    "add_debt" | "add_payment" | "add_customer" | "add_product" | null
  >(null);
  const [pendingExpenseAction, setPendingExpenseAction] =
    useState<boolean>(false);
  const [pendingSupplierAction, setPendingSupplierAction] =
    useState<boolean>(false);
  const [pendingPurchaseAction, setPendingPurchaseAction] =
    useState<boolean>(false);

  const [returnToHome, setReturnToHome] = useState<boolean>(false);

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    setReturnToHome(false);
    // Reset nested views when changing tabs
    if (tab !== "accounts") {
      setSelectedCustomerId(null);
      setPendingCustomerAction(null);
    }
    if (tab !== "more") {
      setSelectedMoreRoute(null);
      setPendingExpenseAction(false);
      setPendingSupplierAction(false);
      setPendingPurchaseAction(false);
    }
  };

  const handleAction = (action: string) => {
    setIsBottomSheetOpen(false);
    setReturnToHome(true);
    switch (action) {
      case "sale":
        setCurrentTab("sales");
        break;
      case "add_payment":
      case "add_debt":
        setCurrentTab("accounts");
        setPendingCustomerAction(action as "add_debt" | "add_payment");
        break;
      case "add_customer":
        setCurrentTab("accounts");
        setPendingCustomerAction("add_customer" as any);
        break;
      case "add_product":
        setCurrentTab("more");
        setSelectedMoreRoute("inventory");
        setPendingCustomerAction("add_product" as any);
        break;
      case "add_expense":
        setCurrentTab("more");
        setSelectedMoreRoute("expenses");
        setPendingExpenseAction(true);
        break;
      case "purchase":
        setCurrentTab("more");
        setSelectedMoreRoute("purchases");
        setPendingPurchaseAction(true);
        break;
      case "add_supplier":
        setCurrentTab("more");
        setSelectedMoreRoute("suppliers");
        setPendingSupplierAction(true);
        break;
    }
  };

  const handleBackFromNested = (defaultAction: () => void) => {
    if (returnToHome) {
      setCurrentTab("home");
      setReturnToHome(false);
      setSelectedCustomerId(null);
      setSelectedMoreRoute(null);
      setPendingCustomerAction(null);
      setPendingExpenseAction(false);
      setPendingSupplierAction(false);
      setPendingPurchaseAction(false);
    } else {
      defaultAction();
    }
  };

  const renderScreen = () => {
    switch (currentTab) {
      case "home":
        return (
          <>
            <TopBar onSettingsClick={() => { setCurrentTab("more"); setSelectedMoreRoute("settings"); }} onNavigateToCustomerOverdue={(customerId) => { setCurrentTab("accounts"); setSelectedCustomerId(customerId); }} />
            <HomeScreen
              onNavigateOverdue={() => {
                setCurrentTab("more");
                setSelectedMoreRoute("overdue");
              }}
              onNavigateInventory={() => {
                setCurrentTab("more");
                setSelectedMoreRoute("inventory");
              }}
              onQuickAction={handleAction}
            />
          </>
        );
      case "accounts":
        if (selectedCustomerId) {
          return (
            <CustomerDetailScreen
              customerId={selectedCustomerId}
              initialAction={pendingCustomerAction === 'add_debt' || pendingCustomerAction === 'add_payment' ? pendingCustomerAction : null}
              onBack={() =>
                handleBackFromNested(() => {
                  setSelectedCustomerId(null);
                  setPendingCustomerAction(null);
                })
              }
            />
          );
        }
        return (
          <div className="h-full flex flex-col relative">
            {returnToHome && (
              <div className="bg-white p-2 flex border-b border-gray-100 z-20 sticky top-0">
                <button
                  onClick={() => handleBackFromNested(() => {})}
                  className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-bold text-gray-700"
                >
                  عودة للرئيسية
                </button>
              </div>
            )}
            <div className="flex-1 overflow-hidden relative">
              <AccountsScreen
                onCustomerSelect={setSelectedCustomerId}
                initialShowAdd={
                  pendingCustomerAction === ("add_customer" as any)
                }
                onAddClosed={() => setPendingCustomerAction(null)}
              />
            </div>
          </div>
        );
      case "sales":
        return (
          <div className="h-full flex flex-col relative">
            <div className="flex-1 overflow-hidden relative">
              <SalesScreen
                onBack={() => handleBackFromNested(() => setCurrentTab("home"))}
              />
            </div>
          </div>
        );

      case "more":
        if (selectedMoreRoute === "inventory") {
          return (
            <div className="h-full flex flex-col relative">
              <div className="bg-white p-2 flex border-b border-gray-100 z-20 sticky top-0">
                <button
                  onClick={() =>
                    handleBackFromNested(() => setSelectedMoreRoute(null))
                  }
                  className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-bold text-gray-700"
                >
                  عودة
                </button>
              </div>
              <div className="flex-1 overflow-hidden relative">
                <InventoryScreen
                  initialShowAdd={
                    pendingCustomerAction === ("add_product" as any)
                  }
                  onAddClosed={() => setPendingCustomerAction(null)}
                />
              </div>
            </div>
          );
        }
        if (selectedMoreRoute === "product_fields") {
          return (
            <ProductFieldsSettingsScreen
              onBack={() =>
                handleBackFromNested(() => setSelectedMoreRoute(null))
              }
            />
          );
        }
        if (selectedMoreRoute === "purchases") {
          return (
            <PurchasesScreen
              onBack={() =>
                handleBackFromNested(() => setSelectedMoreRoute(null))
              }
              initialView={pendingPurchaseAction ? "NEW" : "LIST"}
            />
          );
        }
        if (selectedMoreRoute === "suppliers") {
          return (
            <div className="h-full flex flex-col">
              <div className="bg-white p-2 flex border-b border-gray-100">
                <button
                  onClick={() =>
                    handleBackFromNested(() => setSelectedMoreRoute(null))
                  }
                  className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-bold"
                >
                  عودة
                </button>
              </div>
              <div className="flex-1 overflow-hidden relative">
                <SuppliersListScreen
                  initialShowAdd={pendingSupplierAction}
                  onAddClosed={() => setPendingSupplierAction(false)}
                />
              </div>
            </div>
          );
        }
        if (selectedMoreRoute === "expenses") {
          return (
            <ExpensesScreen
              onBack={() =>
                handleBackFromNested(() => {
                  setSelectedMoreRoute(null);
                  setPendingExpenseAction(false);
                })
              }
              initialShowForm={pendingExpenseAction}
            />
          );
        }
        if (selectedMoreRoute === "overdue") {
          return (
            <OverdueScreen
              onBack={() =>
                handleBackFromNested(() => setSelectedMoreRoute(null))
              }
              onSelectCustomer={(id) => {
                setCurrentTab("accounts");
                setSelectedCustomerId(id);
              }}
            />
          );
        }
        if (selectedMoreRoute === 'reports') {
          return <ReportsScreen onBack={() => handleBackFromNested(() => setSelectedMoreRoute(null))} />;
        }
        if (selectedMoreRoute === 'activity_log') {
          return <ActivityLogScreen onBack={() => handleBackFromNested(() => setSelectedMoreRoute(null))} />;
        }
        if (selectedMoreRoute === 'backup') {
          return <SettingsScreen onBack={() => handleBackFromNested(() => setSelectedMoreRoute(null))} />;
        }
        if (selectedMoreRoute === 'settings') {
          return <SettingsScreen onBack={() => handleBackFromNested(() => setSelectedMoreRoute(null))} />;
        }
        return <MoreScreen onNavigate={setSelectedMoreRoute} />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div
      className="min-h-screen bg-gray-50 flex flex-col font-[Cairo] text-gray-900 mx-auto max-w-md relative shadow-2xl overflow-hidden"
      dir="rtl"
    >
      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {renderScreen()}
      </div>

      <BottomNavigation
        currentTab={currentTab}
        onChangeTab={handleTabChange}
        onAddClick={() => setIsBottomSheetOpen(true)}
      />

      <BottomSheet
        onAction={handleAction}
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
      />
    </div>
  );
}
