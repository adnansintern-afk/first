# Campaign System Testing Checklist

Use this checklist to verify all functionality is working correctly.

## ✅ Prerequisites

- [ ] Routes added to router configuration (see ROUTING_SETUP.md)
- [ ] Environment variables set (.env file with Supabase credentials)
- [ ] At least one test customer with push_token in database
- [ ] At least one active reward in rewards table

## 🎯 Campaign Creation Flow

### Creating a New Campaign

- [ ] Navigate to `/dashboard/campaigns`
- [ ] Click "Create Notification" button
- [ ] Wizard opens at step 1 (Details)

#### Step 1: Details
- [ ] Enter campaign name (required)
- [ ] Enter description (optional)
- [ ] Click "Continue"

#### Step 2: Audience
- [ ] Estimated audience size displays correctly
- [ ] Can select "All Users"
- [ ] Can select "Active Only"
- [ ] Number updates when switching audience types
- [ ] Click "Continue"

#### Step 3: Content
- [ ] Enter notification title (max 50 chars)
- [ ] Character counter shows correctly
- [ ] Enter notification body (max 150 chars)
- [ ] Can insert {{customer_name}} placeholder
- [ ] Can insert {{total_points}} placeholder
- [ ] Mobile preview updates in real-time
- [ ] Can select deep link destination
- [ ] Click "Continue"

#### Step 4: Launch
- [ ] Can toggle between "Now" and "Later"
- [ ] If "Later" selected, datetime picker appears
- [ ] "Send Immediately" button works
- [ ] "Schedule Notification" button works (if later selected)
- [ ] "Save as Draft" button works
- [ ] Success message appears
- [ ] Redirects to campaigns list

### Campaign List

- [ ] New campaign appears in list
- [ ] Campaign shows correct status badge (draft/scheduled/sent)
- [ ] Estimated audience size displayed
- [ ] Can search campaigns by name
- [ ] Can filter by status (all/draft/scheduled/sent)
- [ ] Click non-draft campaign navigates to monitoring

## 📊 Campaign Monitoring

- [ ] Navigate to campaign monitoring page by clicking sent campaign
- [ ] Metrics cards display:
  - [ ] Targeted Devices
  - [ ] Successfully Delivered (with rate)
  - [ ] Tapped/Opened (with CTR)
- [ ] Delivery log table shows:
  - [ ] Customer names
  - [ ] Delivery status with colored badges
  - [ ] Timestamp
  - [ ] Error messages for failed sends
- [ ] Can filter by status (all/delivered/failed)
- [ ] Refresh button updates data
- [ ] Back button returns to campaigns list

## ✏️ Campaign Editing

