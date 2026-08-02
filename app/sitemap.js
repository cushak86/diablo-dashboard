// 페이지 목록·lastModified·제외 정책의 정본은 `lib/site-pages.js`다 — llms.txt 와 공유한다(둘이 갈라지지 않게).
// 페이지를 추가하거나 변경일을 갱신하려면 여기가 아니라 그 파일을 고친다.
import { BASE, SITE_PAGES } from "../lib/site-pages";

export default function sitemap() {
  return SITE_PAGES.map(({ path, lastModified, changeFrequency, priority }) => ({
    url: `${BASE}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
