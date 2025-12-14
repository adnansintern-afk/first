# Campaign System Routing Setup

The campaign system requires the following routes to be added to your main routing configuration (usually in `App.tsx` or your router file):

## Required Routes

Add these routes inside your authenticated dashboard routes:

```tsx
// Campaign Routes (inside DashboardLayout)
<Route path="/dashboard/campaigns" element={<CampaignsPage />} />
<Route path="/dashboard/campaigns/create" element={<CampaignWizard />} />
<Route path="/dashboard/campaigns/:campaignId/edit" element={<CampaignWizard />} />
<Route path="/dashboard/campaigns/:campaignId/monitoring" element={<CampaignMonitoring />} />
<Route path="/dashboard/campaigns/settings" element={<CampaignSettings />} />
```

## Customer Wallet Route

Add this route outside your authenticated routes (public access):

```tsx
// Customer Wallet (public route)
<Route path="/wallet/:restaurantSlug" element={<CustomerWallet />} />
```

## Example Full Routing Structure

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import CampaignsPage from './components/CampaignsPage';
import CampaignWizard from './components/CampaignWizard';
import CampaignMonitoring from './components/CampaignMonitoring';
import CampaignSettings from './components/CampaignSettings';
import CustomerWallet from './components/CustomerWallet';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/wallet/:restaurantSlug" element={<CustomerWallet />} />

        {/* Authenticated Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          {/* ... other dashboard routes ... */}

          {/* Campaign Routes */}
          <Route path="campaigns" element={<CampaignsPage />} />
          <Route path="campaigns/create" element={<CampaignWizard />} />
          <Route path="campaigns/:campaignId/edit" element={<CampaignWizard />} />
          <Route path="campaigns/:campaignId/monitoring" element={<CampaignMonitoring />} />
          <Route path="campaigns/settings" element={<CampaignSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

## Import Statements

Make sure to add these imports at the top of your routing file:

```tsx
import CampaignsPage from './CampaignsPage';
import CampaignWizard from './CampaignWizard';
import CampaignMonitoring from './CampaignMonitoring';
import CampaignSettings from './CampaignSettings';
import CustomerWallet from './CustomerWallet';
```

## Navigation in DashboardLayout

The DashboardLayout already has the Campaigns navigation item configured:

```tsx
{ name: 'Campaigns', href: '/dashboard/campaigns', icon: Target }
```

This should work automatically once the routes are set up correctly.
