export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Cookie Policy</h1>
        <p className="text-sm text-neutral-400 mb-10">Last updated: June 2026</p>

        <div className="space-y-8 text-neutral-600 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">1. What are cookies</h2>
            <p>Cookies are small text files stored on your device when you visit a website. They help the site remember information about your visit, such as whether you are logged in.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">2. How we use cookies</h2>
            <p>Torvionyx uses cookies for the following purposes:</p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li><strong>Essential cookies</strong> — required for authentication and to keep you logged in.</li>
              <li><strong>Preference cookies</strong> — used to remember your theme preference (light or dark mode).</li>
              <li><strong>Security cookies</strong> — used by Clerk to protect your account and prevent unauthorised access.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">3. Third-party cookies</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Clerk</strong> — sets cookies to manage your authentication session</li>
              <li><strong>Termly</strong> — sets cookies to remember your cookie consent preferences</li>
              <li><strong>Vercel</strong> — may set cookies for performance and routing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">4. What we do not use cookies for</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>We do not use advertising or tracking cookies</li>
              <li>We do not sell cookie data to third parties</li>
              <li>We do not use cookies to build advertising profiles</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">5. Managing your cookie preferences</h2>
            <p>You can update your cookie preferences at any time by clicking the <strong>Consent Preferences</strong> link in the footer of our website.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">6. Cookie list</h2>
            <div className="overflow-x-auto rounded-lg border border-neutral-200 mt-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="px-4 py-3 text-left font-medium text-neutral-500">Cookie</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500">Provider</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500">Purpose</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-500">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: '__session', provider: 'Clerk', purpose: 'Authentication session', type: 'Essential' },
                    { name: '__client_uat', provider: 'Clerk', purpose: 'User authentication token', type: 'Essential' },
                    { name: 'theme', provider: 'Torvionyx', purpose: 'Dark/light mode preference', type: 'Preference' },
                    { name: 'termly-api-cache', provider: 'Termly', purpose: 'Cookie consent preferences', type: 'Preference' },
                  ].map((cookie, i) => (
                    <tr key={i} className="border-b border-neutral-100 last:border-0">
                      <td className="px-4 py-3 font-mono text-xs text-neutral-700">{cookie.name}</td>
                      <td className="px-4 py-3 text-neutral-500">{cookie.provider}</td>
                      <td className="px-4 py-3 text-neutral-500">{cookie.purpose}</td>
                      <td className="px-4 py-3 text-neutral-500">{cookie.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">7. Contact</h2>
            <p>For any questions about our use of cookies, contact us at <a href="mailto:torvionyx@gmail.com" className="text-cyan-600 hover:underline">torvionyx@gmail.com</a>.</p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-neutral-100">
          <a href="/" className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors">← Back to Torvionyx</a>
        </div>
      </div>
    </div>
  );
}