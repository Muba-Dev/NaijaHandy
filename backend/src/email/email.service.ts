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

  private get sender(): string {
    return process.env.EMAIL_FROM || 'NaijaHandy <naijahandy@gmail.com>'
  }

  private notificationsEnabled(): boolean {
    return process.env.EMAIL_ENABLED === 'true'
  }

  private layout(title: string, body: string): string {
    return `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="color:#047857;margin-top:0">${title}</h2>
        ${body}
        <p style="color:#9ca3af;font-size:12px">NaijaHandy &middot; Nigeria</p>
      </div>
    `
  }

  // Gated by EMAIL_ENABLED=true and error-swallowed (log + continue), so
  // notification emails never block or break the request that triggered them.
  async send(to: string, subject: string, text: string, html: string): Promise<void> {
    if (!this.notificationsEnabled()) {
      this.logger.log(`[email] skipped (EMAIL_ENABLED not set) → ${subject}`)
      return
    }
    try {
      await this.transporter.sendMail({ from: this.sender, to, subject, text, html })
      this.logger.log(`[email] sent to ${to}: ${subject}`)
    } catch (err) {
      this.logger.error(`[email] failed to send to ${to}: ${(err as Error).message}`)
    }
  }

  async sendBookingStatusEmail(opts: {
    to: string
    status: string
    booking: {
      id: string
      artisanName: string
      customerName: string
      date: Date
      time: string
      amount: number
    }
  }) {
    const statusLabel = opts.status.charAt(0) + opts.status.slice(1).toLowerCase()
    const dateLabel = opts.booking.date.toLocaleDateString('en-NG', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    const amount = `₦${opts.booking.amount.toLocaleString('en-NG')}`
    const subject = `Booking ${statusLabel.toLowerCase()} — ${opts.booking.artisanName}`
    const detail =
      statusLabel === 'Confirmed'
        ? `Great news — your booking with ${opts.booking.artisanName} is confirmed.`
        : statusLabel === 'Completed'
          ? `Your booking with ${opts.booking.artisanName} is completed. We'd love to hear how it went.`
          : `Your booking with ${opts.booking.artisanName} was cancelled.`

    await this.send(
      opts.to,
      subject,
      [
        `Booking ${statusLabel.toLowerCase()}`,
        '',
        detail,
        '',
        `Artisan: ${opts.booking.artisanName}`,
        `Customer: ${opts.booking.customerName}`,
        `Date: ${dateLabel} at ${opts.booking.time}`,
        `Amount: ${amount}`,
        `Status: ${statusLabel}`,
        '',
        'NaijaHandy Team',
      ].join('\n'),
      this.layout(
        `Booking ${statusLabel.toLowerCase()}`,
        `
        <p style="color:#374151;line-height:1.6">${detail}</p>
        <div style="background:#f9fafb;border-radius:10px;padding:16px;margin:16px 0">
          <p style="margin:0 0 4px"><strong>Artisan:</strong> ${opts.booking.artisanName}</p>
          <p style="margin:0 0 4px"><strong>Customer:</strong> ${opts.booking.customerName}</p>
          <p style="margin:0 0 4px"><strong>Date:</strong> ${dateLabel} at ${opts.booking.time}</p>
          <p style="margin:0 0 4px"><strong>Amount:</strong> ${amount}</p>
          <p style="margin:0"><strong>Status:</strong> ${statusLabel}</p>
        </div>
        <p style="color:#6b7280;font-size:13px">Manage this booking from your NaijaHandy dashboard.</p>
        `,
      ),
    )
  }

  async sendApprovalStatusEmail(opts: { to: string; name: string; approvalStatus: string }) {
    const approved = opts.approvalStatus === 'APPROVED'
    const subject = approved ? 'Your NaijaHandy profile is approved' : 'Update on your NaijaHandy profile'
    const detail = approved
      ? `Hi ${opts.name}, congratulations! Your artisan profile has been approved and is now live on NaijaHandy. Customers can book you.`
      : `Hi ${opts.name}, we're sorry — your artisan profile was not approved. Contact us if you have questions.`

    await this.send(
      opts.to,
      subject,
      `${detail}\n\nNaijaHandy Team`,
      this.layout(
        approved ? 'Profile approved' : 'Profile not approved',
        `<p style="color:#374151;line-height:1.6">${detail}</p>`,
      ),
    )
  }

  async sendVerificationStatusEmail(opts: { to: string; name: string; verificationStatus: string }) {
    const verified = opts.verificationStatus === 'VERIFIED'
    const subject = verified ? 'You are now a verified NaijaHandy artisan' : 'NaijaHandy verification update'
    const detail = verified
      ? `Hi ${opts.name}, you're now a verified artisan on NaijaHandy. The verified badge appears on your profile.`
      : `Hi ${opts.name}, your verification status was updated. Contact us if you have questions.`

    await this.send(
      opts.to,
      subject,
      `${detail}\n\nNaijaHandy Team`,
      this.layout(
        verified ? 'You are verified' : 'Verification update',
        `<p style="color:#374151;line-height:1.6">${detail}</p>`,
      ),
    )
  }

  async sendNewArtisanPendingEmail(opts: { to: string; artisanName: string; profession: string }) {
    const detail = `A new artisan profile is awaiting review:\n\nName: ${opts.artisanName}\nProfession: ${opts.profession}`
    await this.send(
      opts.to,
      'New artisan pending approval',
      `${detail}\n\nApprove or reject it from the NaijaHandy admin dashboard.\nNaijaHandy Team`,
      this.layout(
        'New artisan pending approval',
        `
        <p style="color:#374151;line-height:1.6">A new artisan profile is awaiting review:</p>
        <div style="background:#f9fafb;border-radius:10px;padding:16px;margin:16px 0">
          <p style="margin:0 0 4px"><strong>Name:</strong> ${opts.artisanName}</p>
          <p style="margin:0"><strong>Profession:</strong> ${opts.profession}</p>
        </div>
        <p style="color:#6b7280;font-size:13px">Approve or reject it from the NaijaHandy admin dashboard.</p>
        `,
      ),
    )
  }

  async sendSupportMessageEmail(opts: { name: string; email: string; phone: string | null; subject: string; message: string }) {
    const to = process.env.SUPPORT_EMAIL || 'support@naijahandy.com'
    const contact = `${opts.name} <${opts.email}>${opts.phone ? ` · ${opts.phone}` : ''}`
    const detail = `A customer submitted a help request:\n\nFrom: ${contact}\nSubject: ${opts.subject}\n\n${opts.message}`
    await this.send(
      to,
      `New support message — ${opts.subject}`,
      `${detail}\n\nReply from the NaijaHandy admin console (Support tab).\nNaijaHandy Team`,
      this.layout(
        'New support message',
        `
        <p style="color:#374151;line-height:1.6">A customer submitted a help request:</p>
        <div style="background:#f9fafb;border-radius:10px;padding:16px;margin:16px 0">
          <p style="margin:0 0 4px"><strong>From:</strong> ${contact}</p>
          <p style="margin:0 0 4px"><strong>Subject:</strong> ${opts.subject}</p>
          <p style="margin:0"><strong>Message:</strong> ${opts.message}</p>
        </div>
        <p style="color:#6b7280;font-size:13px">Reply from the NaijaHandy admin console (Support tab).</p>
        `,
      ),
    )
  }

  async sendPasswordResetEmail(to: string, resetUrl: string) {
    const from = this.sender
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
