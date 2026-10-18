import { createFileRoute } from "@tanstack/react-router";
import { useExperience } from "@/components/experience";

export const Route = createFileRoute("/games")({
  head: () => ({ meta: [
    { title: "Games — Mint Press" },
    { name: "description", content: "Coming soon: game-based token distributions powered by attention and fun." },
    { property: "og:title", content: "Games — Mint Press" },
    { property: "og:description", content: "Coming soon: collaborative puzzle drops and game-based token distribution." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: GamesPage,
});

function GamesPage() {
  const { text } = useExperience();
  return <div className="mx-auto max-w-3xl px-6 py-16">
    <p className="mb-4 font-mono text-xs uppercase text-primary">MINT/PRESS · {text("Coming soon", "Coming soon 🚧")}</p>
    <h1 className="text-5xl font-bold leading-tight">{text("Games", "Games 🎮")}</h1>
    <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{text(
      "Soon we will add games that combine with token distributions — a new distribution method based on attention and fun. Example: 1,000 puzzle pieces are given away as tokens or fractional NFT shares. Players have to find each other and combine their pieces; every merged piece leaves behind a ghost copy as proof of participation. Once all 1,000 pieces come together, a prize unlocks — maybe an airdrop for everyone who helped.",
      "Soon you'll be able to play games to win coins! Imagine 1,000 puzzle pieces shared out as treasure. Friends team up to put the puzzle together, and each piece leaves a ghost sticker so you can prove you helped. When all 1,000 pieces join, a big surprise prize opens — maybe treats for everyone!",
    )}</p>
  </div>;
}
