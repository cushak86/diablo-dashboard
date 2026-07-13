import { notFound } from "next/navigation";
import { getRedis } from "../../../lib/redis";
import { sanitizeId } from "../../../lib/docs";
import Markdown from "../../components/Markdown";

export const dynamic = "force-dynamic";

async function loadDoc(rawId) {
  const redis = getRedis();
  const id = sanitizeId(rawId);
  if (!redis || !id) return null;
  return redis.get(`doc:${id}`);
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const doc = await loadDoc(id);
  return {
    title: doc ? doc.title : "문서를 찾을 수 없음",
    robots: { index: false, follow: true },
  };
}

export default async function DocPage({ params }) {
  const { id } = await params;
  const doc = await loadDoc(id);
  if (!doc) notFound();

  return (
    <main>
      <div className="wrap stack">
        <div className="card">
          <div className="eyebrow gold">문서</div>
          <h1 className="zname">{doc.title}</h1>
        </div>
        <div className="card md-body">
          <Markdown>{doc.content}</Markdown>
        </div>
      </div>
    </main>
  );
}
