"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { track } from "../lib/track";

type Status = "idle" | "submitting" | "joined" | "error";

export function WaitlistForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus("submitting");
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: data.get("email"),
          programme: data.get("programme"),
          website: data.get("website"), // honeypot
        }),
      });
      const payload: { success: boolean; error?: string } = await response.json();
      if (!payload.success) {
        setStatus("error");
        setMessage(payload.error ?? "Something went wrong — please try again.");
        return;
      }
      track("waitlist_joined", { programme: String(data.get("programme") ?? "unsure") });
      setStatus("joined");
      form.reset();
    } catch {
      setStatus("error");
      setMessage("We couldn't reach the server — please try again in a moment.");
    }
  }

  if (status === "joined") {
    return (
      <p className="notice" role="status">
        You're on the list. We'll email you when your programme opens — nothing else, no marketing drip.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} aria-label="Join the waitlist">
      <div className="field">
        <label htmlFor="waitlist-email">Email address</label>
        <input id="waitlist-email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="field">
        <label htmlFor="waitlist-programme">Which programme interests you most?</label>
        <select id="waitlist-programme" name="programme" defaultValue="unsure">
          <option value="unsure">Not sure yet</option>
          <option value="quitkit">QuitKit — quit smoking</option>
          <option value="exhale">Exhale — step down vaping</option>
          <option value="steady">Steady — drink less</option>
          <option value="nightshift">Nightshift — sleep better</option>
        </select>
      </div>
      <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
        <label htmlFor="waitlist-website">Leave this field empty</label>
        <input id="waitlist-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <button className="button" type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Joining…" : "Join the waitlist"}
      </button>
      {status === "error" ? (
        <p role="alert" style={{ color: "#a33" }}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
