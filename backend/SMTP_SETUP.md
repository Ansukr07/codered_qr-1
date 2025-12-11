# SMTP Email Configuration for OTP

## For BMSIT Email (ecell@bmsit.in)

Add these to your `.env.local` file:

```env
# Email Configuration (for OTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=ecell@bmsit.in
SMTP_PASS=your-app-password-here
SMTP_FROM=Code Red 3.0 <ecell@bmsit.in>
```

## Steps to Get Gmail App Password:

1. **Enable 2-Step Verification** (if not already enabled):
   - Go to: https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter name: "Code Red OTP"
   - Click "Generate"
   - Copy the 16-character password (no spaces)

3. **Add to .env.local**:
   - Replace `your-app-password-here` with the generated app password

## Alternative: If BMSIT uses Custom SMTP

If `ecell@bmsit.in` is not a Gmail account, you may need different settings:

```env
SMTP_HOST=smtp.bmsit.in  # or your email provider's SMTP server
SMTP_PORT=587            # or 465 for SSL
SMTP_USER=ecell@bmsit.in
SMTP_PASS=your-email-password
SMTP_FROM=Code Red 3.0 <ecell@bmsit.in>
```

**Note:** Contact your IT department for the correct SMTP settings if using a custom email server.

## Testing

After adding the SMTP configuration:
1. Restart your backend server
2. Try generating an OTP
3. Check the email inbox for `ecell@bmsit.in`
4. Check server logs for any email errors

