"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

// A Link for lists of pages (albums, playlists, posts). A plain Link
// downloads every page it shows in the background, which was 20+ extra
// downloads per home page visit; this one only gets a page ready once the
// visitor points at it, touches it or tabs to it, so the click still feels
// instant.
export default function QuietLink({ href, onMouseEnter, onTouchStart, onFocus, ...props }) {
  const router = useRouter();
  const warm = (handler) => (event) => {
    router.prefetch(href);
    handler?.(event);
  };
  return (
    <Link
      href={href}
      prefetch={false}
      onMouseEnter={warm(onMouseEnter)}
      onTouchStart={warm(onTouchStart)}
      onFocus={warm(onFocus)}
      {...props}
    />
  );
}
