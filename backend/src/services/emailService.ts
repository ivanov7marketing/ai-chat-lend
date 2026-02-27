import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mail.ru',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE !== 'false', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

interface SendEmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}

/**
 * Sends a transactional email
 */
export async function sendEmail({ to, subject, text, html }: SendEmailOptions) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('[EmailService] SMTP credentials missing. Email not sent:', { to, subject });
        return;
    }

    try {
        const info = await transporter.sendMail({
            from: `"AI Chat Lend" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
            to,
            subject,
            text,
            html,
        });

        console.log('[EmailService] Email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('[EmailService] Error sending email:', error);
        throw error;
    }
}
