export interface PushDelivery {
  readonly token: string;
  readonly title: string;
  readonly body: string;
  readonly data?: Readonly<Record<string, string>>;
}

export type PushDeliveryResult =
  | { readonly status: "skipped"; readonly reason: "noop-provider" }
  | { readonly status: "sent"; readonly providerMessageId: string };

export interface PushDeliveryProvider {
  readonly name: string;
  send(delivery: PushDelivery): Promise<PushDeliveryResult>;
}

/** CI/local default: a configured provider surface that never calls Expo/APNS/FCM. */
export class NoopPushProvider implements PushDeliveryProvider {
  readonly name = "noop";

  send(_delivery: PushDelivery): Promise<PushDeliveryResult> {
    return Promise.resolve({ status: "skipped", reason: "noop-provider" });
  }
}

export function buildPushProvider(env: NodeJS.ProcessEnv = process.env): PushDeliveryProvider {
  const provider = env["PUSH_PROVIDER"] ?? "noop";
  if (provider === "" || provider === "noop" || provider === "disabled") return new NoopPushProvider();
  throw new Error(`Unsupported PUSH_PROVIDER "${provider}". Only noop is available in this build.`);
}
