# Maeve email templates

Brand-matched replacements for Supabase's default auth emails.

These are **not** applied by a migration or a deploy. Supabase stores email
templates in its own dashboard, so they have to be pasted in by hand. That also
means they are the one part of this project not under version control on the live
project: if someone edits a template in the dashboard, this folder will not know.
**If you change an email, change it here too**, or the next person will paste a
stale version over your work.

## You need custom SMTP first

**Supabase will not let you edit these templates until a custom SMTP server is
configured.** If you try, the dashboard tells you to enable SMTP.

This is not a limitation to route around, it is deliberate. Supabase's built-in
email service sends from a shared Supabase domain. Letting any project put
arbitrary HTML in a message sent from a shared sender would make it a
ready-made phishing tool. Owning the sender is the price of customising the
message. Supabase's own docs also describe the built-in service as rate limited
and best-effort, not for production.

So configuring SMTP is required for branded email, and is something you need
before real users regardless. See "Setting up SMTP" below.

## How to apply them

Once SMTP is configured: Supabase dashboard, **Authentication**, **Emails**, pick
the template, switch the editor to the **source / HTML** view, delete what is
there, paste the file's contents, Save.

| File | Supabase template | Used by |
| --- | --- | --- |
| `confirm-signup.html` | Confirm signup | Every new account, while "Confirm email" is on |
| `magic-link.html` | Magic Link | The "email me a magic link" button on login and signup |
| `reset-password.html` | Reset Password | Password recovery |
| `change-email.html` | Change Email Address | The Account tab's change-email flow |

There is a fifth Supabase template, **Invite user**, which Maeve does not use.
Partner pairing works through Maeve's own invite codes and the
`connect_with_code` function, not Supabase invites. Leave it alone.

Subject lines are set in a separate field above the body in the dashboard.
Suggested bilingual subjects:

| Template | Subject |
| --- | --- |
| Confirm signup | `Confirm your email / Confirmez votre courriel` |
| Magic Link | `Your link to sign in / Votre lien de connexion` |
| Reset Password | `Reset your password / Réinitialisez votre mot de passe` |
| Change Email Address | `Confirm your new email / Confirmez votre nouveau courriel` |

## Why every email is bilingual

Supabase's auth server sends these, and it does not know which language the
person picked in the app. There is no language variable available in a template,
so a template cannot branch on it.

Rather than mail everyone in English and hope, each template says everything
twice: English first, then a divider, then French. This is the normal pattern for
bilingual Canadian organisations and it means nobody gets an email they cannot
read.

If Maeve ever needs single-language emails, that means moving auth emails out of
Supabase and onto a provider you send yourself (Resend, Postmark, Brevo) via a
webhook, so you can read the user's language from `profiles` before sending. That
is a real project, not a settings change. Do not start it to save a scroll.

## Design notes, if you edit these

Email HTML is not web HTML. It is 1999 and you are writing tables.

- **Tables for layout, inline styles only.** No flexbox, no grid, no `<style>`
  block, no external CSS. Outlook still uses Word to render mail.
- **No web fonts.** Maeve uses Fraunces and Inter, and neither will load in most
  mail clients. These templates use Georgia as the serif stand-in for Fraunces
  and the system sans stack for Inter. That is deliberate, not an oversight.
- **The buttons are table cells**, not styled `<a>` tags with a background. That
  is the "bulletproof button" pattern and it is what makes the pill shape survive
  Outlook.
- **Brand colours**, matching `src/app/globals.css`: plum `#2b1b3d`, ink
  `#1a0f2a`, berry `#c2185b`, muted text `#5a4a72`, faint text `#9090aa`, border
  `#e8e0f0`, cream background `#fafaf9`.
- **No em dashes**, same as everywhere else in Maeve.
- Every template ends with the reminder that Maeve is a companion and not
  medical care. Keep it. It belongs in anything that reaches someone mid-IVF.

## Supabase template variables

Only these are available. `{{ .ConfirmationURL }}` is the one that matters; it is
the link that actually does the thing.

- `{{ .ConfirmationURL }}` the action link
- `{{ .Token }}` the 6 digit code, if you want a code instead of a link
- `{{ .TokenHash }}` hashed token
- `{{ .SiteURL }}` your site URL
- `{{ .Email }}` the current address
- `{{ .NewEmail }}` the new address, change-email template only

## Setting up SMTP

This is a prerequisite for everything above, and it needs a decision that is not
purely technical.

**You cannot send from `maeve-app-two.vercel.app`.** Sending email as a domain
requires DNS records (SPF and DKIM) that prove you are allowed to, and nobody can
add DNS records to a `vercel.app` subdomain. So the sending domain has to be a
domain Maeve or Maman actually owns.

Two options:

1. **Send from `mamanbiomedical.ca`**, for example `maeve@mamanbiomedical.ca` or
   `hello@mamanbiomedical.ca`. Works today, and needs DNS access to that domain.
   The tradeoff is that Maeve's auth email arrives branded as Maman.
2. **Register a Maeve domain**, for example `maevebymaman.com`. Better long term:
   it gives Maeve a real address instead of a `.vercel.app` URL, and the same
   domain then serves both the site and the email. This is the direction to go if
   Maeve is a product rather than an experiment.

Either way, the steps are the same:

1. Pick a provider. Resend, Postmark, Brevo, SendGrid, and AWS SES all work. For
   a project this size any of them is fine and most have a free tier that covers
   early volume.
2. Verify the sending domain in that provider, which means adding the SPF and
   DKIM DNS records it gives you. **Until the domain is verified, mail either
   does not send or lands in spam.** This is the step that actually takes time,
   because DNS changes are not instant.
3. Put the provider's SMTP host, port, user, and password into Supabase,
   **Project Settings, Authentication, SMTP Settings**, along with the sender
   address and sender name (`Maeve by Maman` is the obvious choice).
4. Now the templates above become editable.

**Use the client's own provider account, not a DigitalFlow one.** Same reasoning
as the Anthropic key: the billing, the domain reputation, and the deliverability
history should belong to Maeve from day one. A sending domain's reputation is
built over years and is not transferable.
