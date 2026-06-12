import type { Metadata } from "next";
import { ProgrammeLanding } from "../../components/programme-landing";
import { requireProgramme } from "../../lib/copy/programmes";

const programme = requireProgramme("exhale");

export const metadata: Metadata = {
  title: programme.name,
  description: programme.subhead,
};

export default function Page() {
  return <ProgrammeLanding programme={programme} />;
}
