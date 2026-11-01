# Scribble: monetization plan

Agreed with the owner on 31 October 2026. Strategy in one line: **turn Scribble's pause-and-write method into a paid Chrome extension that sits beside the video, sold by self-serve checkout, with no servers and no manual payment checks.**

The Scribble web app at https://876lab.github.io/Scribble/ stays free and keeps the rules in `ROADMAP.md`. The paid extension is a separate product in its own **private** repository, with its own rules, because a paid version cannot live in a public repo and this repo's rules ban paid services.

## The product

**Scribble for video lessons** (working title; see "Names" below). A Chrome extension that docks Scribble's notes panel beside a YouTube video (later Coursera and Udemy).

- Reads the real video time, so there is no manual lesson clock.
- The pause reminder actually pauses the video; "Missed that" jumps back 30 seconds.
- Notes, quiz and review data stay on the user's device (`chrome.storage`). No accounts, no servers, no AI bills.

## Business model

| Tier | What's in it | Price |
|---|---|---|
| Free | Notes beside the video with the real video time, pause reminders, "Missed that", Markdown export | $0 |
| Pro | Everything that helps you remember it for the test: Quiz me, brain dump, flashcards, spaced review across days, Anki export, course library and search; later Coursera and Udemy | $4.99/month or **$29/year** (push yearly) |

- **Why yearly:** Lemon Squeezy charges 5% + $0.50 per sale plus small surcharges (0.5% subscriptions, 1.5% non-US buyers). That is about 16% of a $4.99 monthly charge but about 8% of a $29 yearly one. Non-US bank payouts cost another 1%.
- **Costs:** a one-time $5 Chrome Web Store fee and a domain (about $12/year). No hosting.
- **What it could earn (a guess, not data):** 10,000 installs × 3% paying × $29/year ≈ $8,700/year, about $700/month.

## Collecting payments

- **Stripe is not open to Jamaica-based businesses**, so Stripe-based tools such as ExtensionPay are out.
- **Lemon Squeezy** lists Jamaica for bank payouts and is the merchant of record: it collects sales tax and VAT worldwide for us.
- **Signup:** a business questionnaire and ID check (about 2–3 business days); new stores start in test mode.
- **Payouts:** twice a month, $50 minimum, 1% fee for non-US banks. Receive into a Jamaican USD account.
- **Unlocking Pro:** Lemon Squeezy issues a license key at checkout; the user pastes it into the extension, which checks it with Lemon Squeezy's license API. Allow a few days' offline grace so a lost connection never locks anyone out.
- **Before launch:** test purchase, cancellation, expiry, refund and reactivation in test mode. Reviews of Lemon Squeezy note conflicting docs on access after an unpaid renewal, so confirm with support.

## Marketing (starts at $0)

1. **Chrome Web Store listing:** written around what people search ("YouTube notes", "timestamp notes", "study"), with the walkthrough video and real screenshots.
2. **The owner's own story:** he is the user. Short videos ("I can't listen and write at the same time, so I built this") for StudyTok and ADHD TikTok.
3. **Communities:** r/GetStudying, r/studytips, r/Anki. r/ADHD has strict self-promotion rules: lead with the method, not the link.
4. **Affiliates:** Lemon Squeezy's built-in affiliate program, about 30% to study creators and ADHD coaches. The most passive growth channel.
5. **Timing:** launch before the January semester; push again in August–September.
6. **Jamaica first for word of mouth:** UWI, UTech, HEART/NSTA online courses, CSEC/CAPE students.

## Competition

- **Basic timestamp-note extensions** (YiNote, Rocket Note, several "YouTube Timestamp Notes"): free or about $5/month, no learning method.
- **AI summarizers** (NoteGPT and Eightify at about $9.99/month, Glasp, TubeNotes): help you skip the video, a different job from learning it.
- **Built-in options:** YouTube's own AI summaries; course sites' basic notes.
- **The gap:** nobody sells a method for distracted learners: pause, write one line, then quiz yourself. Research favours active recall over rereading summaries (see README, "Why it works this way").

## Competitive advantage (honest)

The features can be copied in a month, so the advantage has to come from elsewhere:

1. **Own the niche:** "the anti-summarizer for distracted learners", backed by the research already in the README.
2. **Lower costs:** no AI or server bills, so $29/year is profitable while AI tools cost about $120/year.
3. **Faster updates:** weekly automated runs ship improvements for almost nothing.
4. **Advantages that build over time:** store reviews and ratings, affiliate partners, and each user's lesson history and review schedule.

## Legal and formal must-dos

