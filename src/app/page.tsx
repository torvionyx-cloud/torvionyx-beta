'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

const FadeInSection = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

const StaggerContainer = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{ visible: { transition: { staggerChildren: 0.15, delayChildren: delay } } }}
    >
      {children}
    </motion.div>
  );
};

const StaggerItem = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
    transition={{ duration: 0.6 }}
  >
    {children}
  </motion.div>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 w-full bg-slate-950/80 backdrop-blur z-50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center font-bold text-slate-950">T</div>
            <span className="text-xl font-bold">Torvionyx</span>
          </motion.div>
          <motion.a href="/sign-up" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold rounded-lg transition-colors">
            Start Free →
          </motion.a>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <FadeInSection>
            <div className="inline-block px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 mb-8">
              <span className="text-sm text-cyan-400">Now in beta · Free to join</span>
            </div>
          </FadeInSection>
          <FadeInSection>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Turn a Brief Into a <span className="text-cyan-400">Beautiful Proposal</span> in Under 2 Minutes
            </h1>
          </FadeInSection>
          <FadeInSection>
            <p className="text-lg md:text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
              Freelancers and consultants spend hours writing proposals. Torvionyx writes them for you in 60 seconds. You polish it. You send it. You win the work.
            </p>
          </FadeInSection>
          <FadeInSection>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <a href="/sign-up" className="px-8 py-4 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold rounded-lg transition-colors text-center">Start Free — No credit card</a>
              <a href="/sign-in" className="px-8 py-4 border border-slate-700 hover:border-slate-600 text-white font-bold rounded-lg transition-colors text-center">Sign In</a>
            </div>
            <p className="text-sm text-slate-500">Takes 2 minutes to set up.</p>
          </FadeInSection>
        </div>
      </section>

      {/* Problem */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="max-w-4xl mx-auto">
          <FadeInSection><h2 className="text-4xl md:text-5xl font-bold mb-12 text-center">The Problem</h2></FadeInSection>
          <StaggerContainer>
            {[
              { title: 'Proposals take longer than the actual work', desc: 'You have just had a great call with a potential client. They are interested. But now you face 2-4 hours of proposal writing.' },
              { title: 'You lose momentum', desc: 'By the time you send it, the momentum from the call is gone. They have forgotten the call.' },
              { title: 'Your proposals compete on design, not substance', desc: 'Your competitor sends a proposal that looks more polished. You lose the deal.' },
              { title: 'Writing the same thing over and over is soul-crushing', desc: 'Every proposal starts from scratch. No templates. No shortcuts. Just repetition.' },
            ].map((item, idx) => (
              <StaggerItem key={idx}>
                <div className="mb-8 pb-8 border-b border-slate-800">
                  <h3 className="text-2xl font-bold text-cyan-400 mb-3">{item.title}</h3>
                  <p className="text-slate-400">{item.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <FadeInSection><h2 className="text-4xl md:text-5xl font-bold mb-16 text-center">How Torvionyx Works</h2></FadeInSection>
          <StaggerContainer>
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { num: '1', title: 'Paste your brief', desc: 'Paste your call notes, scope, client goals. Anything rough. 20 sentences. 100 words. Doesnt matter.' },
                { num: '2', title: 'Hit generate', desc: 'Torvionyx writes a complete proposal. Beautiful. Professional. Yours. 60 seconds. One button. Done.' },
                { num: '3', title: 'Light edit & send', desc: 'You edit for specifics. Then share the live link with your client. No PDFs. No attachments.' },
                { num: '4', title: 'Get notified', desc: 'Your client opens it. You get an email. They accept. You get another email. Momentum stays alive.' },
              ].map((step, idx) => (
                <StaggerItem key={idx}>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-cyan-400 mb-4">{step.num}</div>
                    <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                    <p className="text-slate-400">{step.desc}</p>
                  </div>
                </StaggerItem>
              ))}
            </div>
          </StaggerContainer>
        </div>
      </section>

      {/* Dashboard Showcase */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <FadeInSection><h2 className="text-4xl md:text-5xl font-bold mb-12 text-center">See It In Action</h2></FadeInSection>
          <FadeInSection>
            <motion.div className="relative rounded-2xl overflow-hidden shadow-2xl" whileHover={{ scale: 1.02 }} transition={{ duration: 0.3 }}>
              <img src="/dashboard-screenshot.png" alt="Torvionyx Dashboard" style={{ width: '100%', height: 'auto', display: 'block' }} />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent opacity-20"></div>
            </motion.div>
          </FadeInSection>
          <FadeInSection>
            <p className="text-center text-slate-400 mt-8 max-w-2xl mx-auto">
              Beautiful, intuitive dashboard. Track every proposal. See who opened it, how long they spent on pricing, and when they accept. All in real-time.
            </p>
          </FadeInSection>
        </div>
      </section>

      {/* Why Different */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <FadeInSection><h2 className="text-4xl md:text-5xl font-bold mb-16 text-center">Why Torvionyx Is Different</h2></FadeInSection>
          <StaggerContainer>
            <div className="grid md:grid-cols-2 gap-8">
              {[
                { title: 'Speed', desc: '60 seconds from brief to proposal.' },
                { title: 'Beautiful', desc: 'Your proposals look like they came from a top agency.' },
                { title: 'Smart', desc: 'See who opened your proposal and how long they spent on pricing.' },
                { title: 'Yours', desc: 'Your branding. Your voice. Your proposals. No software company in the middle.' },
              ].map((feature, idx) => (
                <StaggerItem key={idx}>
                  <div className="p-8 rounded-lg border border-slate-800 hover:border-cyan-500/50 transition-colors">
                    <h3 className="text-2xl font-bold text-cyan-400 mb-3">{feature.title}</h3>
                    <p className="text-slate-400">{feature.desc}</p>
                  </div>
                </StaggerItem>
              ))}
            </div>
          </StaggerContainer>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="max-w-4xl mx-auto">
          <FadeInSection><h2 className="text-4xl md:text-5xl font-bold mb-16 text-center">Common Questions</h2></FadeInSection>
          <StaggerContainer>
            <div className="space-y-8">
              {[
                { q: 'How good is the AI?', a: 'Good enough that most proposals need only light editing. The better your brief, the better the output.' },
                { q: 'Can I customize the look?', a: 'Yes. Add your logo, pick your colours, choose your font. Your proposals are fully branded.' },
                { q: 'What about pricing?', a: 'Just mention it in your brief. Torvionyx pulls it into the pricing section automatically.' },
                { q: 'Can I export as PDF?', a: 'Yes. One click. Perfect for printing or sending via email.' },
                { q: 'Who owns the proposals?', a: 'You do. 100%. We never use your proposals as training data or examples.' },
              ].map((faq, idx) => (
                <StaggerItem key={idx}>
                  <div>
                    <h3 className="text-lg font-bold text-cyan-400 mb-3">{faq.q}</h3>
                    <p className="text-slate-400">{faq.a}</p>
                  </div>
                </StaggerItem>
              ))}
            </div>
          </StaggerContainer>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <FadeInSection><h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to stop writing proposals?</h2></FadeInSection>
          <FadeInSection>
            <p className="text-xl text-slate-400 mb-8">Join the beta today. Its free. No credit card required. Start generating beautiful proposals in minutes.</p>
          </FadeInSection>
          <FadeInSection>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/sign-up" className="px-8 py-4 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold rounded-lg transition-colors text-center">Sign Up Free</a>
              <a href="/sign-in" className="px-8 py-4 border border-slate-700 hover:border-slate-600 text-white font-bold rounded-lg transition-colors text-center">Sign In</a>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-4 sm:px-6 lg:px-8 bg-slate-950/50">
        <div className="max-w-6xl mx-auto text-center text-slate-500 text-sm space-y-3">
          <p>© 2026 Torvionyx. Building tools for freelancers who want to focus on work, not paperwork.</p>
          <div className="flex items-center justify-center gap-6">
            <a href="/privacy-policy" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-slate-300 transition-colors">Terms of Use</a>
            <a href="#" className="termly-display-preferences hover:text-slate-300 transition-colors">Consent Preferences</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
