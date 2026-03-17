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
        &larr; Back to plotamour
      </Link>

      <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: March 17, 2026
      </p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using plotamour (&quot;the Service&quot;), operated
            by Kevin Buckley, you agree to be bound by these Terms of Service
            and our{" "}
            <Link
              href="/privacy"
              className="text-primary underline hover:no-underline"
            >
              Privacy Policy
            </Link>
            . If you do not agree to these terms, please do not use the
            Service.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            2. Description of Service
          </h2>
          <p>
            plotamour is a free visual story planning application designed for
            novelists. The Service allows you to create and manage projects,
            books, chapters, scenes, characters, places, plotlines, notes, and
            tags. It also offers integration with Google Docs for writing
            scenes and the ability to import projects from other planning tools
            such as Plottr.
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
            <li>You must be at least 13 years old to use the Service.</li>
            <li>
              We reserve the right to refuse service, terminate accounts, or
              remove content at our sole discretion.
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
              import into plotamour, including stories, characters, outlines,
              and any other creative material.
            </li>
            <li>
              By using the Service, you grant us a limited, non-exclusive,
              royalty-free license to store, display, and process your content
              solely for the purpose of providing the Service to you.
            </li>
            <li>
              We will not use your content for any other purpose, including
              training AI models, marketing, or sharing with third parties,
              without your explicit consent.
            </li>
            <li>
              You are responsible for ensuring that your content does not
              infringe on the intellectual property rights of others.
            </li>
            <li>
              You may export or delete your content at any time. Upon account
              deletion, all your content will be permanently removed within 30
              days.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            5. Google Docs Integration
          </h2>
          <ul className="ml-4 list-disc space-y-1.5">
            <li>
              The Google Docs integration feature creates and manages Google
              Docs in your Google Drive on your behalf only when you explicitly
              initiate it by clicking a button.
            </li>
            <li>
              plotamour&apos;s use of Google APIs complies with the{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:no-underline"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
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
              We only store references (document IDs and URLs) to those
              documents.
            </li>
            <li>
              We are not responsible for any changes Google makes to their APIs,
              terms, or services that may affect the Google Docs integration.
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
              systems or networks.
            </li>
            <li>
              Interfere with or disrupt the integrity or performance of the
              Service.
            </li>
            <li>
              Upload malicious code, viruses, or any other harmful content.
            </li>
            <li>Use the Service to harass, abuse, or harm others.</li>
            <li>
              Use automated means (bots, scrapers) to access the Service
              without our written permission.
            </li>
            <li>
              Reverse engineer, decompile, or attempt to extract the source
              code of the Service (except where permitted by applicable law or
              open-source licenses).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            7. Fees and Payment
          </h2>
          <p>
            plotamour is currently offered free of charge. We reserve the right
            to introduce paid features or subscription plans in the future. If
            we do, we will provide advance notice and existing free features
            will not be removed without reasonable notice.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            8. Service Availability
          </h2>
          <p>
            We strive to keep plotamour available at all times, but we do not
            guarantee uninterrupted or error-free access. The Service may be
            temporarily unavailable due to maintenance, updates, or
            circumstances beyond our control. We are not liable for any loss or
            damage resulting from service interruptions.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            9. Data and Backups
          </h2>
          <p>
            While we take reasonable measures to protect your data (including
            encryption at rest and in transit, and row-level security), we
            recommend that you maintain your own backups of important content.
            We are not responsible for any loss of data due to system failures,
            security breaches, or other unforeseen events. You may export your
            data from the Service at any time.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            10. Intellectual Property
          </h2>
          <p>
            The Service itself (including its design, code, logos, and
            documentation) is the property of Kevin Buckley and is protected by
            applicable intellectual property laws. The plotamour source code is
            available under the terms of its{" "}
            <a
              href="https://github.com/kevinbuckley/plotamour"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:no-underline"
            >
              open-source license
            </a>
            . Your content remains yours as described in Section 4.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            11. Disclaimer of Warranties
          </h2>
          <p>
            The Service is provided &quot;as is&quot; and &quot;as
            available&quot; without warranties of any kind, either express or
            implied, including but not limited to implied warranties of
            merchantability, fitness for a particular purpose, and
            non-infringement. We do not warrant that the Service will be
            error-free, secure, or available at any particular time or
            location.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            12. Limitation of Liability
          </h2>
          <p>
            To the fullest extent permitted by applicable law, plotamour and
            its operator shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages, or any loss of
            profits, revenues, data, use, goodwill, or other intangible losses
            resulting from (a) your use or inability to use the Service; (b)
            unauthorized access to or alteration of your data; (c) any
            third-party conduct on the Service; or (d) any other matter
            relating to the Service.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            13. Indemnification
          </h2>
          <p>
            You agree to indemnify, defend, and hold harmless plotamour and its
            operator from and against any claims, liabilities, damages, losses,
            and expenses (including reasonable legal fees) arising out of or in
            any way connected with your use of the Service, your content, or
            your violation of these Terms.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            14. Account Termination
          </h2>
          <p>
            We reserve the right to suspend or terminate your access to the
            Service at any time for violation of these terms or for any other
            reason at our discretion, with or without notice. You may also
            delete your account at any time by contacting us. Upon
            termination, your right to use the Service will immediately cease,
            and we will delete your data within 30 days unless retention is
            required by law.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            15. Changes to These Terms
          </h2>
          <p>
            We may modify these Terms of Service at any time. We will notify
            users of material changes by posting the updated terms on this page
            with a revised &quot;Last updated&quot; date. Your continued use of
            the Service after changes are posted constitutes your acceptance of
            the revised terms. If you do not agree with the updated terms, you
            should stop using the Service.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            16. Governing Law
          </h2>
          <p>
            These Terms shall be governed by and construed in accordance with
            the laws of the State of California, United States, without regard
            to its conflict of law provisions. Any disputes arising under these
            Terms will be subject to the exclusive jurisdiction of the courts
            located in the State of California.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            17. Severability
          </h2>
          <p>
            If any provision of these Terms is found to be unenforceable or
            invalid, that provision will be limited or eliminated to the
            minimum extent necessary so that the remaining provisions will
            remain in full force and effect.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            18. Entire Agreement
          </h2>
          <p>
            These Terms, together with the Privacy Policy, constitute the
            entire agreement between you and plotamour regarding the use of the
            Service and supersede all prior agreements, understandings, and
            communications.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            19. Contact Us
          </h2>
          <p>
            If you have any questions about these Terms of Service, please
            contact us at:{" "}
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
