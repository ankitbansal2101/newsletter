import type { Metadata } from "next";
import Studio from "../components/Studio";

export const metadata: Metadata = {
  title: "Sunday Data Studio",
  description: "Turn a human draft and current Ostrich signals into a researched Sunday Data issue.",
};

export default function StudioPage() {
  return <Studio />;
}
