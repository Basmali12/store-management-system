#!/bin/bash
cat src/merchant/inventory/services/inventoryService.ts | grep "saveProducts =" -n -B 2 -A 5
