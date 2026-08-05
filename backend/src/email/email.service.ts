import { Injectable, Logger } from '@nestjs/common'
import nodemailer, { Transporter } from 'nodemailer'

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)
  private transporter: Transporter

  constructor() {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com'
    const port = Number(process.env.SMTP_PORT || 587)
    const user = process.env.SMTP_USER || ''
    const pass = process.env.SMTP_PASS || ''

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 30000,
    })
  }

  async sendPasswordResetEmail(to: string, resetUrl: string) {
    const from = process.env.EMAIL_FROM || 'NaijaHandy <naijahandy@gmail.com>'
    await this.transporter.sendMail({
      from,
      to,
      subject: 'Reset your NaijaHandy password',
      text: [
        'Hi,',
        '',
        'You requested a password reset for your NaijaHandy account.',
        'Click the link below to set a new password (valid for 60 minutes):',
        '',
        resetUrl,
        '',
        'If you did not request this, you can safely ignore this email.',
        '',
        'NaijaHandy Team',
      ].join('\n'),
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
          <h2 style="color:#047857;margin-top:0">Reset your password</h2>
          <p style="color:#374151;line-height:1.6">Hi,</p>
          <p style="color:#374151;line-height:1.6">You requested a password reset for your NaijaHandy account. Click the button below to set a new password. This link is valid for 60 minutes.</p>
          <p style="text-align:center;margin:28px 0">
            <a href="${resetUrl}" style="background:#047857;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;display:inline-block">Reset password</a>
          </p>
          <p style="color:#6b7280;font-size:13px;line-height:1.5">If the button does not work, copy and paste this link into your browser:<br/>${resetUrl}</p>
          <p style="color:#6b7280;font-size:13px">If you did not request this, you can safely ignore this email.</p>
          <p style="color:#9ca3af;font-size:12px">NaijaHandy &middot; Nigeria</p>
        </div>
      `,
    })
    this.logger.log(`Password reset email sent to ${to}`)
  }
}
