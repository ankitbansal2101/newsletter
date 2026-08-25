export type ResearchMaterial = {
  id: string;
  type: "article" | "quote" | "stat" | "image" | "meme";
  title: string;
  text?: string;
  url?: string;
  imageUrl?: string;
  credit?: string;
  source?: string;
};
