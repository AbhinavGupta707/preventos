// WP3.1 — SEO content hub articles. Claims-linted like all web copy.
// DRAFT status: nothing here ships to real users without a sign-off registry
// entry (safety invariant 3); the hub is gated behind the same launch review.

export interface Article {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly vertical: "smoking" | "vaping" | "alcohol" | "sleep";
  readonly status: "DRAFT";
  readonly paragraphs: readonly string[];
  readonly relatedTool?: { readonly href: string; readonly label: string };
}

export const ARTICLES: readonly Article[] = [
  {
    slug: "what-smoking-costs",
    title: "What is smoking really costing you?",
    description: "The average UK pack price makes the maths stark — here's how to work out your own number.",
    vertical: "smoking",
    status: "DRAFT",
    paragraphs: [
      "A pack of 20 cigarettes in the UK now costs around £15. At ten a day that's roughly £225 a month; at twenty a day it's about £450 a month, or £5,400 a year.",
      "Most people underestimate their own figure because the spend arrives in small, forgettable amounts. Working it out once — your real daily count, your real pack price — turns an abstract habit into a concrete number.",
      "People who set a quit date and plan for their trigger moments give themselves a much better chance than going in cold. Support from your local stop smoking service, your GP or a pharmacist improves the odds further.",
    ],
    relatedTool: { href: "/tools/savings-calculator", label: "Work out your number with the savings calculator" },
  },
  {
    slug: "uk-alcohol-units-explained",
    title: "UK alcohol units, explained",
    description: "One unit is 10ml of pure alcohol. Here's how that maps to the drinks you actually order.",
    vertical: "alcohol",
    status: "DRAFT",
    paragraphs: [
      "One UK unit is 10ml (8g) of pure alcohol. The maths for any drink: volume in millilitres × ABV percentage ÷ 1,000. A pint of 4% beer is 568 × 4 ÷ 1,000 — about 2.3 units. A medium 175ml glass of 13% wine is also about 2.3 units. A 25ml single spirit at 40% is exactly 1 unit.",
      "The UK Chief Medical Officers' low-risk guideline is not more than 14 units a week for both men and women, spread over three or more days, with several drink-free days. There is no completely risk-free level of drinking — the guideline marks where risks stay low, not where they vanish.",
      "Counting units for a single ordinary week is the quickest way to see where you stand. Most people find the total lands higher than they guessed, and that one honest week is a better starting point than any resolution.",
    ],
    relatedTool: { href: "/steady", label: "See how Steady tracks units for you" },
  },
  {
    slug: "what-is-sleep-debt",
    title: "What is sleep debt?",
    description: "The gap between the sleep you need and the sleep you get, and why it builds quietly.",
    vertical: "sleep",
    status: "DRAFT",
    paragraphs: [
      "Most adults need somewhere between seven and nine hours of sleep a night. Sleep debt is the running gap between what you need and what you actually get: lose an hour a night for a week and you're carrying a seven-hour debt by Sunday.",
      "Small nightly shortfalls are easy to ignore because each one feels survivable. The effects show up in the aggregate — concentration, mood, and how often you reach for caffeine or a nap.",
      "The practical first step is simply measuring: a week of honest numbers about when you got into bed, when you fell asleep, and when you got up. A consistent wake time, a wind-down routine, and keeping the bed for sleep are the habits with the strongest track record. If you're worried about your sleep, speak to your GP.",
    ],
    relatedTool: { href: "/tools/sleep-debt", label: "Estimate your week with the sleep-debt calculator" },
  },
  {
    slug: "why-cravings-pass",
    title: "Nicotine cravings: why they pass",
    description: "Cravings peak and fade in minutes. Knowing the shape of the wave changes how you ride it.",
    vertical: "vaping",
    status: "DRAFT",
    paragraphs: [
      "A nicotine craving typically builds, peaks and fades within a few minutes — even if you do nothing at all. What makes cravings feel endless is attention: watching a craving stretches it.",
      "The most reliable tactics are mechanical, not heroic: change rooms, drink water slowly, breathe out longer than you breathe in, or start any two-minute task. The point isn't distraction for its own sake — it's giving the wave time to break.",
      "Cravings also cluster around predictable moments: the first coffee, the commute, stepping outside at a party. Mapping your own top three moments and pre-deciding what you'll do in each one removes the negotiation when the moment arrives.",
    ],
    relatedTool: { href: "/quitkit", label: "See how QuitKit handles craving moments" },
  },
];

export function articleBySlug(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}
