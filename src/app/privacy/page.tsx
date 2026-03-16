import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — plotamour",
  description: "Privacy policy for plotamour, a visual story planning tool.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/"
        className="mb-8 inline-block text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Back to plotamour
      </Link>

      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: March 5, 2026
      </p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            1. Introduction
          </h2>
          <p>
            plotamour (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is a
            visual story planning application for novelists. This Privacy Policy
            explains how we collect, use, and protect your personal information
            when you use our service at www.plotamour.com.
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
              store a reference to the Google Doc (document ID and URL) linked to
              your scenes. We also store an OAuth refresh token to maintain
              access to your Google Docs on your behalf.
            </li>
            <li>
              <strong className="text-foreground">Imported data:</strong> If you
              import a file from Plottr or another tool, we process and store the
              imported content as part of your project.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            3. How We Use Your Information
          </h2>
          <ul className="ml-4 list-disc space-y-1.5">
            <li>To provide and operate the plotamour service.</li>
            <li>To authenticate your identity via Google Sign-In.</li>
            <li>
              To create and manage Google Docs on your behalf when you use the
              Google Docs integration.
            </li>
            <li>To store and display your story planning data.</li>
            <li>To improve and maintain the service.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            4. Google API Services
          </h2>
          <p>
            plotamour uses Google API Services to enable sign-in and Google Docs
            integration. Our use and transfer of information received from Google
            APIs adheres to the{" "}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:no-underline"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements. We only request the
            minimum scopes necessary to provide our features:
          </p>
          <ul className="ml-4 mt-2 list-disc space-y-1.5">
            <li>
              <strong className="text-foreground">Google Sign-In:</strong> To
              authenticate your identity.
            </li>
            <li>
              <strong className="text-foreground">Google Docs API:</strong> To
              create and manage documents linked to your scenes.
            </li>
            <li>
              <strong className="text-foreground">Google Drive API:</strong> To
              organize your created documents in a dedicated folder.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            5. Data Storage and Security
          </h2>
          <p>
            Your data is stored securely using Supabase, which provides
            encryption at rest and in transit. We implement row-level security
            policies to ensure that your data is only accessible to you. Google
            OAuth tokens are stored securely and are only used to interact with
            Google services on your behalf.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            6. Data Sharing
          </h2>
          <p>
            We do not sell, trade, or share your personal information with third
            parties except in the following cases:
          </p>
          <ul className="ml-4 mt-2 list-disc space-y-1.5">
            <li>
              <strong className="text-foreground">Service providers:</strong> We
              use Supabase for database hosting and authentication, and Vercel
              for application hosting. These providers may process your data as
              part of providing their services.
            </li>
            <li>
              <strong className="text-foreground">Legal requirements:</strong>{" "}
              We may disclose information if required by law or in response to
              valid legal processes.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            7. Your Rights
          </h2>
          <p>You have the right to:</p>
          <ul className="ml-4 mt-2 list-disc space-y-1.5">
            <li>Access the personal data we hold about you.</li>
            <li>Request deletion of your account and associated data.</li>
            <li>
              Revoke Google API access at any time through your{" "}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:no-underline"
              >
                Google Account permissions
              </a>
              .
            </li>
            <li>Export your data from the application.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            8. Cookies
          </h2>
          <p>
            We use essential cookies for authentication and session management.
            We do not use advertising or tracking cookies.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            9. Children&apos;s Privacy
          </h2>
          <p>
            plotamour is not directed at children under 13. We do not knowingly
            collect personal information from children under 13. If we become
            aware that we have collected such information, we will take steps to
            delete it.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            10. Changes to This Policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify
            users of any material changes by posting the updated policy on this
            page with a revised &quot;Last updated&quot; date.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            11. Contact Us
          </h2>
          <p>
            If you have any questions about this Privacy Policy or our data
            practices, please contact us through our application.
          </p>
        </section>
      </div>
    </div>
  );
}
