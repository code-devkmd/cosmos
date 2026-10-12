export function getItemInfo(item) {
  const metadata = item.data?.[0] || {};

  return {
    id: metadata.nasa_id || item.href,
    title: metadata.title || "Untitled NASA asset",
    description:
      metadata.description || "No description is available for this archive item.",
    date: metadata.date_created,
    center: metadata.center,
    mediaType: metadata.media_type || "image",
    preview:
      item.links?.find((link) => link.render === "image")?.href ||
      item.links?.[0]?.href,
  };
}
