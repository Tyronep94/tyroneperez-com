import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PortfolioFilter } from "@/components/public/portfolio-filter";
import type { PortfolioItem } from "@/content/public-site";
import { getCollectionPortfolio } from "@/lib/database/cms";
import { publicMetadata } from "@/lib/seo";
import { portfolioAudioMedia } from "@/types/cms";

export const dynamic = "force-dynamic";
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const result=await getCollectionPortfolio((await params).slug);
  return result ? publicMetadata(`${result.collection.name} Portfolio`,result.collection.description ?? `Selected ${result.collection.name} work.`,`/portfolio/collection/${result.collection.slug}`) : {};
}
export default async function CollectionPage({params}:{params:Promise<{slug:string}>}){
  const result=await getCollectionPortfolio((await params).slug);
  if(!result)notFound();
  const items:PortfolioItem[]=result.entries.map((item,index)=>({slug:item.slug,title:item.title,category:item.category?.toLowerCase()==="music"?"Music":"Photography",description:item.excerpt??"",longDescription:item.excerpt??"",mediaType:Boolean(item.media_type)||item.kind==="song"||item.kind==="album"?"audio":"image",client:"",featured:item.featured,sortOrder:index,format:"landscape",palette:"noir",coverAsset:item.cover_asset??undefined,audioArtworkAsset:item.audio_artwork_asset??undefined,audioAsset:item.audio_asset??undefined,audioMedia:portfolioAudioMedia(item)??undefined}));
  return <main id="main-content"><section className="index-hero"><div className="public-container index-hero__grid"><p className="public-kicker">Portfolio collection</p><h1>{result.collection.name}</h1><p>{result.collection.description ?? "A selected collection of work."}</p></div></section><section className="portfolio-index public-section"><div className="public-container"><Link href="/portfolio" className="public-text-link">← All work</Link>{items.length?<PortfolioFilter items={items}/>:<div className="replacement-note">No published galleries in this collection yet.</div>}</div></section></main>;
}
