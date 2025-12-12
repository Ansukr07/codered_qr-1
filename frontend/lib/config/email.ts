import nodemailer from 'nodemailer';

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
    const smtpConfig = {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    };

    // Only create transporter if SMTP is configured
    if (!smtpConfig.host || !smtpConfig.auth.user || !smtpConfig.auth.pass) {
        console.warn('⚠️  SMTP not configured. OTPs will only be logged to console.');
        return null;
    }

    try {
        const transporter = nodemailer.createTransport(smtpConfig);
        console.log('✓ Email transporter configured');
        return transporter;
    } catch (error: any) {
        console.error('❌ Error creating email transporter:', error.message);
        return null;
    }
};

const transporter = createTransporter();

// Send OTP email
export const sendOTPEmail = async (email: string, otpCode: string, participantName?: string) => {
    if (!transporter) {
        console.log(`OTP for ${email}: ${otpCode}`);
        return { success: false, message: 'Email not configured, OTP logged to console' };
    }

    const mailOptions = {
        from: `"Code Red 3.0" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: email,
        subject: 'Your Code Red 3.0 Login OTP',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
                    .content { background-color: #f9fafb; padding: 30px; border-radius: 5px; margin: 20px 0; }
                    .otp-box { background-color: #fff; border: 2px dashed #dc2626; padding: 20px; text-align: center; margin: 20px 0; }
                    .otp-code { font-size: 32px; font-weight: bold; color: #dc2626; letter-spacing: 5px; }
                    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
                    .warning { color: #dc2626; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>CODE RED 3.0</h1>
                    </div>
                    <div class="content">
                        <h2>Hello ${participantName || 'Participant'}!</h2>
                        <p>You have requested a One-Time Password (OTP) to log in to your Code Red 3.0 Dashboard.</p>
                        
                        <div class="otp-box">
                            <p style="margin: 0 0 10px 0;">Your OTP is:</p>
                            <div class="otp-code">${otpCode}</div>
                        </div>
                        
                        <p class="warning">⚠️ This OTP is valid for 10 minutes only.</p>
                        <p>If you did not request this OTP, please ignore this email.</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated message from Code Red 3.0 Dashboard.</p>
                        <p>Please do not reply to this email.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `
            CODE RED 3.0 - Login OTP
            
            Hello ${participantName || 'Participant'}!
            
            Your One-Time Password (OTP) to log in to Code Red 3.0 Dashboard is:
            
            ${otpCode}
            
            This OTP is valid for 10 minutes only.
            
            If you did not request this OTP, please ignore this email.
            
            ---
            This is an automated message. Please do not reply.
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✓ OTP email sent to ${email}:`, info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error: any) {
        console.error('❌ Error sending OTP email:', error);
        // Fallback to console log if email fails
        console.log(`OTP for ${email}: ${otpCode}`);
        return { success: false, error: error.message };
    }
};

export { transporter };