- [ ] Click "Continue" on draft campaign
- [ ] Wizard opens in edit mode
- [ ] All previous values pre-populated
- [ ] Can modify all fields
- [ ] Save updates existing campaign (doesn't create new one)
- [ ] Updated campaign shows changes in list

## 🗑️ Campaign Deletion

- [ ] Click delete icon on draft campaign
- [ ] Confirmation modal appears
- [ ] Can cancel deletion
- [ ] Can confirm deletion
- [ ] Campaign removed from list

## 👤 Customer Wallet Flow

### Onboarding

- [ ] Navigate to `/wallet/{restaurant-slug}`
- [ ] Welcome screen displays with benefits
- [ ] Click "Get Started"
- [ ] Signup form appears
- [ ] Fill in required fields (first name, last name, email)
- [ ] Can submit form
- [ ] Wallet opens with 100 welcome points

### QR Code Generation

- [ ] Click "Show QR to Earn Points"
- [ ] Modal opens with QR code
- [ ] Redemption code displays
- [ ] Countdown timer shows (5 minutes)
- [ ] Can refresh QR code
- [ ] Can close modal

### Rewards

- [ ] Navigate to Rewards tab
- [ ] Available rewards display
- [ ] Rewards show point requirements
- [ ] Rewards show category tags
- [ ] Can click "Redeem Now" on affordable reward
- [ ] Redemption modal opens with:
  - [ ] Reward details
  - [ ] Current points
  - [ ] Points after redemption
  - [ ] Warning message
- [ ] Can cancel redemption
- [ ] Can confirm redemption
- [ ] Success screen with QR code
- [ ] Points deducted from balance

### Transaction History

- [ ] Navigate to History tab
- [ ] Transactions display in reverse chronological order
- [ ] Each transaction shows:
  - [ ] Type icon
  - [ ] Description
  - [ ] Points (+ or -)
  - [ ] Date/time
  - [ ] Amount spent (if applicable)

### Profile

- [ ] Navigate to Profile tab
- [ ] Customer info displays correctly
- [ ] Tier badge shows
- [ ] Statistics grid shows:
  - [ ] Member Since
  - [ ] Total Visits
  - [ ] Lifetime Points
  - [ ] Total Spent
- [ ] Tier progress bar displays (if not platinum)
- [ ] Communication preferences section shows:
  - [ ] WhatsApp toggle
  - [ ] Email toggle
  - [ ] SMS toggle
  - [ ] Push Notifications toggle
- [ ] Can toggle each preference
- [ ] "Saving preferences..." message appears
- [ ] Changes persist on page refresh

## 🔄 Integration Testing

### Campaign → Customer Flow

1. [ ] Create campaign with personalized message
2. [ ] Send campaign
3. [ ] Check campaign_sends table in database
4. [ ] Verify delivery status logged
5. [ ] Verify customer_id matches

### Customer → Campaign Consent

1. [ ] Turn off push notifications in customer profile
2. [ ] Create new campaign
3. [ ] Verify customer not included in sends
4. [ ] Turn push back on
5. [ ] Create another campaign
6. [ ] Verify customer now included

### Reward Redemption → Transactions

1. [ ] Redeem reward in wallet
2. [ ] Check transactions table
3. [ ] Verify negative points transaction created
4. [ ] Verify reward_id linked correctly
5. [ ] Check reward_redemptions table
6. [ ] Verify redemption record created

## 🧪 Edge Cases

### Campaign Creation

- [ ] Try creating campaign with empty name (should error)
- [ ] Try creating campaign with empty title (should error)
- [ ] Try creating campaign with empty body (should error)
- [ ] Create campaign with very long text (should truncate/error)
- [ ] Create scheduled campaign in the past (should error/handle)

### Customer Wallet

- [ ] Try redeeming reward with insufficient points (should error)
- [ ] Try using expired QR token (should error)
- [ ] Try using same QR token twice (should error)
- [ ] Try accessing wallet with invalid restaurant slug (should error)

### Campaign Monitoring

- [ ] View monitoring for campaign with no sends
- [ ] View monitoring for partially sent campaign
- [ ] Refresh monitoring page multiple times
- [ ] Filter by each status type

## 🐛 Known Issues to Watch For

- [ ] Campaign monitoring page only accessible if routes configured
- [ ] Push tokens must be set on customers for targeting
- [ ] QR tokens expire after 5 minutes
- [ ] Edge Function currently simulates sends (90% success rate)

## 📝 Database Verification

After testing, check these tables in Supabase:

- [ ] `campaigns` - New campaigns created
- [ ] `campaign_sends` - Send logs recorded
- [ ] `customers` - Customer data correct
- [ ] `customer_consent` - Preferences saved
- [ ] `reward_redemptions` - Redemptions logged
- [ ] `transactions` - Points tracked
- [ ] `qr_tokens` - Tokens generated

## 🎉 Success Criteria

All checkboxes above should be checked for full system verification.

If any tests fail:
1. Check browser console for errors
2. Check Supabase Edge Function logs
3. Verify database tables have correct data
4. Review CAMPAIGN_SYSTEM_COMPLETE.md for troubleshooting

---

**Testing Status:** ⬜ Not Started | 🟡 In Progress | ✅ Complete
