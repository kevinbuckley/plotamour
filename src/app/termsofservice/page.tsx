import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — plotamour",
  description: "Terms of service for plotamour, a visual story planning tool.",
};

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/"
        className="mb-8 inline-block text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Back to plotamour
      </Link>

      <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: March 5, 2026
      </p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using plotamour (&quot;the Service&quot;), you agree
            to be bound by these Terms of Service. If you do not agree to these
            terms, please do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            2. Description of Service
          </h2>
          <p>
            plotamour is a visual story planning application designed for
            novelists. The Service allows you to create and manage projects,
            books, chapters, scenes, characters, places, plotlines, notes, and
            tags. It also offers integration with Google Docs for writing scenes
            and the ability to import projects from other planning tools.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            3. Account and Authentication
          </h2>
          <ul className="ml-4 list-disc space-y-1.5">
            <li>
              You must sign in using a valid Google account to use the Service.
            </li>
            <li>
              You are responsible for maintaining the security of your Google
              account credentials.
            </li>
            <li>
              You are responsible for all activity that occurs under your
              account.
            </li>
            <li>
              You must be at least 13 years old to use the Service.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            4. Your Content
          </h2>
          <ul className="ml-4 list-disc space-y-1.5">
            <li>
              You retain full ownership of all content you create, upload, or
              import into plotamour, including stories, characters, outlines, and
              any other creative material.
            </li>
            <li>
              By using the Service, you grant us a limited license to store,
              display, and process your content solely for the purpose of
              providing the Service to you.
            </li>
            <li>
              We will not use your content for any other purpose, including
              training AI models, without your explicit consent.
            </li>
            <li>
              You are responsible for ensuring that your content does not
              infringe on the intellectual property rights of others.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            5. Google Docs Integration
          </h2>
          <ul className="ml-4 list-disc space-y-1.5">
            <li>
              The Google Docs integration feature creates and manages Google Docs
              in your Google Drive on your behalf.
            </li>
            <li>
              You may revoke plotamour&apos;s access to your Google account at
              any time through your{" "}
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
            <li>
              Documents created through the integration are stored in your own
              Google Drive and are subject to Google&apos;s terms of service.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            6. Acceptable Use
          </h2>
          <p className="mb-2">You agree not to:</p>
          <ul className="ml-4 list-disc space-y-1.5">
            <li>
              Use the Service for any unlawful purpose or in violation of any
              applicable laws.
            </li>
            <li>
              Attempt to gain unauthorized access to the Service or its related
              systems.
            </li>
            <li>
              Interfere with or disrupt the integrity or performance of the
              Service.
            </li>
            <li>
              Upload malicious code, viruses, or any other harmful content.
            </li>
            <li>
              Use the Service to harass, abuse, or harm others.
            </li>
            <li>
              Reverse engineer, decompile, or attempt to extract the source code
              of the Service (except where permitted by law).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            7. Service Availability
          </h2>
          <p>
            We strive to keep plotamour available at all times, but we do not
            guarantee uninterrupted access. The Service may be temporarily
            unavailable due to maintenance, updates, or circumstances beyond our
            control. We are not liable for any loss or damage resulting from
            service interruptions.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            8. Data and Backups
          </h2>
          <p>
            While we take reasonable measures to protect your data, we recommend
            that you maintain your own backups of important content. We are not
            responsible for any loss of data due to system failures or other
            unforeseen events. You may export your data from the Service at any
            time.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            9. Disclaimer of Warranties
          </h2>
          <p>
            The Service is provided &quot;as is&quot; and &quot;as
            available&quot; without warranties of any kind, either express or
            implied, including but not limited to implied warranties of
            merchantability, fitness for a particular purpose, and
            non-infringement. We do not warrant that the Service will be
            error-free, secure, or available at any particular time.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            10. Limitation of Liability
          </h2>
          <p>
            To the fullest extent permitted by law, plotamour and its operators
            shall not be liable for any indirect, incidental, special,
            consequential, or punitive damages, or any loss of profits or
            revenues, whether incurred directly or indirectly, or any loss of
            data, use, goodwill, or other intangible losses resulting from your
            use of the Service.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            11. Account Termination
          </h2>
          <p>
            We reserve the right to suspend or terminate your access to the
            Service at any time for violation of these terms or for any other
            reason at our discretion. You may also delete your account at any
            time. Upon termination, your right to use the Service will
            immediately cease.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            12. Changes to These Terms
          </h2>
          <p>
            We may modify these Terms of Service at any time. We will notify
            users of material changes by posting the updated terms on this page
            with a revised &quot;Last updated&quot; date. Your continued use of
            the Service after changes are posted constitutes your acceptance of
            the revised terms.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            13. Privacy
          </h2>
          <p>
            Your use of the Service is also governed by our{" "}
            <Link
              href="/privacy"
              className="text-primary underline hover:no-underline"
            >
              Privacy Policy
            </Link>
            , which describes how we collect, use, and protect your personal
            information.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            14. Contact Us
          </h2>
          <p>
            If you have any questions about these Terms of Service, please
            contact us through our application.
          </p>
        </section>
      </div>
    </div>
  );
}
