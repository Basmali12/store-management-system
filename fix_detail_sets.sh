#!/bin/bash
sed -i 's/setDebts(getDebts(customerId));/setDebts(getDebts(customerId));\n    setPayments(getPayments(customerId));/g' src/merchant/customers/screens/CustomerDetailScreen.tsx
