

## Plan: Google-only login for your admin account

Since this project runs on Lovable Cloud, Google OAuth is managed automatically — no extra configuration needed.

### Changes

1. **Configure Social Auth** — Use the Configure Social Login tool to generate the Lovable Cloud Google auth module.

2. **Update `src/pages/Auth.tsx`** — Replace the email/password form with a single "Sign in with Google" button using `lovable.auth.signInWithOAuth("google")`. Remove email/password fields entirely.

3. **Restrict to your account** — Since registration is already disabled and your account (`tobiasssandberg@gmail.com`) already has the admin role in `user_roles`, no one else can gain access even if they sign in with Google. The existing RLS policies and role checks will block unauthorized users.

4. **Optionally lock to your domain** — We can pass `hd` and `login_hint` params to Google to pre-fill your email and restrict to your domain:
   ```typescript
   lovable.auth.signInWithOAuth("google", {
     redirect_uri: window.location.origin,
     extraParams: { login_hint: "tobiasssandberg@gmail.com" }
   });
   ```

5. **Remove MFA verification** — Since Google handles 2FA on their end, the TOTP MFA flow (`/mfa-verify`, `MfaEnroll`) becomes redundant and can be removed or kept as optional.

### Security

- Admin access still enforced by `user_roles` table + `has_role()` function + RLS policies
- Google provides its own 2FA/security layer
- No new users can register (registration is disabled)

