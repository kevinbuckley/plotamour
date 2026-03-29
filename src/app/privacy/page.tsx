import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — plotamour",
  description: "Privacy policy for plotamour, a visual story planning tool.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-16">
      <Link
        href="/"
        className="mb-8 inline-block text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        &larr; Back to plotamour
      </Link>

      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: March 17, 2026
      </p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            1. Introduction
          </h2>
          <p>
            plotamour (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is a
            visual story planning application for novelists, operated by Kevin
            Buckley. This Privacy Policy explains how we collect, use, store,
            and protect your personal information when you use our service at
            plotamour.com (the &quot;Service&quot;). By using the Service you
            agree to the practices described in this policy.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            2. Information We Collect
          </h2>
          <p className="mb-2">We collect the following types of information:</p>
          <ul className="ml-4 list-disc space-y-1.5">
            <li>
              <strong className="text-foreground">Account information:</strong>{" "}
              When you sign in with Google, we receive your name, email address,
              and profile picture from your Google account.
            </li>
            <li>
              <strong className="text-foreground">
                Story and project data:
              </strong>{" "}
              Content you create within plotamour, including projects, books,
              chapters, scenes, characters, places, notes, tags, and plotlines.
            </li>
            <li>
              <strong className="text-foreground">
                Google Docs integration data:
              </strong>{" "}
              When you use the &quot;Write in Google Docs&quot; feature, we
              store a reference to the Google Doc (document ID and URL) linked
              to your scenes. We also store an encrypted OAuth refresh token to
              maintain access to your Google Docs on your behalf.
            </li>
            <li>
              <strong className="text-foreground">Imported data:</strong> If you
              import a file from Plottr or another tool, we process and store
              the imported content as part of your project.
            </li>
            <li>
              <strong className="text-foreground">Usage data:</strong> We
              collect basic server logs (IP address, browser type, pages
              visited) for security and debugging purposes. We do not use
              third-party analytics or advertising trackers.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            3. How We Use Your Information
          </h2>
          <p className="mb-2">We use your information solely to:</p>
          <ul className="ml-4 list-disc space-y-1.5">
            <li>Provide, operate, and maintain the plotamour service.</li>
            <li>Authenticate your identity via Google Sign-In.</li>
            <li>
              Create and manage Google Docs on your behalf when you explicitly
              use the Google Docs integration.
            </li>
            <li>Store and display your story planning data.</li>
            <li>Respond to support requests and communicate with you about the Service.</li>
            <li>Detect, prevent, and address technical issues or security threats.</li>
          </ul>
          <p className="mt-2">
            We do <strong className="text-foreground">not</strong> use your
            data for advertising, profiling, or training AI models.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            4. Google API Services &mdash; Limited Use Disclosure
          </h2>
          <p>
            plotamour uses Google API Services to enable sign-in and Google Docs
            integration. Our use and transfer to any other app of information
            received from Google APIs will adhere to the{" "}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:no-underline"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements.
          </p>
          <p className="mt-2">Specifically, plotamour:</p>
          <ul className="ml-4 mt-2 list-disc space-y-1.5">
            <li>
              Only requests the minimum OAuth scopes necessary to provide
              functionality you initiate:{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">
                auth/documents
              </code>{" "}
              (to create and edit Google Docs for your scenes) and{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">
                auth/drive.file
              </code>{" "}
              (to manage only the Drive files created by the app).
            </li>
            <li>
              Does <strong className="text-foreground">not</strong> use Google
              user data for serving advertisements.
            </li>
            <li>
              Does <strong className="text-foreground">not</strong> allow
              humans to read your Google data unless you give affirmative
              consent for specific messages, it is necessary for security
              purposes, it is required by law, or the data is aggregated and
              anonymized for internal operations.
            </li>
            <li>
              Does <strong className="text-foreground">not</strong> transfer
              Google user data to third parties except as necessary to provide
              or improve the Service (e.g., our hosting providers), with your
              consent, or for legal reasons.
            </li>
            <li>
              Only accesses your Google Docs when you explicitly click the
              &quot;Write in Google Docs&quot; button &mdash; we never access
              your documents in the background.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            5. Data Storage, Security, and Retention
          </h2>
          <p>
            Your data is stored securely using{" "}
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:no-underline"
            >
              Supabase
            </a>{" "}
            (database and authentication) and served via{" "}
            <a
              href="https://vercel.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:no-underline"
            >
              Vercel
            </a>{" "}
            (application hosting). Both providers encrypt data in transit
            (TLS) and at rest.
          </p>
          <ul className="ml-4 mt-2 list-disc space-y-1.5">
            <li>
              Row-level security policies ensure that only you can access your
              own projects and data.
            </li>
            <li>
              Google OAuth refresh tokens are stored in a secure database
              column and are only used server-side to obtain short-lived access
              tokens on your behalf.
            </li>
            <li>
              We retain your data for as long as your account is active. If you
              delete your account, all associated data (projects, scenes, tokens,
              etc.) will be permanently deleted within 30 days.
            </li>
            <li>
              Server logs are retained for no more than 90 days and are used
              only for debugging and security purposes.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            6. Data Sharing
          </h2>
          <p>
            We do not sell, rent, trade, or share your personal information
            with third parties for their own marketing purposes. We only share
            data in the following limited circumstances:
          </p>
          <ul className="ml-4 mt-2 list-disc space-y-1.5">
            <li>
              <strong className="text-foreground">Service providers:</strong>{" "}
              We use Supabase for database hosting and authentication, and
              Vercel for application hosting. These providers process your data
              solely to provide their services to us and are bound by their own
              privacy policies.
            </li>
            <li>
              <strong className="text-foreground">Legal requirements:</strong>{" "}
              We may disclose information if required by law, subpoena, court
              order, or governmental regulation, or to protect the rights,
              safety, or property of our users or the public.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            7. Your Rights and Choices
          </h2>
          <p>You have the right to:</p>
          <ul className="ml-4 mt-2 list-disc space-y-1.5">
            <li>
              <strong className="text-foreground">Access</strong> the personal
              data we hold about you by contacting us.
            </li>
            <li>
              <strong className="text-foreground">Delete</strong> your account
              and all associated data by contacting us at the email below. All
              data will be permanently removed within 30 days.
            </li>
            <li>
              <strong className="text-foreground">Revoke Google access</strong>{" "}
              at any time through your{" "}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:no-underline"
              >
                Google Account permissions
              </a>
              . This will prevent the app from creating new Google Docs on your
              behalf. Your existing plotamour project data will remain
              accessible, but the Google Docs integration will stop working
              until you re-authorize.
            </li>
            <li>
              <strong className="text-foreground">Export</strong> your data
              from the application at any time.
            </li>
            <li>
              <strong className="text-foreground">Correct</strong> inaccurate
              data by editing it directly within the application or by
              contacting us.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            8. Cookies
          </h2>
          <p>
            We use only essential cookies for authentication and session
            management. We do not use advertising, tracking, or analytics
            cookies. No third-party cookies are set by our Service.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            9. Children&apos;s Privacy
          </h2>
          <p>
            plotamour is not directed at children under 13. We do not knowingly
            collect personal information from children under 13. If we become
            aware that we have collected such information, we will promptly
            delete the account and associated data.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            10. International Data Transfers
          </h2>
          <p>
            Your data may be processed in the United States or other countries
            where our service providers operate. By using the Service, you
            consent to the transfer of your data to these locations. We ensure
            that appropriate safeguards are in place through our providers&apos;
            data processing agreements.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            11. Changes to This Policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify
            users of any material changes by posting the updated policy on this
            page with a revised &quot;Last updated&quot; date. Your continued
            use of the Service after changes are posted constitutes your
            acceptance of the revised policy.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            12. Contact Us
          </h2>
          <p>
            If you have any questions about this Privacy Policy, wish to
            exercise your data rights, or have concerns about how your data is
            handled, please contact us at:{" "}
            <a
              href="mailto:kbuckley17@gmail.com"
              className="text-primary underline hover:no-underline"
            >
              kbuckley17@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
