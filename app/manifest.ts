import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "STEAL",
    short_name: "STEAL",
    description: "Private shared training app for Joshua and Natasha.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#090a0d",
    theme_color: "#090a0d",
    categories: ["health", "fitness", "lifestyle"],
    icons: [
      {
        src: "/icon?size=192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon?size=512",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon?size=512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcuts: [
      {
        name: "Joshua",
        short_name: "Joshua",
        url: "/?profile=joshua",
      },
      {
        name: "Natasha",
        short_name: "Natasha",
        url: "/?profile=natasha",
      },
    ],
  };
}
