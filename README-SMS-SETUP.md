# SMS Feature Setup Guide

## Overview
The TradingAlerts platform includes SMS notifications via Twilio integration. This guide will help you set up SMS functionality.

## Prerequisites
1. A Twilio account (free trial available)
2. Supabase project with Edge Functions enabled

## Step 1: Create Twilio Account
1. Go to [Twilio Console](https://console.twilio.com/)
2. Sign up for a free account
3. Get a phone number from Twilio (free trial includes one)

## Step 2: Get Twilio Credentials
From your Twilio Console Dashboard, collect:
- **Account SID** (starts with AC...)
- **Auth Token** (click to reveal)
- **Phone Number** (your Twilio number, format: +1234567890)

## Step 3: Configure Supabase Environment Variables
In your Supabase project dashboard:

1. Go to **Settings** → **Edge Functions**
2. Add these environment variables:

```
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

## Step 4: Deploy Edge Function
The SMS functionality is handled by the Edge Function at:
`supabase/fonctions/check-crypto-alerts/index.ts`

This function:
- Checks crypto/stock prices every 60 seconds
- Sends SMS via Twilio when alerts trigger
- Supports international phone numbers

## Step 5: Test SMS Feature
1. Create an alert with SMS notifications enabled
2. Enter your phone number (format: +33612345678 or 0612345678)
3. Set a price target that will trigger quickly
4. Wait for the alert to trigger

## SMS Message Format
```
🚨 TradingAlerts: BTC ↗️ $45,000.00 (objectif: $44,000). Alerte désactivée. Connectez-vous pour en créer de nouvelles.
```

## Supported Phone Number Formats
- International: +33612345678, +1234567890
- French: 0612345678
- US: (555) 123-4567

## Troubleshooting

### SMS Not Sending
1. Check Twilio credentials in Supabase
2. Verify phone number format
3. Check Twilio account balance
4. Review Edge Function logs

### Invalid Phone Number
- Use international format: +country_code + number
- Remove spaces and special characters
- Example: +33612345678 (not +33 6 12 34 56 78)

### Twilio Trial Limitations
- Free trial only sends to verified numbers
- Add your phone number to verified list in Twilio Console
- Upgrade to paid plan for unrestricted SMS

## Cost Considerations
- Twilio SMS: ~$0.0075 per message
- Supabase Edge Functions: Free tier includes 500K invocations
- Consider rate limiting for high-volume users

## Security Notes
- Phone numbers are stored encrypted
- SMS content is minimal for privacy
- Twilio credentials are server-side only
- Users can opt-out anytime

## International Support
The system supports international SMS to most countries. Check Twilio's country coverage for specific regions.