- **Chrome Web Store trader status:** every developer must declare trader or non-trader. A trader's address and SMS-verified phone number are shown publicly on the listing, so use a business address.
- **Names:** no "YouTube" in the product name ("works with YouTube" in the description is the safe form). "Scribble" is widely used: run a trademark check before investing in the brand.
- **No health claims:** never say it treats ADHD. Say it's built for people who find it hard to listen and write at once.
- **Jamaica:** register a business name with the Companies Office of Jamaica; declare the income to TAJ as self-employed income; have an accountant confirm the GCT position and statutory contributions.
- **Privacy policy, terms and refund policy** published before launch. Keeping data on the device keeps the privacy policy simple.
- **Private code:** the paid extension lives in a private repository.
- **Platform risk:** YouTube page changes can break the extension. A daily GitHub check must test it against the live site and email the owner on failure.

## 10-step plan: build to launch

Target: public launch in the **first week of January 2027**, before the semester starts.

| # | Step | When | Who | Done when |
|---|---|---|---|---|
| 1 | **Business basics.** Pick the name and run a trademark search; register the business name with the Companies Office; open or confirm a USD bank account; book a short call with an accountant (income tax, GCT, NIS/NHT). | Nov 2–8 | Owner | Name chosen and registered |
| 2 | **Accounts.** Chrome Web Store developer account ($5, trader declaration with a business address); Lemon Squeezy store (ID check); buy the domain. | Nov 2–8 | Owner | Both accounts verified |
| 3 | **Private repo and rules.** Owner creates the private repo; Claude sets up the Manifest V3 skeleton, build script, tests, GitHub checks and a ROADMAP with the extension's own rules. | Nov 9–15 | Owner creates repo, Claude builds | Empty extension loads in Chrome; checks pass |
| 4 | **Free version.** Side panel on YouTube reading the real video time; pause reminder that pauses the video; "Missed that" rewinds 30s; notes saved on the device; Markdown export. Reuse Scribble's code and note types. | Nov 9–22 | Claude, owner tests | Owner takes notes on a real lesson without the web app |
| 5 | **Pro features.** Quiz me, brain dump, flashcards, spaced review, Anki export, course library and search, behind a Pro check. | Nov 23–Dec 6 | Claude, owner tests | Owner uses Pro to study for a real test |
| 6 | **Payments and licensing.** Lemon Squeezy products (monthly and yearly) with license keys; activation screen; offline grace; test-mode purchase, cancel, refund and expiry. | Dec 7–13 | Claude builds, owner sets up products | A test purchase unlocks Pro; a cancelled one locks it at period end |
| 7 | **Quality and policies.** Daily GitHub check against live YouTube; privacy policy, terms and refund pages on the Scribble site; Chrome Web Store data-use disclosures. | Dec 7–13 | Claude drafts, owner reviews | All checks pass; pages live |
| 8 | **Private beta.** Unlisted store listing for 10–20 students (friends, UWI/UTech, online-course classmates), free Pro codes, a feedback link. Fix the top issues. Collect real testimonials, with permission. | Dec 14–Jan 3 | Owner recruits, Claude fixes | Most testers still use it in week 2 |
| 9 | **Launch kit.** Final listing copy and screenshots, a new walkthrough video, 5–10 short videos ready to post, affiliate program set to 30%, a simple landing page. Submit to Chrome Web Store review early, since review can take days. | Dec 21–Jan 3 | Together | Listing approved (still unlisted) |
| 10 | **Public launch.** Make the listing public; post the short videos; Reddit study communities; Product Hunt; message study creators and ADHD coaches about the affiliate program. Then weekly update runs, with a 30-day and 90-day review of installs, conversion and refunds. | Jan 4–10, 2027 | Together | First paying customers; 30-day review booked |

After launch: Coursera and Udemy support, then other browsers (Edge first, since it runs Chrome extensions).

## Sources

- Lemon Squeezy supported countries: https://docs.lemonsqueezy.com/help/getting-started/supported-countries
- Lemon Squeezy fees, payouts and signup (review, Sept 2026): https://www.builtbyfoundry.io/blog/lemon-squeezy-review-2026-5-checks-before-switching
- Chrome Web Store trader FAQ: https://developer.chrome.com/docs/webstore/program-policies/trader-verification-faq
- Chrome Web Store registration: https://developer.chrome.com/docs/webstore/register
- Stripe from Jamaica via a US company: https://www.zenind.com/help/post/how-jamaican-entrepreneurs-can-open-a-stripe-account-with-a-u-s-company
- YouTube note-taking extensions compared: https://www.notelm.ai/best-of/best-note-taking-extensions
- TubeNotes: https://www.producthunt.com/products/transcriptai-youtube-note-taking/launches/tubenotes-youtube-note-taking
- Glasp vs YouTube's built-in AI summary: https://glasp.ai/youtube-summary-vs-youtube-ai-summary
