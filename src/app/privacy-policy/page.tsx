export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-neutral-400 mb-10">Last updated: June 2026</p>

        <div className="space-y-8 text-neutral-600 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">1. Who we are</h2>
            <p>Torvionyx is a proposal generation tool for freelancers and consultants. We are based in the United Kingdom. If you have any questions about this policy, contact us at torvionyx@gmail.com.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">2. What data we collect</h2>
            <p>We collect the following data when you use Torvionyx:</p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>Your email address and name (via Clerk authentication)</li>
              <li>Proposal content you create using our tool</li>
              <li>Brand settings you configure (company name, logo URL, colours, fonts)</li>
              <li>Usage data such as when proposals are viewed or accepted</li>
              <li>Hashed IP addresses for security and abuse prevention</li>
              <li>Cookies required for authentication and basic site function</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">3. How we use your data</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To provide and operate the Torvionyx service</li>
              <li>To generate AI-powered proposals on your behalf</li>
              <li>To send transactional emails (e.g. proposal viewed, proposal accepted)</li>
              <li>To monitor for abuse and enforce our terms of service</li>
              <li>To improve the product based on usage patterns</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">4. Your proposal content</h2>
            <p>You own 100% of the proposals you create. We do not use your proposal content to train AI models, sell to third parties, or share with anyone outside of what is required to operate the service (e.g. storing in our database, processing via the Anthropic API to generate content).</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">5. Third-party services</h2>
            <p>We use the following third-party services to operate Torvionyx:</p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li><strong>Clerk</strong> — authentication and user management</li>
              <li><strong>Supabase</strong> — database and data storage</li>
              <li><strong>Anthropic</strong> — AI proposal generation (your brief is sent to their API)</li>
              <li><strong>Resend</strong> — transactional email delivery</li>
              <li><strong>Vercel</strong> — hosting and infrastructure</li>
            </ul>
            <p className="mt-3">Each of these providers has their own privacy policy and data processing terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">6. Data retention</h2>
            <p>We retain your data for as long as your account is active. If you delete your account, your proposals and personal data will be deleted within 30 days.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">7. Your rights (UK GDPR)</h2>
            <p>Under UK GDPR you have the right to:</p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to or restrict processing of your data</li>
              <li>Data portability</li>
            </ul>
            <p className="mt-3">To exercise any of these rights, email us at torvionyx@gmail.com.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">8. Cookies</h2>
            <p>We use essential cookies for authentication and site function. We also use Termly to manage cookie consent. You can update your cookie preferences at any time using the Consent Preferences link in our footer.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">9. Changes to this policy</h2>
            <p>We may update this policy from time to time. We will notify you of significant changes by email or by posting a notice on the site.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">10. Contact</h2>
            <p>For any privacy-related questions, contact us at <a href="mailto:torvionyx@gmail.com" className="text-cyan-600 hover:underline">torvionyx@gmail.com</a>.</p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-neutral-100">
          <a href="/" className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors">← Back to Torvionyx</a>
        </div>
      </div>
    </div>
  );
}